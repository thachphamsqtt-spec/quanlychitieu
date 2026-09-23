import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, WalletCards, Check, Sparkles } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { SavingsGoal } from '../types/expense';
import { triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface GoalDepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  defaultAction?: 'deposit' | 'withdraw';
}

export const GoalDepositWithdrawModal: React.FC<GoalDepositWithdrawModalProps> = ({
  isOpen,
  onClose,
  goal,
  defaultAction = 'deposit',
}) => {
  const { contributeToGoal, wallets, formatMoney } = useExpense();

  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>(defaultAction);
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');

  React.useEffect(() => {
    setActionType(defaultAction);
    setAmountStr('');
    setNote('');
    if (wallets[0]) setWalletId(wallets[0].id);
  }, [isOpen, defaultAction, wallets]);

  if (!isOpen || !goal) return null;

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (actionType === 'withdraw' && amount > goal.currentAmount) {
      alert(`Số dư hiện tại của heo đất chỉ còn ${formatMoney(goal.currentAmount)}`);
      return;
    }

    contributeToGoal(
      goal.id,
      amount,
      actionType,
      walletId || undefined,
      note.trim() || undefined
    );

    triggerHaptic('success');
    onClose();
  };

  const quickChips = [500000, 1000000, 2000000, 5000000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: goal.color }}
            >
              <CategoryIcon name={goal.icon} size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{goal.name}</h2>
              <p className="text-xs text-slate-500">
                Đã có: <span className="font-bold text-teal-700">{formatMoney(goal.currentAmount)}</span> / {formatMoney(goal.targetAmount)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch between Nạp tiền (Deposit) and Rút tiền (Withdraw) */}
        <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActionType('deposit');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              actionType === 'deposit'
                ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Nạp heo đất (+)
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActionType('withdraw');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              actionType === 'withdraw'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Rút tiền (-)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {actionType === 'deposit' ? 'Số tiền muốn nạp' : 'Số tiền muốn rút'} (VNĐ)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="VD: 1000000"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-base font-bold bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                  actionType === 'deposit'
                    ? 'border-teal-200 text-teal-800 focus:ring-teal-500/20 focus:border-teal-600'
                    : 'border-amber-200 text-amber-800 focus:ring-amber-500/20 focus:border-amber-600'
                }`}
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">VNĐ</span>
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickChips.map(amt => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    triggerHaptic('light');
                    setAmountStr(amt.toString());
                  }}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition"
                >
                  +{formatMoney(amt)}
                </button>
              ))}

              {actionType === 'deposit' && remaining > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setAmountStr(remaining.toString());
                  }}
                  className="text-[11px] font-bold px-2 py-1 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Đầy heo ({formatMoney(remaining)})
                </button>
              )}
            </div>
          </div>

          {/* Select Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <WalletCards className="w-3.5 h-3.5 text-slate-400" />
              {actionType === 'deposit' ? 'Trừ tiền từ ví' : 'Cộng tiền vào ví'}
            </label>
            <select
              value={walletId}
              onChange={e => setWalletId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700 font-medium"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatMoney(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ghi chú</label>
            <input
              type="text"
              placeholder={actionType === 'deposit' ? 'VD: Trích lương tháng này' : 'VD: Dùng cho chuyến đi'}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-700"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center justify-center gap-1.5 ${
                actionType === 'deposit'
                  ? 'bg-teal-700 hover:bg-teal-800 shadow-teal-700/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              }`}
            >
              <Check className="w-4 h-4" />
              {actionType === 'deposit' ? 'Xác nhận Nạp' : 'Xác nhận Rút'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
