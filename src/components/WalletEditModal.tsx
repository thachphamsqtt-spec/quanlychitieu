import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Wallet as WalletIcon,
  Banknote,
  Landmark,
  Smartphone,
  CreditCard,
  Coins,
  PiggyBank,
  Check,
  TrendingUp,
  TrendingDown,
  Scale,
  Trash2,
  Info,
  Building2,
  Sparkles,
  Upload,
  QrCode,
  RotateCcw,
} from 'lucide-react';
import { Wallet, WalletType } from '../types/expense';
import { useExpense } from '../context/ExpenseContext';
import { formatVND, triggerHaptic } from '../utils/formatters';
import { VIETNAM_BANKS } from '../utils/vietqr';
import { ConfirmModal } from './ConfirmModal';

interface WalletEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet | null;
}

const WALLET_ICONS = [
  { name: 'Banknote', label: 'Tiền mặt', icon: Banknote },
  { name: 'Landmark', label: 'Ngân hàng', icon: Landmark },
  { name: 'Smartphone', label: 'Ví điện tử', icon: Smartphone },
  { name: 'CreditCard', label: 'Thẻ', icon: CreditCard },
  { name: 'Coins', label: 'Tiền xu', icon: Coins },
  { name: 'PiggyBank', label: 'Tiết kiệm', icon: PiggyBank },
  { name: 'Wallet', label: 'Ví tiền', icon: WalletIcon },
  { name: 'Building2', label: 'Tổ chức', icon: Building2 },
];

const WALLET_COLORS = [
  { name: 'Xanh Teal', color: '#0f766e' },
  { name: 'Xanh Emerald', color: '#059669' },
  { name: 'Xanh MB/Dương', color: '#0033a0' },
  { name: 'Xanh Dương', color: '#0284c7' },
  { name: 'Tím Indigo', color: '#4338ca' },
  { name: 'Tím Violet', color: '#7c3aed' },
  { name: 'Hồng Rose', color: '#db2777' },
  { name: 'Đỏ Techcom/VPB', color: '#e11d48' },
  { name: 'Cam Hổ phách', color: '#d97706' },
  { name: 'Xám Than chì', color: '#334155' },
];

export const WalletEditModal: React.FC<WalletEditModalProps> = ({
  isOpen,
  onClose,
  wallet,
}) => {
  const { updateWallet, deleteWallet, wallets, addTransaction } = useExpense();

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [balanceInput, setBalanceInput] = useState<string>('0');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [icon, setIcon] = useState('Banknote');
  const [color, setColor] = useState('#059669');
  const [customQrImage, setCustomQrImage] = useState<string | undefined>(undefined);
  const [recordAdjustmentTx, setRecordAdjustmentTx] = useState(false);
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when wallet changes
  useEffect(() => {
    if (wallet) {
      setName(wallet.name || '');
      setType(wallet.type || 'cash');
      setBalanceInput(String(wallet.balance ?? 0));
      setAccountNumber(wallet.accountNumber || '');
      setBankName(wallet.bankName || '');
      setIcon(wallet.icon || (wallet.type === 'cash' ? 'Banknote' : wallet.type === 'bank' ? 'Landmark' : 'Smartphone'));
      setColor(wallet.color || (wallet.type === 'cash' ? '#059669' : wallet.type === 'bank' ? '#0033a0' : '#0f766e'));
      setCustomQrImage(wallet.customQrImage);
      setRecordAdjustmentTx(false);
      setAdjustmentNote('');
    }
  }, [wallet]);

  if (!isOpen || !wallet) return null;

  const currentBalance = wallet.balance;
  const newBalance = parseFloat(balanceInput) || 0;
  const diff = newBalance - currentBalance;

  const handleQrUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn file hình ảnh (PNG, JPG, WebP)!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh không được vượt quá 5MB!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCustomQrImage(base64);
      triggerHaptic('success');
    };
    reader.readAsDataURL(file);
  };

  const handleQuickBalanceSet = (targetAmount: number) => {
    triggerHaptic('light');
    setBalanceInput(String(targetAmount));
  };

  const handleQuickAdd = (delta: number) => {
    triggerHaptic('light');
    const current = parseFloat(balanceInput) || 0;
    setBalanceInput(String(Math.max(0, current + delta)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên ví!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    // Update wallet data
    updateWallet(wallet.id, {
      name: name.trim(),
      type,
      balance: newBalance,
      icon,
      color,
      accountNumber: accountNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      customQrImage: customQrImage || undefined,
    });

    // Optionally record an adjustment transaction
    if (recordAdjustmentTx && diff !== 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const absDiff = Math.abs(diff);

      addTransaction({
        type: diff > 0 ? 'income' : 'expense',
        amount: absDiff,
        categoryId: diff > 0 ? 'cat_other_income' : 'cat_other_expense',
        walletId: wallet.id,
        date: todayStr,
        time: nowTime,
        note: adjustmentNote.trim() || `Điều chỉnh số dư ví "${name.trim()}": ${diff > 0 ? '+' : ''}${formatVND(diff)}`,
      });
    }

    triggerHaptic('success');
    onClose();
  };

  const handleDelete = () => {
    if (wallets.length <= 1) {
      setErrorMessage('Bạn phải giữ ít nhất 1 ví trong hệ thống!');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setShowDeleteConfirm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              {(() => {
                const SelectedIcon = WALLET_ICONS.find(i => i.name === icon)?.icon || WalletIcon;
                return <SelectedIcon className="w-5 h-5" />;
              })()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chỉnh Sửa Ví & Điều Chỉnh Số Dư
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sửa số dư (về 0đ, 1.000.000đ,...), tên và thông tin ví
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-1">
          {/* Section 1: ĐIỀU CHỈNH SỐ DƯ (Highlighted) */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Số Dư Thực Tế (Số tiền trong ví)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Hiện tại: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatVND(currentBalance)}</strong>
              </span>
            </div>

            {/* Input số dư mới */}
            <div className="relative">
              <input
                id="wallet-edit-balance-input"
                type="number"
                step="any"
                required
                value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)}
                placeholder="Nhập số dư mới (0, 1000000...)"
                className="w-full py-3 px-3.5 bg-white dark:bg-slate-900 border-2 border-teal-500/50 focus:border-teal-600 rounded-xl text-lg font-black font-mono text-slate-900 dark:text-white outline-hidden shadow-xs transition"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>

            {/* Nút bấm chọn số tiền nhanh (Gợi ý trực quan: 0đ, 1.000.000đ,...) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                Gợi ý số dư nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickBalanceSet(0)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                    newBalance === 0
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                  }`}
                >
                  0 ₫ (Về 0đ)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickBalanceSet(1000000)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                    newBalance === 1000000
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                  }`}
                >
                  1.000.000 ₫
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickBalanceSet(500000)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                    newBalance === 500000
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                  }`}
                >
                  500.000 ₫
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickBalanceSet(2000000)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition ${
                    newBalance === 2000000
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400'
                  }`}
                >
                  2.000.000 ₫
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(100000)}
                  className="px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-teal-600"
                >
                  +100k
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(500000)}
                  className="px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-teal-600"
                >
                  +500k
                </button>
              </div>
            </div>

            {/* Báo cáo mức chênh lệch */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Chênh lệch số dư:</span>
              <div className="flex items-center gap-1 font-mono font-bold">
                {diff === 0 ? (
                  <span className="text-slate-500">Không đổi (0 ₫)</span>
                ) : diff > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{formatVND(diff)}
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {formatVND(diff)}
                  </span>
                )}
              </div>
            </div>

            {/* Tùy chọn lưu vết giao dịch điều chỉnh */}
            {diff !== 0 && (
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer bg-white dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={recordAdjustmentTx}
                    onChange={e => setRecordAdjustmentTx(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Tự động tạo giao dịch điều chỉnh số dư
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                      Lưu lại 1 bút toán chênh lệch ({diff > 0 ? 'Thu nhập' : 'Chi tiêu'} {formatVND(Math.abs(diff))}) vào lịch sử thu chi để đối soát sổ sách.
                    </span>
                  </div>
                </label>
                {recordAdjustmentTx && (
                  <input
                    type="text"
                    placeholder="Lý do điều chỉnh (Kiểm kê tiền mặt, đồng bộ số dư...)"
                    value={adjustmentNote}
                    onChange={e => setAdjustmentNote(e.target.value)}
                    className="w-full mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-hidden"
                  />
                )}
              </div>
            )}
          </div>

          {/* Section 2: THÔNG TIN VÍ */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tên Ví / Tài khoản
              </label>
              <input
                id="wallet-edit-name-input"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Tiền mặt, Ngân hàng MB, Vietcombank..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Loại ví
                </label>
                <select
                  value={type}
                  onChange={e => {
                    const newType = e.target.value as WalletType;
                    setType(newType);
                    if (newType === 'cash') setIcon('Banknote');
                    else if (newType === 'bank') setIcon('Landmark');
                    else if (newType === 'e_wallet') setIcon('Smartphone');
                    else if (newType === 'credit_card') setIcon('CreditCard');
                  }}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-teal-500"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Tài khoản Ngân hàng</option>
                  <option value="e_wallet">Ví điện tử (MoMo, ZaloPay...)</option>
                  <option value="credit_card">Thẻ tín dụng</option>
                </select>
              </div>

              {type === 'bank' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Ngân hàng
                  </label>
                  <select
                    value={bankName}
                    onChange={e => {
                      setBankName(e.target.value);
                      if (e.target.value === 'MBBank') {
                        setColor('#0033a0');
                      } else if (e.target.value === 'Vietcombank') {
                        setColor('#0f766e');
                      } else if (e.target.value === 'Techcombank') {
                        setColor('#e11d48');
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-hidden focus:border-teal-500"
                  >
                    <option value="">Chọn ngân hàng...</option>
                    {VIETNAM_BANKS.map(b => (
                      <option key={b.code} value={b.shortName}>
                        {b.shortName} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Số tài khoản (dành cho ngân hàng / ví điện tử) */}
            {(type === 'bank' || type === 'e_wallet') && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Số tài khoản / Số điện thoại ví (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Ví dụ: 0386888999, 1023456789..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 outline-hidden focus:border-teal-500"
                />
              </div>
            )}

            {/* Mã QR nhận tiền của ví */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Ảnh mã QR nhận tiền của ví (Tùy chọn)
                </label>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleQrUpload(file);
                }}
              />

              {customQrImage ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white flex items-center justify-center">
                      <img
                        src={customQrImage}
                        alt="Mã QR ví"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã lưu mã QR nhận tiền</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tự động hiển thị khi chia tiền nhóm từ ví này.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-600 text-xs font-semibold shadow-xs"
                      title="Đổi ảnh khác"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomQrImage(undefined);
                        triggerHaptic('light');
                      }}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs font-semibold"
                      title="Xóa mã QR"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 rounded-2xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer flex items-center gap-3 group transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Tải lên ảnh mã QR nhận tiền
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ảnh chụp QR MoMo, ZaloPay, Vietcombank, MBBank...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Biểu tượng (Icon Selector) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Biểu tượng
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WALLET_ICONS.map(item => {
                  const ItemIcon = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setIcon(item.name);
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <ItemIcon className="w-4 h-4" />
                      <span className="text-[10px] font-medium truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Màu sắc (Color Palette) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Màu sắc nhận diện
              </label>
              <div className="flex flex-wrap gap-2">
                {WALLET_COLORS.map(item => (
                  <button
                    key={item.color}
                    type="button"
                    title={item.name}
                    onClick={() => {
                      triggerHaptic('light');
                      setColor(item.color);
                    }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition ${
                      color === item.color
                        ? 'ring-2 ring-offset-2 ring-teal-500 scale-110 shadow-sm'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: item.color }}
                  >
                    {color === item.color && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-medium text-rose-600 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
            {wallets.length > 1 && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                title="Xóa ví này"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa ví</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Hủy
            </button>

            <button
              id="wallet-edit-submit-btn"
              type="submit"
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Confirm Delete Wallet Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa ví tiền"
        message={`Bạn có chắc chắn muốn xóa ví "${wallet.name}" không?`}
        confirmText="Xóa ví"
        type="danger"
        onConfirm={() => {
          triggerHaptic('medium');
          deleteWallet(wallet.id);
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
