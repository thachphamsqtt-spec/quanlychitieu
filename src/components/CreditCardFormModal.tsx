import React, { useState } from 'react';
import { X, CreditCard, Shield, Sparkles } from 'lucide-react';
import { Wallet, CardNetwork } from '../types/expense';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';

interface CreditCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: Wallet | null;
}

const CARD_THEMES = [
  { name: 'Indigo Sapphire', color: '#4338ca', gradient: 'from-indigo-600 via-indigo-700 to-slate-900' },
  { name: 'Emerald Velvet', color: '#059669', gradient: 'from-emerald-600 via-teal-700 to-slate-900' },
  { name: 'Obsidian Black', color: '#0f172a', gradient: 'from-slate-800 via-slate-900 to-black' },
  { name: 'Rose Platinum', color: '#db2777', gradient: 'from-pink-600 via-rose-700 to-slate-900' },
  { name: 'Sunset Amber', color: '#d97706', gradient: 'from-amber-600 via-orange-700 to-slate-900' },
  { name: 'Deep Teal', color: '#0f766e', gradient: 'from-teal-600 via-cyan-800 to-slate-900' },
];

const VIETNAM_POPULAR_BANKS = [
  'VPBank',
  'Techcombank',
  'VIB',
  'Vietcombank',
  'MB Bank',
  'TPBank',
  'ACB',
  'Sacombank',
  'HSBC',
  'Shinhan Bank',
  'BIDV',
  'Agribank',
];

export const CreditCardFormModal: React.FC<CreditCardFormModalProps> = ({
  isOpen,
  onClose,
  cardToEdit,
}) => {
  const { addWallet, updateWallet } = useExpense();

  const isEditing = Boolean(cardToEdit);

  const [name, setName] = useState(cardToEdit?.name || '');
  const [bankName, setBankName] = useState(cardToEdit?.bankName || 'VPBank');
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>(cardToEdit?.cardNetwork || 'visa');
  const [last4Digits, setLast4Digits] = useState(cardToEdit?.accountNumber || '8888');
  const [cardHolderName, setCardHolderName] = useState(cardToEdit?.cardHolderName || 'CHỦ THẺ');
  const [creditLimit, setCreditLimit] = useState<number>(cardToEdit?.creditLimit || 30000000);
  const [initialDebt, setInitialDebt] = useState<number>(
    cardToEdit ? Math.abs(cardToEdit.balance < 0 ? cardToEdit.balance : 0) : 0
  );
  const [statementDate, setStatementDate] = useState<number>(cardToEdit?.statementDate || 20);
  const [paymentDueDate, setPaymentDueDate] = useState<number>(cardToEdit?.paymentDueDate || 5);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(cardToEdit?.gracePeriodDays || 45);
  const [interestRateAnnual, setInterestRateAnnual] = useState<number>(cardToEdit?.interestRateAnnual || 32);
  const [cashbackNote, setCashbackNote] = useState(cardToEdit?.cashbackNote || '');
  const [color, setColor] = useState(cardToEdit?.color || '#4338ca');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên thẻ tín dụng');
      return;
    }
    if (creditLimit <= 0) {
      alert('Vui lòng nhập hạn mức tín dụng hợp lệ lớn hơn 0');
      return;
    }

    const cleaned4Digits = last4Digits.replace(/\D/g, '').slice(-4);
    // Negative balance represents used credit (debt)
    const finalBalance = initialDebt > 0 ? -initialDebt : 0;

    if (isEditing && cardToEdit) {
      updateWallet(cardToEdit.id, {
        name: name.trim(),
        color,
        accountNumber: cleaned4Digits || undefined,
        creditLimit,
        statementDate,
        paymentDueDate,
        gracePeriodDays,
        cardNetwork,
        bankName,
        cardHolderName: cardHolderName.trim().toUpperCase(),
        interestRateAnnual,
        cashbackNote: cashbackNote.trim(),
        balance: cardToEdit.balance !== 0 ? cardToEdit.balance : finalBalance,
      });
    } else {
      addWallet({
        name: name.trim(),
        type: 'credit_card',
        balance: finalBalance,
        icon: 'CreditCard',
        color,
        accountNumber: cleaned4Digits || '0000',
        creditLimit,
        statementDate,
        paymentDueDate,
        gracePeriodDays,
        cardNetwork,
        bankName,
        cardHolderName: cardHolderName.trim().toUpperCase(),
        interestRateAnnual,
        cashbackNote: cashbackNote.trim(),
        minimumPaymentPercent: 5,
      });
    }

    triggerHaptic('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Chỉnh Sửa Thẻ Tín Dụng' : 'Thêm Thẻ Tín Dụng Mới'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quản lý hạn mức, chu kỳ sao kê và lãi suất thông minh
              </p>
            </div>
          </div>
          <button
            id="close-card-form-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center transition hover:bg-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Card Preview */}
          <div
            className="p-5 rounded-2xl text-white shadow-lg space-y-4 transition-all duration-300 relative overflow-hidden"
            style={{ backgroundColor: color }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase opacity-90">
                {bankName || 'NGÂN HÀNG'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-black uppercase tracking-widest">
                {cardNetwork.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-lg font-mono font-bold tracking-widest">
                •••• •••• •••• {last4Digits ? last4Digits.slice(-4) : '••••'}
              </div>
              <div className="flex justify-between items-center text-[10px] opacity-80 uppercase tracking-wider">
                <span>{cardHolderName || 'CHỦ THẺ'}</span>
                <span>HẠN MỨC: {new Intl.NumberFormat('vi-VN').format(creditLimit)} ₫</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/20 flex justify-between text-[10px] opacity-90">
              <span>Sao kê: Ngày {statementDate}</span>
              <span>Đến hạn: Ngày {paymentDueDate}</span>
              <span>Miễn lãi: {gracePeriodDays} ngày</span>
            </div>
          </div>

          {/* Color theme selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Màu sắc thẻ
            </label>
            <div className="flex items-center gap-2">
              {CARD_THEMES.map(theme => (
                <button
                  key={theme.color}
                  type="button"
                  onClick={() => setColor(theme.color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === theme.color ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: theme.color }}
                  title={theme.name}
                />
              ))}
            </div>
          </div>

          {/* Name & Bank */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tên thẻ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="VD: VPBank StepUp, Techcombank Visa..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ngân hàng phát hành
              </label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {VIETNAM_POPULAR_BANKS.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Network & 4 digits */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mạng thẻ
              </label>
              <select
                value={cardNetwork}
                onChange={e => setCardNetwork(e.target.value as CardNetwork)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase"
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="jcb">JCB</option>
                <option value="napas">Napas</option>
                <option value="amex">Amex</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                4 số cuối thẻ
              </label>
              <input
                type="text"
                maxLength={4}
                value={last4Digits}
                onChange={e => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="6868"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tên chủ thẻ
              </label>
              <input
                type="text"
                value={cardHolderName}
                onChange={e => setCardHolderName(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Limits & Outstanding */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hạn mức tín dụng (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1000000"
                step="500000"
                value={creditLimit || ''}
                onChange={e => setCreditLimit(Number(e.target.value) || 0)}
                placeholder="30000000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Dư nợ hiện tại (nếu có)
              </label>
              <input
                type="number"
                min="0"
                step="100000"
                value={initialDebt || ''}
                onChange={e => setInitialDebt(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Cycle Dates */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thiết lập chu kỳ sao kê & Miễn lãi</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Ngày sao kê
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Ngày</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={statementDate}
                    onChange={e => setStatementDate(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Ngày đến hạn
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Ngày</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDueDate}
                    onChange={e => setPaymentDueDate(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Miễn lãi
                </label>
                <select
                  value={gracePeriodDays}
                  onChange={e => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
                >
                  <option value={45}>45 ngày</option>
                  <option value={55}>55 ngày</option>
                  <option value={30}>30 ngày</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interest & Cashback Note */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lãi suất (%/năm)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={interestRateAnnual}
                onChange={e => setInterestRateAnnual(Number(e.target.value) || 0)}
                placeholder="32"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ghi chú hoàn tiền / Ưu đãi thẻ
              </label>
              <input
                type="text"
                value={cashbackNote}
                onChange={e => setCashbackNote(e.target.value)}
                placeholder="VD: Hoàn 6% ẩm thực, miễn phí thường niên..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Hủy
            </button>
            <button
              id="save-credit-card-btn"
              type="submit"
              className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-98"
            >
              {isEditing ? 'Lưu Thay Đổi' : 'Tạo Thẻ Tín Dụng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
