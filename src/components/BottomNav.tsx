import React from 'react';
import { LayoutDashboard, ReceiptText, HandCoins, PieChart, WalletCards, Plus } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';
import { ActiveTab } from '../types/expense';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsAddModalOpen, setEditingTransaction, debts, t } = useExpense();

  const handleTabChange = (tab: ActiveTab) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  const handleOpenAdd = () => {
    triggerHaptic('medium');
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const activeDebtsCount = debts.filter(d => d.status === 'active').length;

  return (
    <div className="shrink-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-1.5 py-1.5 flex items-center justify-between shadow-lg select-none relative pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      {/* Android Material 3 Floating Action Button (FAB) floating above bar */}
      <button
        onClick={handleOpenAdd}
        aria-label={t('addTransactionTitle')}
        className="absolute -top-14 right-4 w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-xl shadow-teal-900/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white dark:border-slate-800 ring-4 ring-teal-500/15 z-40"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Tab 1: Tổng quan */}
      <button
        onClick={() => handleTabChange('dashboard')}
        className={`flex-1 flex flex-col items-center py-1 rounded-2xl transition duration-150 ${
          activeTab === 'dashboard'
            ? 'text-teal-700 dark:text-teal-300 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div
          className={`px-2.5 py-1 rounded-full transition-all ${
            activeTab === 'dashboard'
              ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300'
              : 'bg-transparent'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">{t('dashboard')}</span>
      </button>

      {/* Tab 2: Sổ thu chi */}
      <button
        onClick={() => handleTabChange('transactions')}
        className={`flex-1 flex flex-col items-center py-1 rounded-2xl transition duration-150 ${
          activeTab === 'transactions'
            ? 'text-teal-700 dark:text-teal-300 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div
          className={`px-2.5 py-1 rounded-full transition-all ${
            activeTab === 'transactions'
              ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300'
              : 'bg-transparent'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">{t('transactions')}</span>
      </button>

      {/* Tab 3: Sổ nợ */}
      <button
        onClick={() => handleTabChange('debts')}
        className={`flex-1 flex flex-col items-center py-1 rounded-2xl transition duration-150 relative ${
          activeTab === 'debts'
            ? 'text-teal-700 dark:text-teal-300 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div
          className={`px-2.5 py-1 rounded-full transition-all relative ${
            activeTab === 'debts'
              ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300'
              : 'bg-transparent'
          }`}
        >
          <HandCoins className="w-5 h-5" />
          {activeDebtsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-800">
              {activeDebtsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">{t('debts')}</span>
      </button>

      {/* Tab 4: Báo cáo */}
      <button
        onClick={() => handleTabChange('analytics')}
        className={`flex-1 flex flex-col items-center py-1 rounded-2xl transition duration-150 ${
          activeTab === 'analytics'
            ? 'text-teal-700 dark:text-teal-300 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div
          className={`px-2.5 py-1 rounded-full transition-all ${
            activeTab === 'analytics'
              ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300'
              : 'bg-transparent'
          }`}
        >
          <PieChart className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">{t('analytics')}</span>
      </button>

      {/* Tab 5: Ví & Quỹ */}
      <button
        onClick={() => handleTabChange('wallets')}
        className={`flex-1 flex flex-col items-center py-1 rounded-2xl transition duration-150 ${
          activeTab === 'wallets' || activeTab === 'budget'
            ? 'text-teal-700 dark:text-teal-300 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div
          className={`px-2.5 py-1 rounded-full transition-all ${
            activeTab === 'wallets' || activeTab === 'budget'
              ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300'
              : 'bg-transparent'
          }`}
        >
          <WalletCards className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">{t('wallets')}</span>
      </button>
    </div>
  );
};
