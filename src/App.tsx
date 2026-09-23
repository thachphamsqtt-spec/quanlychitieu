import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { HeaderBar } from './components/HeaderBar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { WalletsView } from './components/WalletsView';
import { DebtsView } from './components/DebtsView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { FinancialJarsView } from './components/FinancialJarsView';
import { SplitBillView } from './components/SplitBillView';
import { CreditCardManagerView } from './components/CreditCardManagerView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SettingsModal } from './components/SettingsModal';
import { AppLockScreen } from './components/AppLockScreen';
import { AuthScreen } from './components/AuthScreen';
import { motion, AnimatePresence } from 'motion/react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, isLocked, user } = useExpense();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!user) {
    return <AuthScreen />;
  }

  if (isLocked) {
    return <AppLockScreen />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Top Header */}
      <HeaderBar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <DashboardView />
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <TransactionsView />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <AnalyticsView />
            </motion.div>
          )}

          {activeTab === 'debts' && (
            <motion.div
              key="debts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <DebtsView />
            </motion.div>
          )}

          {activeTab === 'savings' && (
            <motion.div
              key="savings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <SavingsGoalsView />
            </motion.div>
          )}

          {(activeTab === 'wallets' || activeTab === 'budget') && (
            <motion.div
              key="wallets"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <WalletsView />
            </motion.div>
          )}

          {activeTab === 'split_bill' && (
            <motion.div
              key="split_bill"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full px-4 pt-3"
            >
              <SplitBillView />
            </motion.div>
          )}

          {activeTab === 'jars' && (
            <motion.div
              key="jars"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full px-4 pt-3"
            >
              <FinancialJarsView />
            </motion.div>
          )}

          {activeTab === 'credit_cards' && (
            <motion.div
              key="credit_cards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full px-4 pt-3"
            >
              <CreditCardManagerView onBack={() => setActiveTab('wallets')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Android Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <AddTransactionModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <ExpenseProvider>
      <div className="h-screen h-[100dvh] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-start overflow-hidden">
        <div className="w-full max-w-4xl h-full bg-slate-50 dark:bg-slate-900 flex flex-col shadow-xl relative sm:border-x border-slate-200 dark:border-slate-800 overflow-hidden">
          <MainContent />
        </div>
      </div>
    </ExpenseProvider>
  );
}

export default App;
