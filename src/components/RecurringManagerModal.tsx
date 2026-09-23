import React, { useState } from 'react';
import {
  X,
  Plus,
  Repeat,
  Calendar,
  Play,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  Edit2
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { CategoryIcon } from './CategoryIcon';
import { RecurringTransaction, RecurrenceFrequency, TransactionType } from '../types/expense';
import { triggerHaptic } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface RecurringManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecurringManagerModal: React.FC<RecurringManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    recurringTransactions,
    categories,
    wallets,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    executeRecurringNow,
    getCategoryById,
    getWalletById,
    formatMoney,
  } = useExpense();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingRec, setDeletingRec] = useState<RecurringTransaction | null>(null);

  // Form fields
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const startAdd = () => {
    triggerHaptic('light');
    setIsEditing(true);
    setEditingId(null);
    setType('expense');
    setAmountStr('');
    setCategoryId(categories.find(c => c.type === 'expense')?.id || '');
    setWalletId(wallets[0]?.id || '');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNote('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (editingId) {
      updateRecurringTransaction(editingId, {
        type,
        amount,
        categoryId,
        walletId,
        frequency,
        startDate,
        note: note.trim(),
      });
    } else {
      addRecurringTransaction({
        type,
        amount,
        categoryId,
        walletId,
        frequency,
        startDate,
        nextDueDate: startDate,
        note: note.trim(),
        isActive: true,
      });
    }

    setIsEditing(false);
    setEditingId(null);
    setSuccessMessage('Đã lưu giao dịch định kỳ!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleExecute = (rec: RecurringTransaction) => {
    executeRecurringNow(rec.id);
    setSuccessMessage(`Đã tạo giao dịch "${rec.note}" cho hôm nay!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getFrequencyLabel = (freq: RecurrenceFrequency) => {
    switch (freq) {
      case 'daily':
        return 'Hàng ngày';
      case 'weekly':
        return 'Hàng tuần';
      case 'monthly':
        return 'Hàng tháng';
      case 'yearly':
        return 'Hàng năm';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Giao Dịch Định Kỳ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && (
          <div className="mt-2 p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Type toggle */}
              <div className="bg-slate-100 p-1 rounded-2xl flex">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    const firstExp = categories.find(c => c.type === 'expense');
                    if (firstExp) setCategoryId(firstExp.id);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                    type === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Khoản Chi (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    const firstInc = categories.find(c => c.type === 'income');
                    if (firstInc) setCategoryId(firstInc.id);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                    type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Khoản Thu (+)
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 4500000"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Mô tả / Tên định kỳ</label>
                <input
                  type="text"
                  required
                  placeholder="Tiền thuê nhà, Tiền phòng, Netflix..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Chu kỳ lặp lại</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  >
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                    <option value="yearly">Hàng năm</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Danh mục</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  >
                    {categories
                      .filter(c => c.type === type)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Ví thanh toán</label>
                  <select
                    value={walletId}
                    onChange={e => setWalletId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Lưu thiết lập
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                onClick={startAdd}
                className="w-full py-2.5 px-3 border border-dashed border-teal-500/60 hover:bg-teal-50/50 rounded-2xl text-xs font-bold text-teal-700 flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Plus className="w-4 h-4" />
                Thêm giao dịch định kỳ mới
              </button>

              {recurringTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Chưa có giao dịch định kỳ nào (như tiền thuê nhà, Netflix, tiền internet...)
                </div>
              ) : (
                recurringTransactions.map(rec => {
                  const cat = getCategoryById(rec.categoryId);
                  const wallet = getWalletById(rec.walletId);
                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat?.color || '#0d9488' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Repeat'} size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{rec.note}</h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold">
                                {getFrequencyLabel(rec.frequency)}
                              </span>
                              <span>• {wallet?.name || 'Ví'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-xs font-extrabold font-mono ${
                              rec.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {rec.type === 'expense' ? '-' : '+'}
                            {formatMoney(rec.amount)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Kỳ tới: {rec.nextDueDate}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateRecurringTransaction(rec.id, { isActive: !rec.isActive })
                            }
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg transition ${
                              rec.isActive
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {rec.isActive ? 'Đang bật' : 'Tạm dừng'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleExecute(rec)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition shadow-xs"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            Ghi sổ ngay
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRec(rec)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEditing && (
          <button
            onClick={onClose}
            className="mt-2 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Đóng
          </button>
        )}
      </div>

      {/* Confirm Delete Recurring Modal */}
      <ConfirmModal
        isOpen={!!deletingRec}
        title="Xóa giao dịch định kỳ"
        message={deletingRec ? `Bạn có chắc muốn xóa giao dịch định kỳ "${deletingRec.note || 'Khoản định kỳ'}"?` : ''}
        confirmText="Xóa định kỳ"
        type="danger"
        onConfirm={() => {
          if (deletingRec) {
            deleteRecurringTransaction(deletingRec.id);
            setDeletingRec(null);
          }
        }}
        onCancel={() => setDeletingRec(null)}
      />
    </div>
  );
};
