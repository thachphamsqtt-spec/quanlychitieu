import React, { useState } from 'react';
import {
  X,
  Edit2,
  Trash2,
  QrCode,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  Check,
  CreditCard,
  Building2,
  DollarSign,
  ArrowRight,
  BookOpen,
  MessageCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { SplitBill, SplitBillMember } from '../types/expense';
import { useExpense } from '../context/ExpenseContext';
import { VietQRModal } from './VietQRModal';
import { generateBillShareText, generateDebtReminderMessage, VIETNAM_BANKS } from '../utils/vietqr';
import { triggerHaptic } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

interface SplitBillDetailModalProps {
  bill: SplitBill;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (bill: SplitBill) => void;
}

export const SplitBillDetailModal: React.FC<SplitBillDetailModalProps> = ({
  bill,
  isOpen,
  onClose,
  onEdit,
}) => {
  const {
    deleteSplitBill,
    toggleMemberPaidStatus,
    convertMemberOwedToDebt,
    convertBillToExpense,
    formatMoney,
  } = useExpense();

  // QR Modal state
  const [selectedMemberForQR, setSelectedMemberForQR] = useState<SplitBillMember | undefined>(undefined);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Copy feedback state
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Statistics
  const totalAmount = bill.totalAmount;
  const payerMember = bill.members.find(m => m.id === bill.payerMemberId) || bill.members.find(m => m.isPayer) || bill.members[0];

  const nonPayerMembers = bill.members.filter(m => m.id !== payerMember?.id);
  const collectedAmount = bill.members
    .filter(m => m.isPaid || m.id === payerMember?.id)
    .reduce((sum, m) => sum + m.amount, 0);

  const pendingAmount = Math.max(0, totalAmount - collectedAmount);
  const paidCount = bill.members.filter(m => m.isPaid || m.id === payerMember?.id).length;
  const progressPercent = totalAmount > 0 ? Math.min(100, Math.round((collectedAmount / totalAmount) * 100)) : 100;
  const isAllSettled = bill.status === 'settled' || pendingAmount === 0;

  const bank = VIETNAM_BANKS.find(b => b.code === bill.bankInfo?.bankCode);

  // Handlers
  const handleOpenQRForMember = (member?: SplitBillMember) => {
    setSelectedMemberForQR(member);
    setIsQRModalOpen(true);
    triggerHaptic('light');
  };

  const handleCopyShareText = () => {
    const text = generateBillShareText(bill);
    navigator.clipboard.writeText(text);
    triggerHaptic('success');
    setCopiedAction('full_bill');
    setTimeout(() => setCopiedAction(null), 2500);
  };

  const handleCopyReminder = (member: SplitBillMember) => {
    const text = generateDebtReminderMessage(bill, member);
    navigator.clipboard.writeText(text);
    triggerHaptic('success');
    setCopiedAction(`remind_${member.id}`);
    setTimeout(() => setCopiedAction(null), 2500);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConvertToExpense = () => {
    convertBillToExpense(bill.id);
    setNotificationMessage('Đã ghi nhận phần chi tiêu của bạn vào sổ giao dịch!');
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  const handleConvertToDebt = (memberId: string) => {
    convertMemberOwedToDebt(bill.id, memberId);
    setNotificationMessage('Đã chuyển khoản tiền này vào Sổ Ghi Nợ!');
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  return (
    <>
      <div
        id="split-bill-detail-modal-backdrop"
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          id="split-bill-detail-modal-container"
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-sm">
                  {bill.title}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isAllSettled
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {isAllSettled ? 'Đã thu đủ' : 'Đang chờ thu'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ngày {bill.date} • {bill.members.length} người tham gia
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                id="edit-bill-btn"
                onClick={() => {
                  onClose();
                  onEdit(bill);
                }}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 shadow-sm flex items-center justify-center transition-colors"
                title="Chỉnh sửa bill"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                id="delete-bill-btn"
                onClick={handleDelete}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 shadow-sm flex items-center justify-center transition-colors"
                title="Xóa bill"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                id="close-bill-detail-btn"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Progress Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 dark:to-slate-800/40 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tổng bill
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatMoney(totalAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Cần thu thêm
                  </span>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {formatMoney(pendingAmount)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>
                    Đã thu: <b className="text-emerald-600">{formatMoney(collectedAmount)}</b>
                  </span>
                  <span>
                    Tiến độ: <b>{progressPercent}%</b> ({paidCount}/{bill.members.length} người)
                  </span>
                </div>
              </div>
            </div>

            {/* VietQR Bank Info banner */}
            {bill.bankInfo && bill.bankInfo.accountNo ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{bank?.shortName || bill.bankInfo.bankName}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {bill.bankInfo.accountNo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 uppercase font-medium">
                      {bill.bankInfo.accountName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenQRForMember(undefined)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Xem mã VietQR</span>
                </button>
              </div>
            ) : null}

            {/* Members Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Chi tiết từng thành viên ({bill.members.length})
                </h3>
                <span className="text-[11px] text-slate-400">Chạm để đổi trạng thái trả tiền</span>
              </div>

              <div className="space-y-2.5">
                {bill.members.map(member => {
                  const isPayer = member.id === bill.payerMemberId || member.isPayer;
                  return (
                    <div
                      key={member.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        member.isPaid || isPayer
                          ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {/* Member Identity */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: member.avatarColor || '#0f766e' }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {member.name}
                              </span>
                              {isPayer && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                  👑 Người trả
                                </span>
                              )}
                            </div>
                            {member.phoneNumber && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {member.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {formatMoney(member.amount)}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMemberPaidStatus(bill.id, member.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 transition-colors ${
                              member.isPaid || isPayer
                                ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 underline'
                            }`}
                          >
                            {member.isPaid || isPayer ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đã thanh toán</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Chưa trả (Đổi)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Member Actions (VietQR, Remind, Debt) */}
                      {!isPayer && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {/* VietQR button */}
                          <button
                            type="button"
                            onClick={() => handleOpenQRForMember(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 transition-colors"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>Mã VietQR</span>
                          </button>

                          {/* Remind button */}
                          <button
                            type="button"
                            onClick={() => handleCopyReminder(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            {copiedAction === `remind_${member.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Đã copy!</span>
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-3 h-3" />
                                <span>Nhắc nợ Zalo</span>
                              </>
                            )}
                          </button>

                          {/* Convert to Debt button */}
                          {!member.isPaid && (
                            <button
                              type="button"
                              onClick={() => handleConvertToDebt(member.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 transition-colors ml-auto"
                              title="Tạo khoản cho vay trong Sổ Ghi Nợ"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Lưu vào Sổ Nợ</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Itemized Items breakdown (if any) */}
            {bill.items && bill.items.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Món ăn & Đồ uống ({bill.items.length})
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden bg-slate-50/50 dark:bg-slate-800/40">
                  {bill.items.map(item => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {item.assignedMemberIds.length} người chia
                        </div>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatMoney(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note if any */}
            {bill.note && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú: </span>
                {bill.note}
              </div>
            )}

            {/* Footer Multi-Action Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyShareText}
                className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors"
              >
                {copiedAction === 'full_bill' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Đã sao chép bảng kê chi tiết!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copy bảng kê gửi nhóm Zalo</span>
                  </>
                )}
              </button>

              {notificationMessage && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-2xl text-xs font-semibold text-teal-700 dark:text-teal-300 text-center animate-fade-in">
                  {notificationMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleConvertToExpense}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Ghi chép phần tôi vào Chi Tiêu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded VietQR Modal */}
      {isQRModalOpen && (
        <VietQRModal
          bill={bill}
          member={selectedMemberForQR}
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          onTogglePaid={memberId => toggleMemberPaidStatus(bill.id, memberId)}
          formatMoney={formatMoney}
        />
      )}

      {/* Confirm Delete Split Bill Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa hóa đơn chia tiền"
        message={`Bạn có chắc muốn xóa hóa đơn chia tiền "${bill.title}" không?`}
        confirmText="Xóa hóa đơn"
        type="danger"
        onConfirm={() => {
          deleteSplitBill(bill.id);
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
