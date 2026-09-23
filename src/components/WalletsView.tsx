import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  ArrowRightLeft,
  Target,
  Edit3,
  Trash2,
  Check,
  AlertCircle,
  AlertTriangle,
  Landmark,
  Banknote,
  Smartphone,
  CreditCard,
  Calendar,
  Sparkles,
  Repeat,
  FolderKanban,
  PiggyBank,
  Users,
  QrCode,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Wallet, WalletType } from '../types/expense';
import { CategoryManagerModal } from './CategoryManagerModal';
import { ConfirmModal } from './ConfirmModal';
import { RecurringManagerModal } from './RecurringManagerModal';
import { SavingsGoalsView } from './SavingsGoalsView';
import { CreditCardManagerView } from './CreditCardManagerView';
import { WalletEditModal } from './WalletEditModal';

export const WalletsView: React.FC = () => {
  const {
    wallets,
    totalBalance,
    addWallet,
    updateWallet,
    deleteWallet,
    budgets,
    setBudget,
    deleteBudget,
    selectedMonth,
    categories,
    transactions,
    addTransaction,
    getCategoryById,
    formatMoney,
    formatShortMoney,
    savingsGoals,
    splitBills,
    setActiveTab,
  } = useExpense();

  const [activeSubTab, setActiveSubTab] = useState<'wallets' | 'credit_cards' | 'budgets' | 'savings'>('wallets');
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);

  const creditCards = React.useMemo(() => {
    return wallets.filter(w => w.type === 'credit_card');
  }, [wallets]);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState(wallets[0]?.id || '');
  const [transferTo, setTransferTo] = useState(wallets[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Add Wallet Modal
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<WalletType>('bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newWalletLimit, setNewWalletLimit] = useState('');
  const [newWalletStatementDate, setNewWalletStatementDate] = useState('20');

  // Edit Wallet / Adjust Balance Modal
  const [showEditWalletModal, setShowEditWalletModal] = useState(false);
  const [selectedWalletToEdit, setSelectedWalletToEdit] = useState<Wallet | null>(null);

  // Add/Edit Budget Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCatId, setBudgetCatId] = useState('all');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');

  // Calculate expense for each category in selected month
  const categorySpentMap = React.useMemo(() => {
    const map: { [catId: string]: number } = { all: 0 };
    transactions.forEach(t => {
      if (t.date.startsWith(selectedMonth) && t.type === 'expense') {
        map['all'] = (map['all'] || 0) + t.amount;
        const cat = t.categoryId || 'cat_other_expense';
        map[cat] = (map[cat] || 0) + t.amount;
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  // Budget warnings
  const budgetAlerts = React.useMemo(() => {
    const alerts: { title: string; percent: number; isOver: boolean }[] = [];
    budgets
      .filter(b => b.month === selectedMonth)
      .forEach(b => {
        const spent = categorySpentMap[b.categoryId] || 0;
        const percent = Math.round((spent / b.monthlyLimit) * 100);
        const name = b.categoryId === 'all' ? 'Tổng ngân sách' : getCategoryById(b.categoryId)?.name || 'Danh mục';
        if (percent >= 100) {
          alerts.push({ title: `${name} đã vượt ngân sách (${percent}%)`, percent, isOver: true });
        } else if (percent >= 80) {
          alerts.push({ title: `${name} đã đạt ${percent}% hạn mức`, percent, isOver: false });
        }
      });
    return alerts;
  }, [budgets, selectedMonth, categorySpentMap, getCategoryById]);

  // Handle Transfer
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (transferFrom === transferTo) {
      alert('Ví chuyển và ví nhận không thể trùng nhau!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    addTransaction({
      type: 'transfer',
      amount,
      categoryId: '',
      walletId: transferFrom,
      toWalletId: transferTo,
      date: todayStr,
      time: nowTime,
      note: transferNote.trim() || 'Chuyển tiền giữa các ví',
    });

    setShowTransferModal(false);
    setTransferAmount('');
    setTransferNote('');
  };

  // Handle Add Wallet
  const handleAddWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    let icon = 'Landmark';
    let color = '#0f766e';

    if (newWalletType === 'cash') {
      icon = 'Banknote';
      color = '#059669';
    } else if (newWalletType === 'e_wallet') {
      icon = 'Smartphone';
      color = '#a21caf';
    } else if (newWalletType === 'credit_card') {
      icon = 'CreditCard';
      color = '#4338ca';
    } else if (newWalletName.toLowerCase().includes('mb')) {
      icon = 'Landmark';
      color = '#0033a0';
    } else if (newWalletName.toLowerCase().includes('techcom')) {
      icon = 'Landmark';
      color = '#e11d48';
    } else if (newWalletName.toLowerCase().includes('vcb') || newWalletName.toLowerCase().includes('vietcom')) {
      icon = 'Landmark';
      color = '#005b41';
    }

    const balance = parseFloat(newWalletBalance) || 0;
    const creditLimit = newWalletType === 'credit_card' ? parseFloat(newWalletLimit) || 20000000 : undefined;
    const statementDate = newWalletType === 'credit_card' ? parseInt(newWalletStatementDate) || 20 : undefined;

    addWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      balance,
      icon,
      color,
      creditLimit,
      statementDate,
    });

    setShowAddWalletModal(false);
    setNewWalletName('');
    setNewWalletBalance('');
    setNewWalletLimit('');
  };

  // Handle Add/Edit Budget
  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimitStr);
    if (!limit || limit <= 0) {
      alert('Vui lòng nhập hạn mức lớn hơn 0');
      return;
    }

    setBudget(budgetCatId, limit, selectedMonth);
    setShowBudgetModal(false);
    setBudgetLimitStr('');
  };

  return (
    <div className="flex-1 pb-10 space-y-4 px-4 pt-3">
      {/* Sub-navigation Tabs: Ví tiền, Thẻ tín dụng, Hạn mức, Heo đất & 6 Hũ */}
      <div className="bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl flex gap-1 overflow-x-auto">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('wallets');
          }}
          className={`flex-1 min-w-[70px] py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'wallets' ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <WalletCards className="w-3.5 h-3.5" />
          <span>Ví ({wallets.length})</span>
        </button>
        <button
          id="subtab-credit-cards"
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('credit_cards');
          }}
          className={`flex-1 min-w-[85px] py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'credit_cards' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Thẻ TD ({creditCards.length})</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('budgets');
          }}
          className={`flex-1 min-w-[75px] py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'budgets' ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Hạn Mức</span>
          {budgetAlerts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('savings');
          }}
          className={`flex-1 min-w-[85px] py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'savings' ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>Heo Đất & Hũ</span>
        </button>
      </div>

      {/* Quick shortcuts to Category, Recurring management, Split Bill, and Credit Cards */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowCategoryModal(true);
          }}
          className="p-2 sm:p-2.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-1.5 text-teal-800 hover:bg-teal-100/70 transition text-center sm:text-left"
        >
          <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <FolderKanban className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold block leading-tight truncate">Danh mục</span>
            <span className="text-[9px] text-teal-600 hidden sm:block">Sửa/thêm</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setShowRecurringModal(true);
          }}
          className="p-2 sm:p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-1.5 text-indigo-800 hover:bg-indigo-100/70 transition text-center sm:text-left"
        >
          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Repeat className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold block leading-tight truncate">Định kỳ</span>
            <span className="text-[9px] text-indigo-600 hidden sm:block">Thuê nhà...</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('split_bill');
          }}
          className="p-2 sm:p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-1.5 text-emerald-800 hover:bg-emerald-100/80 transition text-center sm:text-left relative"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold block leading-tight truncate">Chia tiền</span>
            <span className="text-[9px] text-emerald-600 hidden sm:block">Mã VietQR</span>
          </div>
          {splitBills.some(b => b.status === 'pending') && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          id="shortcut-credit-cards"
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('credit_cards');
          }}
          className="p-2 sm:p-2.5 bg-indigo-50/90 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-1.5 text-indigo-900 hover:bg-indigo-100/90 transition text-center sm:text-left relative"
        >
          <div className="w-7 h-7 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold block leading-tight truncate">Thẻ tín dụng</span>
            <span className="text-[9px] text-indigo-600 hidden sm:block">Sao kê & Nợ</span>
          </div>
          {creditCards.some(c => c.balance < 0) && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
      </div>

      {activeSubTab === 'wallets' && (
        /* Wallets SubTab */
        <div className="space-y-4">
          {/* Total Net Balance Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
            <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider block mb-1">
              Tổng tài sản khả dụng
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight mb-4">
              {formatMoney(totalBalance)}
            </div>

            <div className="flex gap-2 pt-1 border-t border-slate-700/60">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowTransferModal(true);
                }}
                className="flex-1 py-2 bg-teal-600/90 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Chuyển Tiền Ví
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowAddWalletModal(true);
                }}
                className="flex-1 py-2 bg-slate-700/80 hover:bg-slate-600 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo Ví Mới
              </button>
            </div>
          </div>

          {/* Wallets List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Danh sách tài khoản ({wallets.length})
              </h3>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                Chạm ví để sửa số dư & thông tin
              </span>
            </div>

            {wallets.map(wallet => {
              const isCredit = wallet.type === 'credit_card';
              const creditLimit = wallet.creditLimit || 0;
              const usedCredit = Math.abs(wallet.balance);
              const availableCredit = Math.max(0, creditLimit - usedCredit);
              const creditPercent = creditLimit > 0 ? Math.min(100, Math.round((usedCredit / creditLimit) * 100)) : 0;

              return (
                <div
                  key={wallet.id}
                  id={`wallet-item-${wallet.id}`}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedWalletToEdit(wallet);
                    setShowEditWalletModal(true);
                  }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5 cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition"
                        style={{ backgroundColor: wallet.color }}
                      >
                        <CategoryIcon name={wallet.icon} size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                            {wallet.name}
                          </h4>
                          {isCredit && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[9px] font-extrabold rounded-md uppercase">
                              Thẻ Tín Dụng
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {wallet.type === 'cash'
                            ? 'Tiền mặt'
                            : wallet.type === 'bank'
                            ? (wallet.bankName ? `Ngân hàng ${wallet.bankName}` : 'Tài khoản ngân hàng')
                            : wallet.type === 'e_wallet'
                            ? 'Ví điện tử'
                            : 'Thẻ tín dụng'}
                          {wallet.accountNumber ? ` • ${wallet.accountNumber}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div
                        className={`text-sm font-extrabold font-mono ${
                          wallet.balance < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatMoney(wallet.balance)}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <button
                          type="button"
                          id={`btn-edit-wallet-${wallet.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            setSelectedWalletToEdit(wallet);
                            setShowEditWalletModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-2 py-0.5 rounded-lg transition"
                          title="Sửa số dư và thông tin ví"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Sửa số dư</span>
                        </button>
                        {wallets.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingWallet(wallet);
                            }}
                            className="text-[11px] text-slate-300 hover:text-rose-600 transition px-1 py-0.5"
                            title="Xóa ví"
                          >
                            Xóa ví
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Credit Card Details if applicable */}
                  {isCredit && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Hạn mức: {formatShortMoney(creditLimit)}</span>
                        <span>Khả dụng: <strong className="text-emerald-600 font-mono">{formatShortMoney(availableCredit)}</strong></span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                          style={{ width: `${creditPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Sao kê: Ngày {wallet.statementDate || 20}</span>
                          {wallet.paymentDueDate && (
                            <span> • Hạn: Ngày {wallet.paymentDueDate}</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            setActiveSubTab('credit_cards');
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md transition"
                        >
                          <span>Chu kỳ & Nợ</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'credit_cards' && (
        <CreditCardManagerView onBack={() => setActiveSubTab('wallets')} />
      )}

      {activeSubTab === 'budgets' && (
        /* Budgets SubTab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hạn mức ngân sách ({selectedMonth})
              </h3>
              <p className="text-[11px] text-slate-400">Kiểm soát chi tiêu & cảnh báo tự động khi đạt 80%</p>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                setShowBudgetModal(true);
              }}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Đặt hạn mức
            </button>
          </div>

          {/* Warning Banner if any budget triggered alert */}
          {budgetAlerts.length > 0 && (
            <div className="space-y-1.5">
              {budgetAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium border ${
                    alert.isOver
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {alert.isOver ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{alert.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Budgets list */}
          <div className="space-y-3">
            {budgets.filter(b => b.month === selectedMonth).length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-400">
                <Target className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">Chưa thiết lập ngân sách cho tháng này.</p>
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="mt-3 px-3 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold shadow inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Đặt ngân sách tổng
                </button>
              </div>
            ) : (
              budgets
                .filter(b => b.month === selectedMonth)
                .map(budget => {
                  const isAll = budget.categoryId === 'all';
                  const cat = isAll ? null : getCategoryById(budget.categoryId);
                  const spent = categorySpentMap[budget.categoryId] || 0;
                  const percent = Math.round((spent / budget.monthlyLimit) * 100);
                  const isOver = spent > budget.monthlyLimit;
                  const isWarning = percent >= 80 && !isOver;

                  return (
                    <div
                      key={budget.id}
                      className={`bg-white rounded-2xl p-4 border shadow-xs space-y-2.5 transition ${
                        isOver
                          ? 'border-rose-300 bg-rose-50/20'
                          : isWarning
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isAll ? 'bg-teal-100 text-teal-800' : cat?.bgColor || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <CategoryIcon name={isAll ? 'Target' : cat?.icon || 'Coins'} size={15} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              {isAll ? 'Tổng ngân sách tháng' : cat?.name || 'Danh mục'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {formatShortMoney(spent)} / {formatShortMoney(budget.monthlyLimit)}
                          </span>
                          <button
                            onClick={() => deleteBudget(budget.id)}
                            className="p-1 text-slate-300 hover:text-rose-600"
                            title="Xóa hạn mức"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        >
                          {isOver
                            ? `Vượt hạn mức ${formatShortMoney(spent - budget.monthlyLimit)}!`
                            : isWarning
                            ? `Cảnh báo: Đã dùng ${percent}%!`
                            : `Đã dùng ${percent}%`}
                        </span>
                        <span className="text-slate-500">
                          Còn lại: {formatShortMoney(Math.max(0, budget.monthlyLimit - spent))}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'savings' && (
        <SavingsGoalsView />
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-600" />
              Chuyển tiền giữa các ví
            </h3>

            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Ví chuyển tiền (Từ ví)</label>
                <select
                  value={transferFrom}
                  onChange={e => setTransferFrom(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatMoney(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Ví nhận tiền (Đến ví)</label>
                <select
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatMoney(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Số tiền chuyển</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 500000"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Rút tiền ATM, Nạp ví MoMo..."
                  value={transferNote}
                  onChange={e => setTransferNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      {showAddWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-600" />
              Tạo Ví / Tài Khoản Mới
            </h3>

            <form onSubmit={handleAddWalletSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Loại ví</label>
                <select
                  value={newWalletType}
                  onChange={e => setNewWalletType(e.target.value as WalletType)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="bank">Tài khoản Ngân hàng</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="e_wallet">Ví điện tử (MoMo, ZaloPay...)</option>
                  <option value="credit_card">Thẻ tín dụng (Credit Card)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Tên ví / Tài khoản</label>
                <input
                  type="text"
                  required
                  placeholder="MB Bank, TPBank, Tiền tiết kiệm..."
                  value={newWalletName}
                  onChange={e => setNewWalletName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  {newWalletType === 'credit_card' ? 'Dư nợ ban đầu (nếu có)' : 'Số dư ban đầu'}
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={newWalletBalance}
                  onChange={e => setNewWalletBalance(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              {newWalletType === 'credit_card' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Hạn mức tín dụng</label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 30000000"
                      value={newWalletLimit}
                      onChange={e => setNewWalletLimit(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Ngày chốt sao kê (1 - 31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="20"
                      value={newWalletStatementDate}
                      onChange={e => setNewWalletStatementDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWalletModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Tạo ví
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-600" />
              Đặt hạn mức ngân sách ({selectedMonth})
            </h3>

            <form onSubmit={handleBudgetSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Áp dụng cho danh mục</label>
                <select
                  value={budgetCatId}
                  onChange={e => setBudgetCatId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="all">⭐ Tất cả chi tiêu trong tháng</option>
                  {categories
                    .filter(c => c.type === 'expense')
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Số tiền hạn mức tối đa</label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 5000000"
                  value={budgetLimitStr}
                  onChange={e => setBudgetLimitStr(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Lưu hạn mức
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} />

      {/* Recurring Manager Modal */}
      <RecurringManagerModal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} />

      {/* Wallet Edit / Balance Adjustment Modal */}
      <WalletEditModal
        isOpen={showEditWalletModal}
        onClose={() => {
          setShowEditWalletModal(false);
          setSelectedWalletToEdit(null);
        }}
        wallet={selectedWalletToEdit}
      />

      {/* Confirm Delete Wallet Modal */}
      <ConfirmModal
        isOpen={!!deletingWallet}
        title="Xóa ví tiền"
        message={deletingWallet ? `Bạn có chắc muốn xóa ví "${deletingWallet.name}"? Các giao dịch liên quan đến ví này vẫn sẽ được giữ lại trong lịch sử.` : ''}
        confirmText="Xóa ví"
        type="danger"
        onConfirm={() => {
          if (deletingWallet) {
            deleteWallet(deletingWallet.id);
            setDeletingWallet(null);
          }
        }}
        onCancel={() => setDeletingWallet(null)}
      />
    </div>
  );
};
