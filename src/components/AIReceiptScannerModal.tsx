import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  Calendar,
  Wallet as WalletIcon,
  Tag,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { parseReceiptWithAI, ParsedReceiptResult } from '../services/aiService';
import { triggerHaptic } from '../utils/formatters';

interface AIReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTransaction?: (txData: {
    type: 'expense' | 'income';
    amount: number;
    categoryId: string;
    walletId: string;
    date: string;
    time?: string;
    note: string;
    attachmentUrl?: string;
  }) => void;
}

export const AIReceiptScannerModal: React.FC<AIReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyTransaction,
}) => {
  const { categories, wallets, addTransaction, formatMoney } = useExpense();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedReceiptResult | null>(null);

  // Form states for confirmation
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn tệp hình ảnh (JPEG, PNG, WEBP)!');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setParsedResult(null);
      setError(null);
      analyzeReceipt(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzeReceipt = async (base64Img: string, typeStr: string) => {
    setIsAnalyzing(true);
    setError(null);
    triggerHaptic('light');

    try {
      const result = await parseReceiptWithAI(base64Img, typeStr, categories, wallets);
      setParsedResult(result);

      // Populate form
      setAmount(result.amount || 0);
      setType(result.type || 'expense');
      setDate(result.date || new Date().toISOString().split('T')[0]);
      setTime(result.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      setNote(result.note || 'Hóa đơn quét qua AI');

      // Auto match category
      if (result.categoryId && categories.some(c => c.id === result.categoryId)) {
        setCategoryId(result.categoryId);
      } else {
        const found = categories.find(
          c =>
            result.categoryName &&
            c.name.toLowerCase().includes(result.categoryName.toLowerCase())
        );
        setCategoryId(found ? found.id : categories[0]?.id || '');
      }

      // Auto match wallet
      if (result.walletId && wallets.some(w => w.id === result.walletId)) {
        setWalletId(result.walletId);
      } else {
        setWalletId(wallets[0]?.id || '');
      }

      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Không thể bóc tách hóa đơn. Vui lòng thử lại với ảnh rõ nét hơn.');
      triggerHaptic('warning');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveTransaction = () => {
    if (!amount || amount <= 0) {
      alert('Số tiền không hợp lệ!');
      return;
    }

    const txPayload = {
      type,
      amount,
      categoryId: categoryId || categories[0]?.id || '',
      walletId: walletId || wallets[0]?.id || '',
      date: date || new Date().toISOString().split('T')[0],
      time: time || undefined,
      note: note.trim() || 'Hóa đơn quét AI',
      attachmentUrl: imagePreview || undefined,
    };

    if (onApplyTransaction) {
      onApplyTransaction(txPayload);
    } else {
      addTransaction(txPayload);
    }

    triggerHaptic('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Quét Hóa Đơn AI
                <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Gemini 3.8
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Tự động nhận diện số tiền, cửa hàng & danh mục</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/70 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-teal-200 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Receipt className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Chụp ảnh hoặc chọn hóa đơn</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                Hỗ trợ hóa đơn siêu thị, nhà hàng, cây xăng hoặc ảnh chụp màn hình ngân hàng/Momo
              </p>
              <div className="flex gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-xl shadow-xs">
                  <Camera className="w-3.5 h-3.5" /> Chụp / Tải ảnh
                </span>
              </div>
            </div>
          ) : (
            /* Preview & Scanning Animation */
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-52 border border-slate-200 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Receipt Preview"
                  className="w-full max-h-52 object-contain"
                />

                {/* Scanning Laser Beam Effect when analyzing */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-teal-500/10 pointer-events-none flex flex-col justify-center items-center">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-bounce" />
                    <div className="mt-3 px-3 py-1 bg-slate-900/90 text-teal-300 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 border border-teal-500/40">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gemini đang đọc dữ liệu hóa đơn...</span>
                    </div>
                  </div>
                )}

                {/* Change photo button */}
                {!isAnalyzing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg backdrop-blur-xs flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" /> Chọn ảnh khác
                  </button>
                )}
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Phân tích không thành công</p>
                    <p className="text-[11px] mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Result Form */}
              {parsedResult && !isAnalyzing && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Đã nhận diện thành công
                    </span>
                    {parsedResult.confidence && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                        Độ chính xác: {Math.round(parsedResult.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Amount Field */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Số tiền giao dịch
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount || ''}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:border-teal-500 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-teal-600">₫</span>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-700 mt-1 block">
                      = {formatMoney(amount)}
                    </span>
                  </div>

                  {/* Note / Partner */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Tên đối tác / Ghi chú
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Highlands Coffee, WinMart,..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-teal-500"
                    />
                  </div>

                  {/* Category & Wallet Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Danh mục
                      </label>
                      <select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-teal-500"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Ví thanh toán
                      </label>
                      <select
                        value={walletId}
                        onChange={e => setWalletId(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-teal-500"
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.icon} {w.name} ({formatMoney(w.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Ngày
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Giờ
                      </label>
                      <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Itemized details if present */}
                  {parsedResult.items && parsedResult.items.length > 0 && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                        Chi tiết các món ({parsedResult.items.length}):
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {parsedResult.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-slate-700">
                            <span className="truncate pr-2">{it.name}</span>
                            <span className="font-mono text-slate-900 shrink-0 font-semibold">
                              {formatMoney(it.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Hủy bỏ
          </button>

          {parsedResult && !isAnalyzing ? (
            <button
              onClick={handleSaveTransaction}
              className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu giao dịch</span>
            </button>
          ) : imagePreview && isAnalyzing ? (
            <button
              disabled
              className="flex-1 py-2.5 px-3 bg-teal-600/70 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang đọc bill...</span>
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Chọn ảnh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
