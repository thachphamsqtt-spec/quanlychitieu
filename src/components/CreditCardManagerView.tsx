import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Edit2,
  Lock,
  Unlock,
  Copy,
  Check,
  Percent,
  Receipt,
  ArrowRightLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Wallet, Transaction } from '../types/expense';
import { useExpense } from '../context/ExpenseContext';
import {
  getCreditCardCycleInfo,
  getCreditUtilization,
  calculateMinimumDue,
  getCardTransactions,
} from '../utils/creditCard';
import { CreditCardRepayModal } from './CreditCardRepayModal';
import { CreditCardSimulatorModal } from './CreditCardSimulatorModal';
import { CreditCardFormModal } from './CreditCardFormModal';
import { CategoryIcon } from './CategoryIcon';
import { triggerHaptic } from '../utils/formatters';

interface CreditCardManagerViewProps {
  onBack?: () => void;
}

export const CreditCardManagerView: React.FC<CreditCardManagerViewProps> = ({ onBack }) => {
  const {
    wallets,
    transactions,
    formatMoney,
    formatShortMoney,
    updateWallet,
    setActiveTab,
  } = useExpense();

  // Filter credit card wallets
  const creditCards = useMemo(() => {
    return wallets.filter(w => w.type === 'credit_card');
  }, [wallets]);

  // Selected active credit card ID
  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    return creditCards[0]?.id || '';
  });

  // Modals state
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Wallet | null>(null);

  // Active card
  const activeCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];

  // Transaction filter in card
  const [txFilter, setTxFilter] = useState<'cycle' | 'all'>('cycle');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Ensure selected card updates if cards change
  React.useEffect(() => {
    if (!selectedCardId && creditCards.length > 0) {
      setSelectedCardId(creditCards[0].id);
    }
  }, [creditCards, selectedCardId]);

  if (!activeCard || creditCards.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic('light');
                if (onBack) onBack();
                else setActiveTab('wallets');
              }}
              className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Quản Lý Thẻ Tín Dụng</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                  Credit Cards
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi chu kỳ sao kê, hạn mức khả dụng và kiểm soát miễn lãi
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Bạn chưa có thẻ tín dụng nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Thêm thẻ tín dụng của bạn (VPBank, Techcombank, VIB, HSBC...) để theo dõi chính xác ngày sao kê, hạn thanh toán và tận dụng tối đa 45-55 ngày miễn lãi.
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              setCardToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thẻ Tín Dụng Đầu Tiên</span>
          </button>
        </div>

        {/* Form Modal */}
        <CreditCardFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          cardToEdit={cardToEdit}
        />
      </div>
    );
  }

  // Calculate cycle & metrics for active card
  const cycleInfo = getCreditCardCycleInfo(activeCard);
  const utilInfo = getCreditUtilization(activeCard);
  const minDue = calculateMinimumDue(activeCard);
  const allCardTransactions = getCardTransactions(transactions, activeCard.id);

  // Filter transactions by cycle if selected
  const displayedTransactions = allCardTransactions.filter(t => {
    if (txFilter === 'all') return true;
    return t.date >= cycleInfo.currentCycleStart && t.date <= cycleInfo.currentCycleEnd;
  });

  const cycleTotalSpent = displayedTransactions
    .filter(t => t.type === 'expense' && t.walletId === activeCard.id)
    .reduce((sum, t) => sum + t.amount, 0);

  const handleCopyCard = () => {
    if (activeCard.accountNumber) {
      navigator.clipboard.writeText(activeCard.accountNumber);
      setCopiedNumber(true);
      triggerHaptic('light');
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleToggleCardLock = () => {
    const nextLocked = !activeCard.isCardLocked;
    updateWallet(activeCard.id, { isCardLocked: nextLocked });
    triggerHaptic('medium');
    alert(nextLocked ? `Đã tạm khóa thẻ "${activeCard.name}".` : `Đã mở khóa thẻ "${activeCard.name}".`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            id="back-to-wallets-btn"
            onClick={() => {
              triggerHaptic('light');
              if (onBack) onBack();
              else setActiveTab('wallets');
            }}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-xs shrink-0"
            title="Quay lại danh sách ví"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Quản Lý Thẻ Tín Dụng
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase">
                Chu kỳ & Hạn mức
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiểm soát dư nợ, ngày sao kê và tối ưu hóa thời gian miễn lãi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-sim-btn"
            onClick={() => {
              triggerHaptic('light');
              setIsSimModalOpen(true);
            }}
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Mô Phỏng Lãi Suất</span>
          </button>

          <button
            id="add-credit-card-btn"
            onClick={() => {
              triggerHaptic('light');
              setCardToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Thẻ</span>
          </button>
        </div>
      </div>

      {/* Card Switcher Pills (If user has multiple credit cards) */}
      {creditCards.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {creditCards.map(c => {
            const isSelected = c.id === activeCard.id;
            const cDebt = Math.abs(c.balance < 0 ? c.balance : 0);
            return (
              <button
                key={c.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCardId(c.id);
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.color || '#4338ca' }}
                />
                <span>{c.name}</span>
                <span className={`text-[10px] font-mono font-normal opacity-80 ${cDebt > 0 ? 'text-amber-400' : ''}`}>
                  ({cDebt > 0 ? `Nợ ${formatShortMoney(cDebt)}` : 'Hết nợ'})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Grid: Card Visual + Cycle Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Visual 3D Credit Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Card Visual Container */}
          <div
            className="w-full aspect-[1.586/1] rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 select-none group"
            style={{
              backgroundColor: activeCard.color || '#4338ca',
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.35) 100%)',
            }}
          >
            {/* Background metallic glow / patterns */}
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-12 w-40 h-40 rounded-full bg-black/20 blur-xl pointer-events-none" />

            {/* Top row: Bank Name + Network */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-wider uppercase drop-shadow-xs">
                  {activeCard.bankName || 'NGÂN HÀNG'}
                </span>
                {activeCard.isCardLocked && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/80 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Đã Khóa
                  </span>
                )}
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-widest border border-white/20">
                {(activeCard.cardNetwork || 'visa').toUpperCase()}
              </span>
            </div>

            {/* Middle: EMV Chip & Contactless */}
            <div className="flex items-center gap-3 relative z-10 py-1">
              {/* Golden Chip */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-600/40 shadow-inner flex items-center justify-center overflow-hidden">
                <div className="w-full h-full border border-amber-600/30 rounded-xs flex items-center justify-center">
                  <div className="w-4 h-3 border-r border-l border-amber-700/30" />
                </div>
              </div>
              {/* Contactless Waves */}
              <svg className="w-5 h-5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                <path d="M12 19a9 9 0 0 0 0-14" />
                <path d="M15.5 21.5a13 13 0 0 0 0-19" />
              </svg>
            </div>

            {/* Card Number */}
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="text-base sm:text-lg font-mono font-bold tracking-[0.25em] text-white/95 drop-shadow-sm">
                  •••• •••• •••• {activeCard.accountNumber || '9012'}
                </div>
                <button
                  onClick={handleCopyCard}
                  className="p-1 rounded-md bg-white/10 hover:bg-white/20 transition text-white/80"
                  title="Sao chép số thẻ"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Cardholder & Expiry */}
              <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/20 text-[10px] sm:text-[11px] uppercase tracking-wider text-white/80">
                <div>
                  <span className="block text-[8px] text-white/60">CHỦ THẺ</span>
                  <span className="font-bold text-white">{activeCard.cardHolderName || 'CHỦ THẺ'}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-white/60">HẠN MỨC</span>
                  <span className="font-mono font-bold text-white">
                    {formatShortMoney(activeCard.creditLimit || 30000000)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Under Card */}
          <div className="grid grid-cols-3 gap-2">
            <button
              id="repay-card-btn"
              onClick={() => {
                triggerHaptic('light');
                setIsRepayModalOpen(true);
              }}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-md shadow-indigo-600/20 transition"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Thanh Toán Nợ</span>
            </button>

            <button
              id="edit-card-btn"
              onClick={() => {
                triggerHaptic('light');
                setCardToEdit(activeCard);
                setIsFormModalOpen(true);
              }}
              className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs"
            >
              <Edit2 className="w-4 h-4" />
              <span>Chỉnh Sửa</span>
            </button>

            <button
              id="lock-card-btn"
              onClick={handleToggleCardLock}
              className={`p-2.5 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs border ${
                activeCard.isCardLocked
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {activeCard.isCardLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{activeCard.isCardLocked ? 'Mở Khóa' : 'Khóa Thẻ'}</span>
            </button>
          </div>

          {/* Cashback & Perks note */}
          {activeCard.cashbackNote && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-300 block">Ưu đãi hoàn tiền:</span>
                <span className="text-slate-600 dark:text-slate-300">{activeCard.cashbackNote}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Cycle Countdown & 4 Bento Metrics (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Cycle Countdown Status Banner */}
          <div
            className={`p-4 rounded-3xl border space-y-3 transition ${
              cycleInfo.isOverdue
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                : cycleInfo.daysUntilDue <= 3 && utilInfo.usedAmount > 0
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                : 'bg-gradient-to-br from-indigo-50/70 via-slate-50 to-teal-50/40 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800/50 border-indigo-100 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cycleInfo.statusText}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-600">
                Miễn lãi {cycleInfo.gracePeriodDays} ngày
              </span>
            </div>

            {/* Dates Progress Indicator */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-medium block">Kỳ này bắt đầu</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cycleInfo.currentCycleStart}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                  Chốt sao kê (còn {cycleInfo.daysUntilStatement} ngày)
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cycleInfo.currentCycleEnd}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                  Hạn trả nợ (còn {cycleInfo.daysUntilDue} ngày)
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {cycleInfo.nextDueDate}
                </span>
              </div>
            </div>

            {/* Smart Golden Tip */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              {cycleInfo.goldenTimeTip}
            </p>
          </div>

          {/* 4 Bento Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1: Dư nợ hiện tại */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dư nợ hiện tại
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {formatMoney(utilInfo.usedAmount)}
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Tối thiểu: <b>{formatMoney(minDue)}</b></span>
                {utilInfo.usedAmount > 0 && (
                  <button
                    onClick={() => setIsRepayModalOpen(true)}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    Trả ngay →
                  </button>
                )}
              </div>
            </div>

            {/* Metric 2: Hạn mức khả dụng */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Hạn mức khả dụng
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatMoney(utilInfo.availableLimit)}
              </div>
              <div className="text-[10px] text-slate-400">
                Tổng hạn mức: {formatShortMoney(utilInfo.creditLimit)}
              </div>
            </div>

            {/* Metric 3: Tỷ lệ sử dụng hạn mức (Utilization Rate) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2 col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tỷ lệ sử dụng hạn mức (Credit Utilization)
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${utilInfo.ratingColor}`}>
                  {utilInfo.ratingLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    utilInfo.rating === 'danger'
                      ? 'bg-rose-500'
                      : utilInfo.rating === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, utilInfo.utilizationRate)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {utilInfo.utilizationRate}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {utilInfo.ratingDescription}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section For This Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span>Giao Dịch Thẻ {activeCard.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tổng chi tiêu quẹt thẻ chu kỳ này: <b className="text-indigo-600 dark:text-indigo-400 font-mono">{formatMoney(cycleTotalSpent)}</b>
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
            <button
              onClick={() => setTxFilter('cycle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                txFilter === 'cycle'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Chu kỳ hiện tại
            </button>
            <button
              onClick={() => setTxFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                txFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả ({allCardTransactions.length})
            </button>
          </div>
        </div>

        {/* List of transactions */}
        {displayedTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Chưa có giao dịch quẹt thẻ nào trong khoảng thời gian này
            </p>
            <p className="text-[11px] text-slate-400">
              Khi thêm chi tiêu, chọn ví "{activeCard.name}" để ghi nhận vào sao kê.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {displayedTransactions.map(tx => {
              const isRepayment = tx.type === 'transfer' && tx.toWalletId === activeCard.id;
              const isExpense = tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition px-2 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isRepayment
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                      }`}
                    >
                      {isRepayment ? (
                        <ArrowRightLeft className="w-4 h-4" />
                      ) : (
                        <CategoryIcon name="CreditCard" size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {tx.note || (isRepayment ? 'Thanh toán dư nợ thẻ' : 'Chi tiêu thẻ')}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {tx.date} • {isRepayment ? 'Hoàn lại hạn mức' : 'Quẹt thẻ'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-black font-mono ${
                        isRepayment ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isRepayment ? `+${formatMoney(tx.amount)}` : `-${formatMoney(tx.amount)}`}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {isRepayment ? 'Đã trả' : 'Đã ghi nợ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Repay Modal */}
      <CreditCardRepayModal
        card={activeCard}
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
      />

      {/* Simulator Modal */}
      <CreditCardSimulatorModal
        card={activeCard}
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
      />

      {/* Form Modal */}
      <CreditCardFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        cardToEdit={cardToEdit}
      />
    </div>
  );
};
