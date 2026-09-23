import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageSquare,
  Share2,
  Trash2,
  Edit3,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Wallet as WalletIcon,
  X,
  History,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { Debt, DebtType, DebtStatus, DebtRepayment } from '../types/expense';
import { formatVND, formatDateVietnamese, triggerHaptic } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export const DebtsView: React.FC = () => {
  const {
    debts,
    totalLent,
    totalBorrowed,
    addDebt,
    updateDebt,
    deleteDebt,
    addDebtRepayment,
    wallets,
    formatMoney,
  } = useExpense();

  // Filters & State
  const [activeFilter, setActiveFilter] = useState<'all' | 'lend' | 'borrow' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [repayingDebt, setRepayingDebt] = useState<Debt | null>(null);
  const [reminderModalDebt, setReminderModalDebt] = useState<Debt | null>(null);

  // Form states for Add/Edit Debt
  const [formType, setFormType] = useState<DebtType>('lend');
  const [formPerson, setFormPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formWalletId, setFormWalletId] = useState(wallets[0]?.id || '');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formRecordTransaction, setFormRecordTransaction] = useState(true);

  // Form state for Repayment Modal
  const [repAmount, setRepAmount] = useState('');
  const [repWalletId, setRepWalletId] = useState(wallets[0]?.id || '');
  const [repDate, setRepDate] = useState(new Date().toISOString().split('T')[0]);
  const [repNote, setRepNote] = useState('');
  const [repRecordTx, setRepRecordTx] = useState(true);

  // Reminder message copied state
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);

  // Reset Add/Edit Modal
  const openAddModal = () => {
    setEditingDebt(null);
    setFormType('lend');
    setFormPerson('');
    setFormPhone('');
    setFormAmount('');
    setFormWalletId(wallets[0]?.id || '');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormDueDate('');
    setFormNote('');
    setFormRecordTransaction(true);
    setIsAddModalOpen(true);
    triggerHaptic('light');
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setFormType(debt.type);
    setFormPerson(debt.personName);
    setFormPhone(debt.phoneNumber || '');
    setFormAmount(debt.amount.toString());
    setFormWalletId(debt.walletId || wallets[0]?.id || '');
    setFormStartDate(debt.startDate);
    setFormDueDate(debt.dueDate || '');
    setFormNote(debt.note || '');
    setFormRecordTransaction(false); // don't re-record on edit
    setIsAddModalOpen(true);
    triggerHaptic('light');
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount.replace(/,/g, ''));
    if (!formPerson.trim()) {
      alert('Vui lòng nhập tên người vay / cho vay');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        type: formType,
        personName: formPerson.trim(),
        phoneNumber: formPhone.trim() || undefined,
        amount: amountNum,
        walletId: formWalletId || undefined,
        startDate: formStartDate,
        dueDate: formDueDate || undefined,
        note: formNote.trim() || undefined,
      });
    } else {
      addDebt(
        {
          type: formType,
          personName: formPerson.trim(),
          phoneNumber: formPhone.trim() || undefined,
          amount: amountNum,
          walletId: formWalletId || undefined,
          startDate: formStartDate,
          dueDate: formDueDate || undefined,
          note: formNote.trim() || undefined,
        },
        formRecordTransaction
      );
    }

    setIsAddModalOpen(false);
    triggerHaptic('success');
  };

  // Open Repayment Modal
  const openRepaymentModal = (debt: Debt) => {
    setRepayingDebt(debt);
    const remaining = Math.max(0, debt.amount - (debt.paidAmount || 0));
    setRepAmount(remaining.toString());
    setRepWalletId(debt.walletId || wallets[0]?.id || '');
    setRepDate(new Date().toISOString().split('T')[0]);
    setRepNote(debt.type === 'lend' ? 'Thu nợ đợt thanh toán' : 'Trả bớt tiền nợ');
    setRepRecordTx(true);
    triggerHaptic('light');
  };

  const handleSaveRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingDebt) return;

    const amountNum = parseFloat(repAmount.replace(/,/g, ''));
    if (!amountNum || amountNum <= 0) {
      alert('Vui lòng nhập số tiền thanh toán hợp lệ');
      return;
    }

    addDebtRepayment(
      repayingDebt.id,
      {
        amount: amountNum,
        date: repDate,
        walletId: repWalletId || undefined,
        note: repNote.trim() || undefined,
      },
      repRecordTx
    );

    setRepayingDebt(null);
    triggerHaptic('success');
  };

  // Reminder message generation
  const generateReminderMessage = (debt: Debt) => {
    const remaining = Math.max(0, debt.amount - (debt.paidAmount || 0));
    if (debt.type === 'lend') {
      return `Chào ${debt.personName}, mình gửi lời nhắn nhắc về khoản tiền ${formatVND(
        remaining
      )} bạn mượn${debt.dueDate ? ` (hạn trả: ${formatDateVietnamese(debt.dueDate)})` : ''}. Khi nào thuận tiện bạn chuyển khoản giúp mình nhé. Cảm ơn bạn!`;
    } else {
      return `Chào ${debt.personName}, mình nhớ khoản nợ ${formatVND(
        remaining
      )} của bạn và sẽ sắp xếp hoàn trả sớm nhất${debt.dueDate ? ` trước ngày ${formatDateVietnamese(debt.dueDate)}` : ''}. Cảm ơn bạn đã hỗ trợ mình!`;
    }
  };

  const handleCopyReminder = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReminder(true);
    triggerHaptic('success');
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      // Type / Status filter
      if (activeFilter === 'lend' && (debt.type !== 'lend' || debt.status === 'completed')) return false;
      if (activeFilter === 'borrow' && (debt.type !== 'borrow' || debt.status === 'completed')) return false;
      if (activeFilter === 'completed' && debt.status !== 'completed') return false;
      if (activeFilter === 'all' && debt.status === 'completed') return false; // Default 'all' shows active debts

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = debt.personName.toLowerCase().includes(query);
        const matchNote = (debt.note || '').toLowerCase().includes(query);
        const matchPhone = (debt.phoneNumber || '').includes(query);
        if (!matchName && !matchNote && !matchPhone) return false;
      }

      return true;
    });
  }, [debts, activeFilter, searchQuery]);

  // Count active stats
  const activeLendCount = useMemo(
    () => debts.filter(d => d.type === 'lend' && d.status === 'active').length,
    [debts]
  );
  const activeBorrowCount = useMemo(
    () => debts.filter(d => d.type === 'borrow' && d.status === 'active').length,
    [debts]
  );
  const completedCount = useMemo(() => debts.filter(d => d.status === 'completed').length, [debts]);

  // Due date status helper
  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        isOverdue: true,
        text: `Quá hạn ${Math.abs(diffDays)} ngày`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (diffDays === 0) {
      return {
        isOverdue: false,
        text: 'Hạn chót hôm nay',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (diffDays <= 3) {
      return {
        isOverdue: false,
        text: `Còn ${diffDays} ngày`,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      isOverdue: false,
      text: `Hạn: ${formatDateVietnamese(dueDate)}`,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Top Banner & Overview Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-950 rounded-3xl p-4 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300">
                <HandCoins className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Sổ Nợ & Cho Vay</h1>
                <p className="text-[11px] text-teal-200/80">Quản lý các khoản vay mượn chính xác</p>
              </div>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-900 text-xs font-bold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Thêm mới</span>
            </button>
          </div>

          {/* Quick Dual Cards: Cho vay (Cần thu) vs Đi vay (Cần trả) */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Cho vay Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Cho vay (Cần thu)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold">
                  {activeLendCount}
                </span>
              </div>
              <div className="text-base font-black font-mono text-emerald-300">
                {formatVND(totalLent)}
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">Người khác đang nợ bạn</p>
            </div>

            {/* Đi vay Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Đi vay (Cần trả)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">
                  {activeBorrowCount}
                </span>
              </div>
              <div className="text-base font-black font-mono text-amber-300">
                {formatVND(totalBorrowed)}
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">Bạn đang nợ người khác</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 py-1.5 rounded-xl transition text-center ${
              activeFilter === 'all'
                ? 'bg-white text-teal-800 shadow-sm font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Đang hoạt động ({activeLendCount + activeBorrowCount})
          </button>
          <button
            onClick={() => setActiveFilter('lend')}
            className={`flex-1 py-1.5 rounded-xl transition text-center ${
              activeFilter === 'lend'
                ? 'bg-white text-emerald-700 shadow-sm font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Cho vay ({activeLendCount})
          </button>
          <button
            onClick={() => setActiveFilter('borrow')}
            className={`flex-1 py-1.5 rounded-xl transition text-center ${
              activeFilter === 'borrow'
                ? 'bg-white text-amber-700 shadow-sm font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Đi vay ({activeBorrowCount})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`flex-1 py-1.5 rounded-xl transition text-center ${
              activeFilter === 'completed'
                ? 'bg-white text-teal-800 shadow-sm font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Đã xong ({completedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên người, ghi chú hoặc số điện thoại..."
            className="w-full bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <HandCoins className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Chưa có khoản nợ nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Không tìm thấy kết quả phù hợp với từ khóa.'
                : 'Ghi lại các khoản cho bạn bè vay mượn hoặc các khoản vay cá nhân để nhắc nhở và quản lý dòng tiền.'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              + Tạo khoản nợ mới
            </button>
          </div>
        ) : (
          filteredDebts.map(debt => {
            const isLend = debt.type === 'lend';
            const remaining = Math.max(0, debt.amount - (debt.paidAmount || 0));
            const progress = Math.min(100, Math.round(((debt.paidAmount || 0) / debt.amount) * 100));
            const isExpanded = expandedDebtId === debt.id;
            const dueStatus = getDueDateStatus(debt.dueDate);
            const isCompleted = debt.status === 'completed' || remaining === 0;

            return (
              <div
                key={debt.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                {/* Main Card Content */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar / Type Icon */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-500'
                            : isLend
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {debt.personName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {debt.personName}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isCompleted
                                ? 'bg-slate-100 text-slate-600'
                                : isLend
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isCompleted ? 'Đã thanh toán' : isLend ? 'Cho vay' : 'Đi vay'}
                          </span>
                        </div>

                        {/* Note & Date */}
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {debt.note || (isLend ? 'Khoản cho vay' : 'Khoản đi vay')}
                        </p>
                      </div>
                    </div>

                    {/* Amount & Remaining */}
                    <div className="text-right shrink-0">
                      <div
                        className={`text-base font-extrabold font-mono ${
                          isCompleted
                            ? 'text-slate-400 line-through'
                            : isLend
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {formatVND(debt.amount)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isCompleted ? (
                          <span className="text-teal-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                          </span>
                        ) : (
                          <span>
                            Còn lại: <strong className="text-slate-800 font-mono">{formatVND(remaining)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Đã trả: {formatVND(debt.paidAmount || 0)}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-teal-500'
                            : isLend
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Details: Dates & Badges */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateVietnamese(debt.startDate)}
                      </span>

                      {dueStatus && !isCompleted && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dueStatus.color} flex items-center gap-1`}
                        >
                          {dueStatus.isOverdue && <AlertTriangle className="w-3 h-3" />}
                          {dueStatus.text}
                        </span>
                      )}
                    </div>

                    {/* Expand History / Details Button */}
                    <button
                      onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                      className="text-slate-500 hover:text-slate-800 text-[11px] font-medium flex items-center gap-0.5"
                    >
                      {debt.repayments && debt.repayments.length > 0
                        ? `${debt.repayments.length} lần trả`
                        : 'Chi tiết'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    {!isCompleted && (
                      <button
                        onClick={() => openRepaymentModal(debt)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                          isLend
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isLend ? 'Thu nợ' : 'Trả bớt nợ'}</span>
                      </button>
                    )}

                    {/* Nhắc nợ / Soạn tin */}
                    <button
                      onClick={() => setReminderModalDebt(debt)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition"
                      title="Soạn tin nhắn nhắc nợ"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      <span>Nhắc nợ</span>
                    </button>

                    {/* Sửa */}
                    <button
                      onClick={() => openEditModal(debt)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition"
                      title="Sửa thông tin"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Xóa */}
                    <button
                      onClick={() => setDeletingDebt(debt)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Xóa khoản nợ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Repayment History Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50 p-3 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-teal-600" />
                        Lịch sử trả nợ ({debt.repayments?.length || 0})
                      </span>
                      {debt.phoneNumber && (
                        <a
                          href={`tel:${debt.phoneNumber}`}
                          className="text-teal-700 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> {debt.phoneNumber}
                        </a>
                      )}
                    </div>

                    {debt.repayments && debt.repayments.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {debt.repayments.map((rep, idx) => (
                          <div
                            key={rep.id || idx}
                            className="bg-white p-2 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">
                                {formatVND(rep.amount)}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-2">
                                {formatDateVietnamese(rep.date)}
                              </span>
                              {rep.note && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{rep.note}</p>
                              )}
                            </div>
                            <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                              Đợt {debt.repayments.length - idx}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-1">Chưa có lượt trả nợ nào.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Thêm / Sửa khoản nợ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up border border-slate-200">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">
                  {editingDebt ? 'Chỉnh sửa khoản nợ' : 'Thêm khoản nợ mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDebt} className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Loại giao dịch
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('lend')}
                    className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${
                      formType === 'lend'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    Cho vay (Tôi cho mượn)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('borrow')}
                    className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition ${
                      formType === 'borrow'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                    Đi vay (Tôi nợ người khác)
                  </button>
                </div>
              </div>

              {/* Person Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Người vay / Chủ nợ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Anh Nam, Bạn Linh..."
                  value={formPerson}
                  onChange={e => setFormPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại (tùy chọn)
                </label>
                <input
                  type="tel"
                  placeholder="0912 345 678"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số tiền (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="500000"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[200000, 500000, 1000000, 2000000, 5000000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormAmount(amt.toString())}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 transition"
                    >
                      {formatVND(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hạn trả (tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Wallet Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ví giao dịch liên quan
                </label>
                <select
                  value={formWalletId}
                  onChange={e => setFormWalletId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto record in cash flow checkbox (only for new records) */}
              {!editingDebt && (
                <label className="flex items-center gap-2 p-2 bg-teal-50/70 border border-teal-100 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRecordTransaction}
                    onChange={e => setFormRecordTransaction(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs text-teal-900 font-medium leading-tight">
                    Tự động ghi nhận giao dịch thu/chi vào Ví
                  </span>
                </label>
              )}

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Lý do vay mượn, hẹn trả..."
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                {editingDebt ? 'Lưu thay đổi' : 'Tạo khoản nợ'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ghi nhận thanh toán / Trả nợ */}
      {repayingDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-400 stroke-[2.5]" />
                <h3 className="font-bold text-sm">
                  {repayingDebt.type === 'lend' ? 'Thu nợ từ' : 'Trả nợ cho'}{' '}
                  {repayingDebt.personName}
                </h3>
              </div>
              <button
                onClick={() => setRepayingDebt(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRepayment} className="p-4 space-y-3">
              {/* Debt Summary Banner */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-500">Còn lại cần thanh toán:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatVND(Math.max(0, repayingDebt.amount - (repayingDebt.paidAmount || 0)))}
                </span>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={repAmount}
                  onChange={e => setRepAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />

                {/* Quick Fill Buttons */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setRepAmount(
                        Math.max(0, repayingDebt.amount - (repayingDebt.paidAmount || 0)).toString()
                      )
                    }
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-bold rounded-lg transition"
                  >
                    Trả hết (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRepAmount(
                        Math.round(
                          Math.max(0, repayingDebt.amount - (repayingDebt.paidAmount || 0)) / 2
                        ).toString()
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg transition"
                  >
                    Trả 50%
                  </button>
                </div>
              </div>

              {/* Wallet */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {repayingDebt.type === 'lend' ? 'Nhận vào ví' : 'Trích tiền từ ví'}
                </label>
                <select
                  value={repWalletId}
                  onChange={e => setRepWalletId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ngày thanh toán
                </label>
                <input
                  type="date"
                  required
                  value={repDate}
                  onChange={e => setRepDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Auto record tx */}
              <label className="flex items-center gap-2 p-2 bg-teal-50/70 border border-teal-100 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={repRecordTx}
                  onChange={e => setRepRecordTx(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs text-teal-900 font-medium leading-tight">
                  Tự động cập nhật số dư ví & sổ thu chi
                </span>
              </label>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đợt thanh toán 1..."
                  value={repNote}
                  onChange={e => setRepNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                Xác nhận thanh toán
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Mẫu tin nhắn nhắc nợ lịch sự */}
      {reminderModalDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-up border border-slate-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Soạn tin nhắn nhắc nợ</h3>
              </div>
              <button
                onClick={() => setReminderModalDebt(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                Tin nhắn mẫu lịch sự được tạo tự động để bạn sao chép gửi qua Zalo, Messenger hoặc SMS:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 leading-relaxed font-sans select-all">
                {generateReminderMessage(reminderModalDebt)}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() =>
                    handleCopyReminder(generateReminderMessage(reminderModalDebt))
                  }
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {copiedReminder ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép tin nhắn</span>
                    </>
                  )}
                </button>

                {reminderModalDebt.phoneNumber && (
                  <a
                    href={`sms:${reminderModalDebt.phoneNumber}?body=${encodeURIComponent(
                      generateReminderMessage(reminderModalDebt)
                    )}`}
                    className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-teal-700 transition"
                    title="Gửi SMS trực tiếp"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Debt Modal */}
      <ConfirmModal
        isOpen={!!deletingDebt}
        title="Xóa khoản nợ"
        message={deletingDebt ? `Bạn có chắc muốn xóa khoản ${deletingDebt.type === 'lend' ? 'cho vay' : 'đi vay'} của "${deletingDebt.personName}"?` : ''}
        confirmText="Xóa khoản nợ"
        type="danger"
        onConfirm={() => {
          if (deletingDebt) {
            deleteDebt(deletingDebt.id);
            setDeletingDebt(null);
          }
        }}
        onCancel={() => setDeletingDebt(null)}
      />
    </div>
  );
};
