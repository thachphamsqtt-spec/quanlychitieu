import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, WalletCards, Sparkles, FileText, Check } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { SavingsGoal } from '../types/expense';
import { triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: SavingsGoal | null;
}

const GOAL_ICONS = [
  'Target',
  'PiggyBank',
  'Smartphone',
  'Car',
  'Plane',
  'Home',
  'ShieldCheck',
  'GraduationCap',
  'Gift',
  'Heart',
  'Laptop',
  'Sparkles',
];

const GOAL_COLORS = [
  { name: 'Xanh ngọc', value: '#0f766e', bg: 'bg-teal-500' },
  { name: 'Xanh dương', value: '#0284c7', bg: 'bg-sky-500' },
  { name: 'Xanh lá', value: '#059669', bg: 'bg-emerald-500' },
  { name: 'Tím', value: '#7c3aed', bg: 'bg-purple-500' },
  { name: 'Hồng', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Cam', value: '#ea580c', bg: 'bg-orange-500' },
  { name: 'Vàng hổ phách', value: '#d97706', bg: 'bg-amber-500' },
  { name: 'Đỏ thắm', value: '#e11d48', bg: 'bg-rose-500' },
];

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const { addSavingsGoal, updateSavingsGoal, wallets, formatMoney } = useExpense();

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Target');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0].value);
  const [note, setNote] = useState('');

  // Initial deposit fields (only when creating new goal)
  const [initialDepositStr, setInitialDepositStr] = useState('');
  const [initialWalletId, setInitialWalletId] = useState(wallets[0]?.id || '');

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetAmountStr(goalToEdit.targetAmount.toString());
      setTargetDate(goalToEdit.targetDate);
      setSelectedIcon(goalToEdit.icon);
      setSelectedColor(goalToEdit.color);
      setNote(goalToEdit.note || '');
      setInitialDepositStr('');
    } else {
      setName('');
      setTargetAmountStr('');
      // Default target date: 3 months from now
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      setTargetDate(d.toISOString().split('T')[0]);
      setSelectedIcon('PiggyBank');
      setSelectedColor(GOAL_COLORS[0].value);
      setNote('');
      setInitialDepositStr('');
      setInitialWalletId(wallets[0]?.id || '');
    }
  }, [goalToEdit, isOpen, wallets]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên mục tiêu');
      return;
    }

    const targetAmount = parseFloat(targetAmountStr);
    if (!targetAmount || targetAmount <= 0) {
      alert('Vui lòng nhập số tiền mục tiêu hợp lệ');
      return;
    }

    if (!targetDate) {
      alert('Vui lòng chọn ngày dự kiến hoàn thành');
      return;
    }

    if (goalToEdit) {
      updateSavingsGoal(goalToEdit.id, {
        name: name.trim(),
        targetAmount,
        targetDate,
        icon: selectedIcon,
        color: selectedColor,
        note: note.trim() || undefined,
      });
    } else {
      const initialDeposit = parseFloat(initialDepositStr) || 0;
      addSavingsGoal(
        {
          name: name.trim(),
          targetAmount,
          targetDate,
          icon: selectedIcon,
          color: selectedColor,
          note: note.trim() || undefined,
        },
        initialDeposit > 0 ? initialDeposit : undefined,
        initialDeposit > 0 ? initialWalletId : undefined
      );
    }

    triggerHaptic('success');
    onClose();
  };

  const quickAmounts = [5000000, 10000000, 20000000, 50000000, 100000000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            >
              <CategoryIcon name={selectedIcon} size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {goalToEdit ? 'Chỉnh sửa Mục tiêu' : 'Mục tiêu Tiết kiệm Mới'}
              </h2>
              <p className="text-xs text-slate-500">Heo đất tích lũy cho kế hoạch tương lai</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Goal Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tên mục tiêu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Mua iPhone 16 Pro, Quỹ du lịch..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium text-slate-800"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Số tiền mục tiêu (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="VD: 30000000"
                value={targetAmountStr}
                onChange={e => setTargetAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-bold text-teal-800"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">VNĐ</span>
            </div>
            {/* Quick target amount chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickAmounts.map(amt => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    triggerHaptic('light');
                    setTargetAmountStr(amt.toString());
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                    targetAmountStr === amt.toString()
                      ? 'bg-teal-50 text-teal-700 border-teal-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formatMoney(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Ngày dự kiến đạt mục tiêu <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-800 font-medium"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Biểu tượng</label>
            <div className="grid grid-cols-6 gap-2">
              {GOAL_ICONS.map(iconName => (
                <button
                  type="button"
                  key={iconName}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedIcon(iconName);
                  }}
                  className={`h-11 rounded-xl flex items-center justify-center transition border ${
                    selectedIcon === iconName
                      ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm ring-2 ring-teal-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CategoryIcon name={iconName} size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Màu sắc chủ đạo</label>
            <div className="flex flex-wrap gap-2.5">
              {GOAL_COLORS.map(c => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedColor(c.value);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition ${c.bg} ${
                    selectedColor === c.value ? 'ring-4 ring-offset-2 ring-slate-400 scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {selectedColor === c.value && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Deposit (Only when creating new goal) */}
          {!goalToEdit && (
            <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Nạp tiền khởi đầu ngay bây giờ (Tùy chọn)
              </div>
              <p className="text-[11px] text-teal-600">
                Số tiền này sẽ được trừ trực tiếp từ ví bạn chọn và ghi nhận vào heo đất.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Số tiền (VNĐ)"
                    value={initialDepositStr}
                    onChange={e => setInitialDepositStr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold text-teal-800"
                  />
                </div>
                <div>
                  <select
                    value={initialWalletId}
                    onChange={e => setInitialWalletId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-700"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatMoney(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Ghi chú thêm
            </label>
            <input
              type="text"
              placeholder="VD: Nhận lương trích ra mỗi tháng, tự thưởng sinh nhật..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-700"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {goalToEdit ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
