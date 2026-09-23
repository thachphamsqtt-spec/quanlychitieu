import React, { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck, Wallet as WalletIcon, AlertCircle } from 'lucide-react';
import { Wallet } from '../types/expense';
import { useExpense } from '../context/ExpenseContext';
import { calculateMinimumDue } from '../utils/creditCard';
import { triggerHaptic } from '../utils/formatters';

interface CreditCardRepayModalProps {
  card: Wallet;
  isOpen: boolean;
  onClose: () => void;
  onRepaySuccess?: () => void;
}

export const CreditCardRepayModal: React.FC<CreditCardRepayModalProps> = ({
  card,
  isOpen,
  onClose,
  onRepaySuccess,
}) => {
  const { wallets, addTransaction, formatMoney } = useExpense();

  const outstandingDebt = Math.abs(card.balance < 0 ? card.balance : 0);
  const minimumDue = calculateMinimumDue(card);

  // Available source wallets (exclude this credit card and other cards with no balance)
  const sourceWallets = wallets.filter(w => w.id !== card.id && w.balance > 0);

  const [selectedSourceId, setSelectedSourceId] = useState<string>(() => {
    return sourceWallets[0]?.id || '';
  });

  const [repayType, setRepayType] = useState<'full' | 'minimum' | 'custom'>('full');
  const [customAmount, setCustomAmount] = useState<number>(outstandingDebt);
  const [note, setNote] = useState<string>(`Thanh toán dư nợ ${card.name}`);

  if (!isOpen) return null;

  const getTargetAmount = () => {
    if (repayType === 'full') return outstandingDebt;
    if (repayType === 'minimum') return minimumDue;
    return customAmount;
  };

  const payAmount = getTargetAmount();
  const selectedSourceWallet = wallets.find(w => w.id === selectedSourceId);
  const isSourceBalanceSufficient = selectedSourceWallet ? selectedSourceWallet.balance >= payAmount : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      alert('Vui lòng nhập số tiền thanh toán hợp lệ lớn hơn 0');
      return;
    }
    if (!selectedSourceId) {
      alert('Vui lòng chọn ví nguồn để trích tiền thanh toán');
      return;
    }
    if (!isSourceBalanceSufficient) {
      alert(`Số dư trong "${selectedSourceWallet?.name}" không đủ để thanh toán số tiền này.`);
      return;
    }

    // Create a transfer transaction from source wallet to credit card wallet
    const today = new Date().toISOString().split('T')[0];
    addTransaction({
      type: 'transfer',
      amount: payAmount,
      walletId: selectedSourceId,
      toWalletId: card.id,
      categoryId: 'cat_bills',
      date: today,
      note: note.trim() || `Thanh toán thẻ ${card.name}`,
    });

    triggerHaptic('success');
    if (onRepaySuccess) onRepaySuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: card.color || '#4338ca' }}
            >
              <WalletIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Thanh Toán Dư Nợ Thẻ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {card.name} {card.accountNumber ? `(•••• ${card.accountNumber})` : ''}
              </p>
            </div>
          </div>
          <button
            id="close-repay-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center transition hover:bg-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Debt Summary Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Tổng dư nợ cần trả
              </span>
              <div className="text-2xl font-black text-indigo-950 dark:text-indigo-200">
                {formatMoney(outstandingDebt)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Tối thiểu kỳ này
              </span>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {formatMoney(minimumDue)}
              </div>
            </div>
          </div>

          {/* Amount Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Chọn mức thanh toán
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRepayType('full');
                  setCustomAmount(outstandingDebt);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  repayType === 'full'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    Toàn bộ
                  </span>
                  {repayType === 'full' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Miễn 100% lãi
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                  {formatMoney(outstandingDebt)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRepayType('minimum');
                  setCustomAmount(minimumDue);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  repayType === 'minimum'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Tối thiểu (5%)
                  </span>
                  {repayType === 'minimum' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tránh phạt phí
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                  {formatMoney(minimumDue)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRepayType('custom')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  repayType === 'custom'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/50 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tùy chọn
                  </span>
                  {repayType === 'custom' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tự nhập số tiền
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                  Khác
                </span>
              </button>
            </div>
          </div>

          {/* Custom Amount Input if chosen */}
          {repayType === 'custom' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Nhập số tiền muốn trả (VNĐ)
              </label>
              <input
                id="custom-repay-amount-input"
                type="number"
                min="1000"
                max={outstandingDebt}
                value={customAmount || ''}
                onChange={e => setCustomAmount(Number(e.target.value) || 0)}
                placeholder="Nhập số tiền..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Source Wallet Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Trích tiền từ tài khoản / ví
            </label>
            {sourceWallets.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Không có ví nào có số dư khả dụng. Vui lòng nạp thêm tiền vào ví tiền mặt hoặc ngân hàng trước.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {sourceWallets.map(w => {
                  const isSelected = w.id === selectedSourceId;
                  const isEnough = w.balance >= payAmount;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedSourceId(w.id)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 ring-1 ring-indigo-500/30'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                          style={{ backgroundColor: w.color }}
                        >
                          {w.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {w.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Số dư: <span className="font-semibold text-emerald-600">{formatMoney(w.balance)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        {!isEnough && (
                          <span className="text-[10px] text-rose-500 font-bold block">
                            Không đủ số dư
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Ghi chú giao dịch
            </label>
            <input
              id="repay-note-input"
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Thanh toán nợ thẻ tín dụng..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Security & Result Preview */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Kết quả sau thanh toán:</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Dư nợ thẻ còn lại:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatMoney(Math.max(0, outstandingDebt - payAmount))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Hạn mức khả dụng được hồi lại:</span>
              <span className="font-bold text-emerald-600">
                +{formatMoney(payAmount)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="confirm-repay-btn"
              type="submit"
              disabled={payAmount <= 0 || !isSourceBalanceSufficient || !selectedSourceId}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <span>Xác nhận thanh toán {formatMoney(payAmount)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
