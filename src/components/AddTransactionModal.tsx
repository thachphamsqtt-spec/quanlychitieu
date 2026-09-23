import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Calendar,
  Clock,
  FileText,
  Camera,
  Image as ImageIcon,
  Trash2,
  Delete,
  Sparkles,
  Mic
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { CategoryIcon } from './CategoryIcon';
import { triggerHaptic } from '../utils/formatters';
import { TransactionType, Category } from '../types/expense';
import { AIReceiptScannerModal } from './AIReceiptScannerModal';
import { AIVoiceInputModal } from './AIVoiceInputModal';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    editingTransaction,
    setEditingTransaction,
    categories,
    wallets,
    addTransaction,
    updateTransaction,
    formatMoney,
  } = useExpense();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);

  // AI helper modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter categories by active type
  const activeCategories = categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense'));

  // Initialize form when opened or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(editingTransaction.amount.toString());
      setSelectedCategoryId(editingTransaction.categoryId);
      setSelectedWalletId(editingTransaction.walletId);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '12:00');
      setNote(editingTransaction.note || '');
      setReceiptImage(editingTransaction.receiptImage);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setType('expense');
      setAmountStr('0');
      setSelectedCategoryId(categories.find(c => c.type === 'expense')?.id || '');
      setSelectedWalletId(wallets[0]?.id || '');
      setDate(today);
      setTime(nowTime);
      setNote('');
      setReceiptImage(undefined);
    }
  }, [isAddModalOpen, editingTransaction, categories, wallets]);

  // Keep category in sync when switching type
  const handleTypeChange = (newType: TransactionType) => {
    triggerHaptic('light');
    setType(newType);
    const firstCat = categories.find(c => c.type === newType);
    if (firstCat) setSelectedCategoryId(firstCat.id);
  };

  // Fast Keypad handlers
  const handleNumClick = (val: string) => {
    triggerHaptic('light');
    setAmountStr(prev => {
      if (prev === '0') return val === '000' ? '0' : val;
      return prev + val;
    });
  };

  const handleAddPreset = (val: number) => {
    triggerHaptic('light');
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + val).toString());
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setAmountStr(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    triggerHaptic('medium');
    setAmountStr('0');
  };

  // Receipt image upload handling
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      triggerHaptic('success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setReceiptImage(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    triggerHaptic('light');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount,
        categoryId: selectedCategoryId,
        walletId: selectedWalletId,
        date,
        time,
        note: note.trim(),
        receiptImage,
      });
    } else {
      addTransaction({
        type,
        amount,
        categoryId: selectedCategoryId,
        walletId: selectedWalletId,
        date,
        time,
        note: note.trim(),
        receiptImage,
      });
    }

    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  if (!isAddModalOpen) return null;

  const currentAmountNum = parseFloat(amountStr) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-8 duration-200">
        {/* Android Sheet Handle Pill */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Top Header */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-bold text-slate-800">
            {editingTransaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
          </h3>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Auto-Fill Bar */}
        {!editingTransaction && (
          <div className="mx-4 mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px] font-semibold text-slate-200">Điền nhanh AI:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsScannerOpen(true);
                }}
                className="px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] font-bold rounded-lg border border-teal-500/30 flex items-center gap-1 transition active:scale-95"
              >
                <Camera className="w-3 h-3" /> Quét bill
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsVoiceOpen(true);
                }}
                className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold rounded-lg border border-purple-500/30 flex items-center gap-1 transition active:scale-95"
              >
                <Mic className="w-3 h-3" /> Giọng nói
              </button>
            </div>
          </div>
        )}

        {/* Form Body with Scrolling */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Type Toggle: Chi tiêu / Thu nhập */}
          <div className="bg-slate-100 p-1 rounded-2xl flex">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoản Chi (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khoản Thu (+)
            </button>
          </div>

          {/* Amount Display */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Số tiền giao dịch
            </span>
            <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
              {formatMoney(currentAmountNum)}
            </div>

            {/* Quick Add Presets (+50k, +100k, +200k, +500k) */}
            <div className="flex justify-center gap-1.5 mt-3">
              {[10000, 50000, 100000, 200000, 500000].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleAddPreset(p)}
                  className="px-2 py-1 bg-white border border-slate-200 text-[11px] font-bold text-slate-700 rounded-lg shadow-2xs hover:bg-teal-50 hover:text-teal-700 active:scale-95 transition"
                >
                  +{p >= 1000 ? `${p / 1000}k` : p}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Keypad Grid */}
          <div className="grid grid-cols-4 gap-1.5 select-none">
            {['1', '2', '3'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleNumClick(n)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-base font-bold rounded-xl active:scale-95 transition"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center active:scale-95 transition"
            >
              <Delete className="w-5 h-5" />
            </button>

            {['4', '5', '6'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleNumClick(n)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-base font-bold rounded-xl active:scale-95 transition"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl active:scale-95 transition"
            >
              Xóa
            </button>

            {['7', '8', '9'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleNumClick(n)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-base font-bold rounded-xl active:scale-95 transition"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNumClick('000')}
              className="py-2.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-xs font-bold rounded-xl active:scale-95 transition"
            >
              .000
            </button>

            <button
              type="button"
              onClick={() => handleNumClick('0')}
              className="col-span-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-bold rounded-xl active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center active:scale-95 transition shadow-sm"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Danh mục {type === 'expense' ? 'chi tiêu' : 'thu nhập'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {activeCategories.map(cat => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedCategoryId(cat.id);
                    }}
                    className={`p-2 rounded-2xl border flex flex-col items-center gap-1 transition ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color + '20', color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={17} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallet Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Tài khoản / Ví thanh toán
            </label>
            <div className="grid grid-cols-3 gap-2">
              {wallets.map(w => {
                const isSelected = selectedWalletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedWalletId(w.id);
                    }}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2 transition ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: w.color }}
                    >
                      <CategoryIcon name={w.icon} size={15} />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-[11px] font-bold text-slate-800 truncate block">
                        {w.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Ghi chú
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Ví dụ: Ăn trưa bún chả với đồng nghiệp..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-hidden"
              />
            </div>
          </div>

          {/* Receipt Image Attachment */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Ảnh hóa đơn / Chứng từ (Tùy chọn)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
            {receiptImage ? (
              <div className="relative inline-block border border-slate-200 rounded-2xl p-1 bg-slate-50">
                <img
                  src={receiptImage}
                  alt="Hóa đơn đính kèm"
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow hover:bg-rose-600 transition"
                  title="Xóa ảnh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/40 rounded-2xl text-xs font-semibold text-slate-600 hover:text-teal-700 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Camera className="w-4 h-4 text-teal-600" />
                Chụp hoặc đính kèm ảnh hóa đơn
              </button>
            )}
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ngày
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Giờ
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(false)}
            className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-2 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {editingTransaction ? 'Cập nhật' : 'Lưu giao dịch'}
          </button>
        </div>
      </div>

      {/* Embedded Scanner Modal with onApply */}
      <AIReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyTransaction={data => {
          setType(data.type);
          setAmountStr(data.amount.toString());
          if (data.categoryId) setSelectedCategoryId(data.categoryId);
          if (data.walletId) setSelectedWalletId(data.walletId);
          if (data.date) setDate(data.date);
          if (data.time) setTime(data.time);
          if (data.note) setNote(data.note);
          if (data.attachmentUrl) setReceiptImage(data.attachmentUrl);
          setIsScannerOpen(false);
          triggerHaptic('success');
        }}
      />

      {/* Embedded Voice Modal */}
      <AIVoiceInputModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </div>
  );
};
