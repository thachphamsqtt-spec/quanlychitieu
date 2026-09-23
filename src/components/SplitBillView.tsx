import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  Share2,
  Check,
  Receipt,
  Utensils,
  Percent,
  Sparkles,
  DollarSign,
  AlertCircle,
  Building2,
  CreditCard,
  ChevronLeft,
} from 'lucide-react';
import { SplitBill, SplitBillMember } from '../types/expense';
import { useExpense } from '../context/ExpenseContext';
import { SplitBillModal } from './SplitBillModal';
import { SplitBillDetailModal } from './SplitBillDetailModal';
import { VietQRModal } from './VietQRModal';
import { generateBillShareText, VIETNAM_BANKS } from '../utils/vietqr';
import { triggerHaptic } from '../utils/formatters';

export const SplitBillView: React.FC = () => {
  const { splitBills, formatMoney, toggleMemberPaidStatus, setActiveTab } = useExpense();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'settled'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<SplitBill | null>(null);
  const [viewingDetailBill, setViewingDetailBill] = useState<SplitBill | null>(null);
  const [qrModalBill, setQrModalBill] = useState<SplitBill | null>(null);
  const [copiedBillId, setCopiedBillId] = useState<string | null>(null);

  // Aggregated KPIs
  const totalVolume = useMemo(() => {
    return splitBills.reduce((sum, b) => sum + b.totalAmount, 0);
  }, [splitBills]);

  const { totalCollected, totalPending, pendingBillsCount, settledBillsCount } = useMemo(() => {
    let collected = 0;
    let pending = 0;
    let pendingCount = 0;
    let settledCount = 0;

    splitBills.forEach(b => {
      const payerId = b.payerMemberId;
      let billCollected = 0;
      b.members.forEach(m => {
        if (m.isPaid || m.id === payerId || m.isPayer) {
          billCollected += m.amount;
        }
      });
      const billPending = Math.max(0, b.totalAmount - billCollected);

      collected += billCollected;
      pending += billPending;

      if (billPending === 0 || b.status === 'settled') {
        settledCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      totalCollected: collected,
      totalPending: pending,
      pendingBillsCount: pendingCount,
      settledBillsCount: settledCount,
    };
  }, [splitBills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return splitBills.filter(bill => {
      // Tab filter
      const isSettled = bill.status === 'settled' || bill.members.every(m => m.isPaid || m.isPayer);
      if (filterTab === 'pending' && isSettled) return false;
      if (filterTab === 'settled' && !isSettled) return false;

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchTitle = bill.title.toLowerCase().includes(term);
      const matchBank = Boolean(
        bill.bankInfo?.bankName?.toLowerCase().includes(term) ||
        bill.bankInfo?.accountNo?.includes(term)
      );
      const matchMembers = bill.members.some(m => m.name.toLowerCase().includes(term));
      return matchTitle || matchBank || matchMembers;
    });
  }, [splitBills, filterTab, searchTerm]);

  // Share text copy
  const handleQuickCopyShare = (e: React.MouseEvent, bill: SplitBill) => {
    e.stopPropagation();
    const text = generateBillShareText(bill);
    navigator.clipboard.writeText(text);
    triggerHaptic('success');
    setCopiedBillId(bill.id);
    setTimeout(() => setCopiedBillId(null), 2500);
  };

  const handleOpenDetail = (bill: SplitBill) => {
    setViewingDetailBill(bill);
    triggerHaptic('light');
  };

  const handleOpenQR = (e: React.MouseEvent, bill: SplitBill) => {
    e.stopPropagation();
    setQrModalBill(bill);
    triggerHaptic('light');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Back button */}
      <div>
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('dashboard');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Trang chủ</span>
        </button>
      </div>

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Chia Tiền Nhóm & VietQR
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              VietQR 2.0
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chia đều hoặc theo món ăn, tự động tạo mã VietQR chuẩn ngân hàng chuyển khoản 1 chạm
          </p>
        </div>

        <button
          id="create-new-split-bill-btn"
          type="button"
          onClick={() => {
            setEditingBill(null);
            setIsCreateModalOpen(true);
            triggerHaptic('light');
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Hóa Đơn Mới</span>
        </button>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Volume */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Tổng giao dịch</span>
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatMoney(totalVolume)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {splitBills.length} cuộc hẹn/hóa đơn
          </div>
        </div>

        {/* Pending to Collect */}
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-bold">Cần thu về</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-300">
            {formatMoney(totalPending)}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
            {pendingBillsCount} hóa đơn đang chờ
          </div>
        </div>

        {/* Collected */}
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-bold">Đã thu đủ</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-300">
            {formatMoney(totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">
            {settledBillsCount} hóa đơn hoàn tất
          </div>
        </div>

        {/* VietQR Status */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-transparent border border-emerald-200/70 dark:border-emerald-800/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-teal-700 dark:text-teal-400">
            <span className="text-xs font-bold">Mã VietQR</span>
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sẵn sàng tạo mã</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            54+ Ngân hàng Việt Nam
          </div>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Tất cả ({splitBills.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filterTab === 'pending'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Đang chờ thu ({pendingBillsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('settled')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all ${
              filterTab === 'settled'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Đã thu đủ ({settledBillsCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="search-split-bills-input"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bill, bạn bè..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Bills Grid / Cards */}
      {filteredBills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => {
            const payerMember =
              bill.members.find(m => m.id === bill.payerMemberId) ||
              bill.members.find(m => m.isPayer) ||
              bill.members[0];

            let billCollected = 0;
            bill.members.forEach(m => {
              if (m.isPaid || m.id === payerMember?.id || m.isPayer) {
                billCollected += m.amount;
              }
            });
            const billPending = Math.max(0, bill.totalAmount - billCollected);
            const isSettled = bill.status === 'settled' || billPending === 0;
            const progress = bill.totalAmount > 0 ? Math.min(100, Math.round((billCollected / bill.totalAmount) * 100)) : 100;
            const bank = VIETNAM_BANKS.find(b => b.code === bill.bankInfo?.bankCode);

            return (
              <div
                key={bill.id}
                onClick={() => handleOpenDetail(bill)}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Top header row */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {bill.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ngày {bill.date}
                      </p>
                    </div>

                    {/* Split method badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                        bill.splitMethod === 'itemized'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                          : bill.splitMethod === 'percentage'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {bill.splitMethod === 'itemized' ? (
                        <>
                          <Utensils className="w-3 h-3" />
                          <span>Theo món</span>
                        </>
                      ) : bill.splitMethod === 'percentage' ? (
                        <>
                          <Percent className="w-3 h-3" />
                          <span>Tỷ lệ %</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" />
                          <span>Chia đều</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Tổng hóa đơn:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatMoney(bill.totalAmount)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Đã thu: {formatMoney(billCollected)}</span>
                        <span className={isSettled ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                          {isSettled ? '✅ Đã đủ' : `Còn ${formatMoney(billPending)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Members Avatars preview */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center -space-x-2 overflow-hidden">
                      {bill.members.slice(0, 5).map(m => (
                        <div
                          key={m.id}
                          className="relative inline-block w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-900 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: m.avatarColor || '#0f766e' }}
                          title={`${m.name}: ${formatMoney(m.amount)} (${m.isPaid ? 'Đã trả' : 'Chưa trả'})`}
                        >
                          {m.name.charAt(0).toUpperCase()}
                          {m.isPaid && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900" />
                          )}
                        </div>
                      ))}
                      {bill.members.length > 5 && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                          +{bill.members.length - 5}
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {bill.members.length} người •{' '}
                      <span className="text-slate-700 dark:text-slate-300 font-bold">
                        {payerMember ? payerMember.name : 'Tôi'} trả trước
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* VietQR Quick button */}
                  <button
                    type="button"
                    onClick={e => handleOpenQR(e, bill)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Mã VietQR</span>
                  </button>

                  {/* Share copy button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={e => handleQuickCopyShare(e, bill)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Copy bảng kê chia tiền gửi Zalo"
                    >
                      {copiedBillId === bill.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(bill)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Xem chi tiết"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {searchTerm ? 'Không tìm thấy hóa đơn phù hợp' : 'Chưa có hóa đơn chia tiền nào'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
                : 'Dễ dàng chia tiền ăn uống, cà phê, du lịch với bạn bè và tạo mã VietQR thanh toán tự động.'}
            </p>
          </div>
          <div>
            <button
              id="empty-create-split-bill-btn"
              type="button"
              onClick={() => {
                setEditingBill(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Hóa Đơn Đầu Tiên</span>
            </button>
          </div>
        </div>
      )}

      {/* VietQR Integration Info Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 flex-shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>Chuẩn VietQR - Chuyển khoản không cần nhập số tiền</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                Tự động
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Người chuyển tiền chỉ cần mở App ngân hàng bất kỳ (VCB, MB, Techcombank, VPBank,...) quét mã là thông tin STK, số tiền và nội dung sẽ được điền tự động.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingBill(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex-shrink-0 transition-colors shadow-sm"
        >
          Tạo bill mới ngay
        </button>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <SplitBillModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingBill(null);
          }}
          editingBill={editingBill}
        />
      )}

      {viewingDetailBill && (
        <SplitBillDetailModal
          bill={viewingDetailBill}
          isOpen={!!viewingDetailBill}
          onClose={() => setViewingDetailBill(null)}
          onEdit={bill => {
            setEditingBill(bill);
            setIsCreateModalOpen(true);
          }}
        />
      )}

      {qrModalBill && (
        <VietQRModal
          bill={qrModalBill}
          isOpen={!!qrModalBill}
          onClose={() => setQrModalBill(null)}
          onTogglePaid={memberId => toggleMemberPaidStatus(qrModalBill.id, memberId)}
          formatMoney={formatMoney}
        />
      )}
    </div>
  );
};
