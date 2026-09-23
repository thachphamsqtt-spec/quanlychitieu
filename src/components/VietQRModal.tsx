import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  CreditCard,
  Building2,
  User,
  Info,
  Sparkles,
} from 'lucide-react';
import { SplitBill, SplitBillMember } from '../types/expense';
import { VIETNAM_BANKS, generateVietQRUrl, generateTransferNote } from '../utils/vietqr';
import { triggerHaptic } from '../utils/formatters';

interface VietQRModalProps {
  bill: SplitBill;
  member?: SplitBillMember; // If specified, generate QR for this specific member's share
  isOpen: boolean;
  onClose: () => void;
  onTogglePaid?: (memberId: string) => void;
  formatMoney: (val: number) => string;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  bill,
  member,
  isOpen,
  onClose,
  onTogglePaid,
  formatMoney,
}) => {
  const [template, setTemplate] = useState<'compact2' | 'compact' | 'qr_only'>('compact2');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  const bankInfo = bill.bankInfo;
  const isCustomQr = Boolean(bankInfo?.customQrImage);

  const bank = VIETNAM_BANKS.find(b => b.code === bankInfo?.bankCode) || {
    code: bankInfo?.bankCode || 'VCB',
    shortName: bankInfo?.bankName || bankInfo?.bankCode || 'Ngân hàng',
    name: 'Ngân hàng thụ hưởng',
    bin: '970436',
    color: '#005b41',
    lookupCode: 'vietcombank',
  };

  // Amount and note
  const amountToPay = member ? member.amount : bill.totalAmount;
  const noteText = member
    ? generateTransferNote(bill.title, member.name)
    : `CK bill ${bill.title}`.substring(0, 25);

  const qrUrl = isCustomQr
    ? (bankInfo?.customQrImage || '')
    : (bankInfo?.accountNo
        ? generateVietQRUrl({
            bankCode: bank.code,
            accountNo: bankInfo.accountNo,
            accountName: bankInfo.accountName || '',
            amount: amountToPay,
            addInfo: noteText,
            template,
          })
        : '');

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic('success');
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullPaymentInfo = () => {
    if (!bankInfo) return;
    const parts: string[] = ['💳 THÔNG TIN THANH TOÁN:'];
    if (bankInfo.bankName || bankInfo.bankCode) {
      parts.push(`• Ngân hàng / Đơn vị: ${bank.shortName || bankInfo.bankName || bankInfo.bankCode}`);
    }
    if (bankInfo.accountNo) {
      parts.push(`• Số tài khoản / Ví: ${bankInfo.accountNo}`);
    }
    if (bankInfo.accountName) {
      parts.push(`• Chủ tài khoản: ${bankInfo.accountName.toUpperCase()}`);
    }
    parts.push(`• Số tiền: ${formatMoney(amountToPay)}`);
    parts.push(`• Nội dung: ${noteText}`);
    copyToClipboard(parts.join('\n'), 'all');
  };

  const handleDownloadQR = async () => {
    if (!qrUrl) return;
    triggerHaptic('light');
    try {
      const a = document.createElement('a');
      a.href = qrUrl;
      a.download = `QR_${bill.title.replace(/\s+/g, '_')}_${member ? member.name : 'Bill'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <div
      id="vietqr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="vietqr-modal-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Mã VietQR Chuyển Khoản
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {member ? `Phần của: ${member.name}` : bill.title}
              </p>
            </div>
          </div>
          <button
            id="close-vietqr-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Target Amount Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-100 dark:border-emerald-800/40 text-center">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
              Số tiền thanh toán
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 tracking-tight">
              {formatMoney(amountToPay)}
            </div>
            {member && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 shadow-sm border border-emerald-100 dark:border-emerald-900/50">
                <span>{member.name}</span>
                <span>•</span>
                <span className={member.isPaid ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {member.isPaid ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                </span>
              </div>
            )}
          </div>

          {/* QR Code Display */}
          {(isCustomQr || (bankInfo && bankInfo.accountNo)) ? (
            <div className="flex flex-col items-center">
              {/* Template switcher tabs (only for auto VietQR) */}
              {!isCustomQr && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setTemplate('compact2')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      template === 'compact2'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Chuẩn VietQR
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate('compact')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      template === 'compact'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Gọn gàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate('qr_only')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      template === 'qr_only'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Chỉ mã QR
                  </button>
                </div>
              )}

              {isCustomQr && (
                <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mã QR do người nhận tải lên</span>
                </div>
              )}

              {/* QR Image Frame */}
              <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 max-w-[280px] w-full flex flex-col items-center justify-center min-h-[280px]">
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-2xl">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-500">
                      {isCustomQr ? 'Đang mở mã QR...' : 'Đang tạo mã VietQR...'}
                    </span>
                  </div>
                )}
                {imageError ? (
                  <div className="text-center p-4">
                    <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Không thể tải ảnh QR, vui lòng chuyển khoản theo thông tin bên dưới.</p>
                  </div>
                ) : (
                  <img
                    id="vietqr-image-display"
                    src={qrUrl}
                    alt={isCustomQr ? 'Mã QR tùy chỉnh' : 'VietQR Chuyển khoản'}
                    referrerPolicy="no-referrer"
                    className={`w-full h-auto object-contain rounded-xl transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageLoaded(true);
                      setImageError(true);
                    }}
                  />
                )}
              </div>

              {/* Action Buttons for QR */}
              <div className="flex items-center gap-2 mt-3 w-full justify-center">
                <button
                  id="download-vietqr-btn"
                  type="button"
                  onClick={handleDownloadQR}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Lưu ảnh QR</span>
                </button>
                <button
                  id="share-vietqr-info-btn"
                  type="button"
                  onClick={copyFullPaymentInfo}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy thông tin CK</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-center">
              <Info className="w-6 h-6 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-semibold">Chưa có thông tin nhận tiền hoặc mã QR</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                Vui lòng cập nhật Số tài khoản hoặc Tải lên mã QR riêng khi tạo hóa đơn.
              </p>
            </div>
          )}

          {/* Account Details Copyable List */}
          {bankInfo && (bankInfo.accountNo || bankInfo.accountName) && (
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Chi tiết tài khoản nhận tiền</span>
                <span className="text-[10px] text-slate-400 font-normal">Chạm để copy</span>
              </div>

              {/* Ngân hàng */}
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Ngân hàng:
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {bank.shortName} ({bank.code})
                </span>
              </div>

              {/* Số tài khoản */}
              {bankInfo.accountNo ? (
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Số tài khoản:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankInfo.accountNo, 'accountNo')}
                    className="flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>{bankInfo.accountNo}</span>
                    {copiedField === 'accountNo' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              ) : null}

              {/* Chủ tài khoản */}
              {bankInfo.accountName ? (
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Tên thụ hưởng:
                  </span>
                  <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                    {bankInfo.accountName}
                  </span>
                </div>
              ) : null}

              {/* Nội dung chuyển khoản */}
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Nội dung CK:
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(noteText, 'note')}
                  className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200 hover:text-emerald-600 max-w-[200px] truncate"
                >
                  <span className="truncate">{noteText}</span>
                  {copiedField === 'note' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick Mark Paid Toggle */}
          {member && onTogglePaid && (
            <div className="pt-1">
              <button
                id="toggle-member-paid-in-modal-btn"
                type="button"
                onClick={() => {
                  onTogglePaid(member.id);
                  triggerHaptic('success');
                }}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                  member.isPaid
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {member.isPaid ? (
                  <>
                    <X className="w-4 h-4 text-slate-500" />
                    <span>Hủy đánh dấu (Chuyển thành Chưa trả)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Xác nhận đã nhận tiền của {member.name}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
