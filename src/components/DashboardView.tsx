import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Plus,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Wallet as WalletIcon,
  Camera,
  Mic,
  Bot,
  HandCoins,
  PiggyBank,
  Users,
  QrCode,
  CreditCard,
  Pencil,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { formatVND, formatShortVND, formatDateVietnamese, triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { parseQuickExpenseText } from '../utils/nlpParser';
import { AIReceiptScannerModal } from './AIReceiptScannerModal';
import { AIVoiceInputModal } from './AIVoiceInputModal';
import { AIFinancialAdvisorModal } from './AIFinancialAdvisorModal';
import { WalletEditModal } from './WalletEditModal';
import { Wallet } from '../types/expense';

export const DashboardView: React.FC = () => {
  const {
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet,
    transactions,
    selectedMonth,
    setActiveTab,
    setIsAddModalOpen,
    setEditingTransaction,
    addTransaction,
    categories,
    wallets,
    budgets,
    debts,
    totalLent,
    totalBorrowed,
    savingsGoals,
    totalSavingsCurrent,
    totalSavingsTarget,
    splitBills,
    getCategoryById,
    getWalletById,
  } = useExpense();

  const [hideBalance, setHideBalance] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [quickSuccessMsg, setQuickSuccessMsg] = useState<string | null>(null);

  // AI Modal States
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  // Edit Wallet / Adjust Balance Modal
  const [showEditWalletModal, setShowEditWalletModal] = useState(false);
  const [selectedWalletToEdit, setSelectedWalletToEdit] = useState<Wallet | null>(null);

  // Month overall budget calculation
  const totalBudgetObj = budgets.find(b => b.categoryId === 'all' && b.month === selectedMonth);
  const budgetLimit = totalBudgetObj?.monthlyLimit || 0;
  const budgetPercent = budgetLimit > 0 ? Math.min(100, Math.round((monthExpense / budgetLimit) * 100)) : 0;

  // Filter transactions for selected month
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const recentTransactions = monthTransactions.slice(0, 5);

  // Split bill pending stats
  const splitBillsPendingAmount = React.useMemo(() => {
    return splitBills.reduce((totalPending, b) => {
      const payerId = b.payerMemberId;
      const collected = b.members
        .filter(m => m.isPaid || m.id === payerId || m.isPayer)
        .reduce((sum, m) => sum + m.amount, 0);
      return totalPending + Math.max(0, b.totalAmount - collected);
    }, 0);
  }, [splitBills]);

  const activeSplitBillsCount = splitBills.filter(b => b.status === 'pending').length;

  // Credit cards stats
  const creditCards = React.useMemo(() => {
    return wallets.filter(w => w.type === 'credit_card');
  }, [wallets]);

  const totalCreditDebt = React.useMemo(() => {
    return creditCards.reduce((sum, c) => sum + Math.abs(c.balance < 0 ? c.balance : 0), 0);
  }, [creditCards]);

  const totalCreditLimit = React.useMemo(() => {
    return creditCards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  }, [creditCards]);

  const primaryCreditCard = creditCards[0];

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const parsed = parseQuickExpenseText(quickInput, categories, wallets);
    if (!parsed.amount) {
      alert('Vui lòng nhập số tiền (Ví dụ: Ăn trưa 45k, Đổ xăng 50k)');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    addTransaction({
      type: parsed.type,
      amount: parsed.amount,
      categoryId: parsed.categoryId || 'cat_other_expense',
      walletId: parsed.walletId || wallets[0]?.id || 'wallet_cash',
      date: todayStr,
      time: nowTime,
      note: parsed.note,
    });

    setQuickSuccessMsg(`Đã ghi: ${parsed.note} (${formatVND(parsed.amount)})`);
    setQuickInput('');
    triggerHaptic('success');
    setTimeout(() => setQuickSuccessMsg(null), 3000);
  };

  const handleShortcutAdd = (text: string) => {
    setQuickInput(text);
    const parsed = parseQuickExpenseText(text, categories, wallets);
    if (parsed.amount) {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      addTransaction({
        type: parsed.type,
        amount: parsed.amount,
        categoryId: parsed.categoryId || 'cat_other_expense',
        walletId: parsed.walletId || wallets[0]?.id || 'wallet_cash',
        date: todayStr,
        time: nowTime,
        note: parsed.note,
      });
      setQuickSuccessMsg(`Đã lưu nhanh: ${parsed.note}`);
      setQuickInput('');
      triggerHaptic('success');
      setTimeout(() => setQuickSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="flex-1 pb-8 space-y-4 pt-3">
      {/* Hero Balance Card - Android Material You Curve */}
      <div className="px-4">
        <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden border border-teal-600/30">
          {/* Background subtle glowing circles */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header of card */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-teal-200/90 text-xs font-medium">
                <WalletIcon className="w-3.5 h-3.5" />
                <span>Tổng số dư hiện có</span>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setHideBalance(!hideBalance);
                }}
                className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition"
                title={hideBalance ? 'Hiện số dư' : 'Ẩn số dư'}
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Total Balance Amount */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight font-mono text-white">
                {hideBalance ? '•••••••• ₫' : formatVND(totalBalance)}
              </span>
            </div>

            {/* Net Savings Month Badge */}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-teal-200">Tháng này chênh lệch:</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  monthNet >= 0
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {monthNet >= 0 ? `+${formatVND(monthNet)}` : formatVND(monthNet)}
              </span>
            </div>

            {/* Monthly Income & Expense Split Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-medium mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Tổng thu</span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  {hideBalance ? '••••••' : formatVND(monthIncome)}
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-rose-300 text-xs font-medium mb-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Tổng chi</span>
                </div>
                <div className="text-base font-bold text-white font-mono">
                  {hideBalance ? '••••••' : formatVND(monthExpense)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Wallets & Direct Balance Adjustment Carousel */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Ví & Tài Khoản ({wallets.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('wallets');
            }}
            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-0.5"
          >
            Quản lý tất cả ví →
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {wallets.map(w => {
            const isCredit = w.type === 'credit_card';
            return (
              <div
                key={w.id}
                id={`dashboard-wallet-chip-${w.id}`}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedWalletToEdit(w);
                  setShowEditWalletModal(true);
                }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 min-w-[135px] max-w-[170px] border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:border-teal-400 dark:hover:border-teal-500 transition cursor-pointer shrink-0 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: w.color }}
                  >
                    <CategoryIcon name={w.icon} size={11} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                    {w.name}
                  </span>
                </div>
                <div
                  className={`text-xs font-black font-mono truncate ${
                    w.balance < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {hideBalance ? '••••••' : formatShortVND(w.balance)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-teal-600 dark:text-teal-400 mt-1 font-semibold">
                  <span className="flex items-center gap-0.5">
                    <Pencil className="w-2.5 h-2.5" /> Sửa số dư
                  </span>
                  {isCredit && (
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1 rounded">
                      Thẻ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Natural Language Input Bar (Android Fast Entry) */}
      <div className="px-4">
        <form
          onSubmit={handleQuickAddSubmit}
          className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200 flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            placeholder="Nhập nhanh: ăn trưa 45k, cafe 35k..."
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 shrink-0"
          >
            Lưu
          </button>
        </form>

        {/* Quick Shortcuts */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] text-slate-400 shrink-0">Gợi ý:</span>
          {[
            'Ăn sáng 35k',
            'Cà phê 30k',
            'Đổ xăng 70k',
            'Ăn trưa 50k',
            'Siêu thị 150k',
          ].map(shortcut => (
            <button
              key={shortcut}
              type="button"
              onClick={() => handleShortcutAdd(shortcut)}
              className="text-[11px] bg-slate-200/80 hover:bg-teal-100 hover:text-teal-800 text-slate-700 px-2.5 py-1 rounded-lg transition shrink-0 active:scale-95 font-medium"
            >
              + {shortcut}
            </button>
          ))}
        </div>

        {quickSuccessMsg && (
          <div className="mt-2 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{quickSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* AI Smart Tools (Gemini 3.8 Suite) */}
      <div className="px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-3 text-white shadow-sm border border-slate-700/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-bold text-slate-100">Tiện ích AI Thông Minh</span>
              <span className="text-[9px] font-semibold bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded border border-teal-500/30">
                Gemini 3.8
              </span>
            </div>
            <span className="text-[10px] text-slate-400">1 chạm ghi chép</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsReceiptScannerOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 active:scale-95 transition text-center group"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200">Quét Hóa Đơn</span>
              <span className="text-[9px] text-slate-400">Đọc bill / OCR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsVoiceInputOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 active:scale-95 transition text-center group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Mic className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200">Giọng Nói AI</span>
              <span className="text-[9px] text-slate-400">Nói để ghi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsAdvisorOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 active:scale-95 transition text-center group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-200">Cố Vấn AI</span>
              <span className="text-[9px] text-slate-400">Tư vấn tiết kiệm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Budget Summary Banner */}
      {budgetLimit > 0 && (
        <div className="px-4">
          <div
            onClick={() => setActiveTab('budget')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 cursor-pointer hover:border-teal-300 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">Hạn mức chi tiêu tháng</span>
              </div>
              <span className="text-xs font-bold text-slate-600 font-mono">
                {formatShortVND(monthExpense)} / {formatShortVND(budgetLimit)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPercent > 90
                    ? 'bg-rose-500'
                    : budgetPercent > 70
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span
                className={
                  budgetPercent > 90
                    ? 'text-rose-600 font-semibold flex items-center gap-1'
                    : 'text-slate-500'
                }
              >
                {budgetPercent > 90 && <AlertTriangle className="w-3 h-3" />}
                Đã dùng {budgetPercent}% ngân sách
              </span>
              <span className="text-slate-400 hover:text-teal-600 font-medium">
                Chi tiết & điều chỉnh →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sổ Nợ & Cho Vay Card */}
      <div className="px-4">
        <div
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('debts');
          }}
          className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 cursor-pointer hover:border-teal-300 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800">Sổ Nợ & Cho Vay</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  {debts.filter(d => d.status === 'active').length} khoản đang theo dõi
                </span>
              </div>
            </div>
            <span className="text-[11px] text-teal-600 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
              Chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div className="bg-emerald-50/60 rounded-xl p-2 border border-emerald-100/60">
              <span className="text-[10px] text-emerald-800 font-semibold block">Cần thu về</span>
              <span className="text-xs font-black font-mono text-emerald-700">{formatShortVND(totalLent)}</span>
            </div>
            <div className="bg-amber-50/60 rounded-xl p-2 border border-amber-100/60">
              <span className="text-[10px] text-amber-800 font-semibold block">Cần thanh toán</span>
              <span className="text-xs font-black font-mono text-amber-700">{formatShortVND(totalBorrowed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Thẻ Tín Dụng & Chu Kỳ Sao Kê Card */}
      {creditCards.length > 0 && (
        <div className="px-4">
          <div
            id="dashboard-credit-card-card"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('credit_cards');
            }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Thẻ Tín Dụng & Chu Kỳ
                  </span>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    {creditCards.length} thẻ • {primaryCreditCard?.name || 'Theo dõi chu kỳ sao kê'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                Quản lý <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-2 border border-indigo-100/60 dark:border-indigo-900/40">
                <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-semibold block">Dư nợ hiện tại</span>
                <span className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-400">
                  {formatVND(totalCreditDebt)}
                </span>
              </div>
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-2 border border-emerald-100/60 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold block">Hạn mức khả dụng</span>
                <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {formatShortVND(Math.max(0, totalCreditLimit - totalCreditDebt))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heo Đất & Mục Tiêu Tiết Kiệm Card */}
      <div className="px-4">
        <div
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('savings');
          }}
          className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 cursor-pointer hover:border-teal-300 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800">Heo Đất & Mục Tiêu</span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  {savingsGoals.length} mục tiêu • {totalSavingsTarget > 0 ? Math.round((totalSavingsCurrent / totalSavingsTarget) * 100) : 0}% hoàn thành
                </span>
              </div>
            </div>
            <span className="text-[11px] text-teal-600 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
              Chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="pt-1 border-t border-slate-100 space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-extrabold text-teal-700 font-mono">
                {formatShortVND(totalSavingsCurrent)}
              </span>
              <span className="text-[11px] text-slate-400">
                Mục tiêu: {formatShortVND(totalSavingsTarget)}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 rounded-full h-full transition-all duration-500"
                style={{
                  width: `${totalSavingsTarget > 0 ? Math.min(100, Math.round((totalSavingsCurrent / totalSavingsTarget) * 100)) : 0}%`,
                }}
              />
            </div>

            {savingsGoals.length > 0 && (
              <div className="flex items-center gap-2 pt-0.5 overflow-x-auto">
                {savingsGoals.slice(0, 3).map(g => (
                  <div
                    key={g.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[10px] shrink-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="font-medium text-slate-700 truncate max-w-[90px]">{g.name}</span>
                    <span className="font-bold text-teal-700 font-mono">
                      {Math.round((g.currentAmount / g.targetAmount) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chia Tiền Nhóm & VietQR Card */}
      <div className="px-4">
        <div
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('split_bill');
          }}
          className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 rounded-2xl p-3.5 shadow-sm border border-emerald-200/80 dark:border-emerald-800/40 cursor-pointer hover:border-emerald-400 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Chia Tiền Nhóm & VietQR
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    VietQR
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  {splitBills.length} cuộc hẹn • {activeSplitBillsCount} bill đang chờ thanh toán
                </span>
              </div>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
              Mở chia tiền <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100/70 dark:border-slate-800">
            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-2 border border-emerald-100/60 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-500 font-medium block">Cần thu về</span>
              <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
                {formatShortVND(splitBillsPendingAmount)}
              </span>
            </div>
            <div className="bg-emerald-600/10 rounded-xl p-2 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium block">
                  Mã QR chuyển khoản
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Chuẩn VietQR
                </span>
              </div>
              <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Wallets preview carousel */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ví & Tài khoản ({wallets.length})
          </h3>
          <button
            onClick={() => setActiveTab('wallets')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-0.5"
          >
            Quản lý ví <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {wallets.map(w => (
            <div
              key={w.id}
              onClick={() => setActiveTab('wallets')}
              className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200/90 flex flex-col justify-between hover:shadow-md transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: w.color }}
                >
                  <CategoryIcon name={w.icon} size={15} />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {w.type === 'cash' ? 'TM' : w.type === 'bank' ? 'Bank' : 'Ví'}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 truncate" title={w.name}>
                  {w.name}
                </div>
                <div className="text-[11px] font-semibold text-teal-700 font-mono mt-0.5">
                  {hideBalance ? '••••' : formatShortVND(w.balance)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Giao dịch gần đây
          </h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-0.5"
          >
            Xem tất cả ({monthTransactions.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-400">
            <p className="text-sm">Chưa có giao dịch nào trong tháng này.</p>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
              className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm khoản đầu tiên
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl divide-y divide-slate-100 shadow-xs border border-slate-200 overflow-hidden">
            {recentTransactions.map(tx => {
              const cat = getCategoryById(tx.categoryId);
              const wallet = getWalletById(tx.walletId);
              const isExpense = tx.type === 'expense';
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    setEditingTransaction(tx);
                    setIsAddModalOpen(true);
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition active:bg-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isExpense
                          ? cat?.bgColor || 'bg-orange-50 text-orange-600'
                          : isIncome
                          ? cat?.bgColor || 'bg-emerald-50 text-emerald-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <CategoryIcon
                        name={tx.type === 'transfer' ? 'ArrowRightLeft' : cat?.icon || 'Coins'}
                        size={18}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {tx.note || cat?.name || (tx.type === 'transfer' ? 'Chuyển khoản' : 'Khoản chi')}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{formatDateVietnamese(tx.date)}</span>
                        <span>•</span>
                        <span className="truncate">{wallet?.name || 'Ví'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div
                      className={`text-xs font-bold font-mono ${
                        isExpense ? 'text-slate-800' : isIncome ? 'text-emerald-600' : 'text-blue-600'
                      }`}
                    >
                      {isExpense ? `-${formatVND(tx.amount)}` : isIncome ? `+${formatVND(tx.amount)}` : formatVND(tx.amount)}
                    </div>
                    {tx.time && <div className="text-[10px] text-slate-400 font-mono">{tx.time}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Modals */}
      <AIReceiptScannerModal
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
      />

      <AIVoiceInputModal
        isOpen={isVoiceInputOpen}
        onClose={() => setIsVoiceInputOpen(false)}
      />

      <AIFinancialAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
      />

      {/* Wallet Edit / Balance Adjustment Modal */}
      <WalletEditModal
        isOpen={showEditWalletModal}
        onClose={() => {
          setShowEditWalletModal(false);
          setSelectedWalletToEdit(null);
        }}
        wallet={selectedWalletToEdit}
      />
    </div>
  );
};
