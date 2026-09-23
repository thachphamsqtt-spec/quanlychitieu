import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Transaction,
  Category,
  Wallet,
  Budget,
  ActiveTab,
  RecurringTransaction,
  Debt,
  DebtRepayment,
  SavingsGoal,
  SavingsContribution,
  FinancialJar,
  SplitBill,
  AppSettings,
  CurrencyCode,
  AppLanguage,
  AppTheme,
} from '../types/expense';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_WALLETS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_BUDGETS,
  DEFAULT_RECURRING,
  DEFAULT_DEBTS,
  DEFAULT_SAVINGS_GOALS,
  DEFAULT_FINANCIAL_JARS,
  DEFAULT_SPLIT_BILLS,
  DEFAULT_SETTINGS,
  getFreshDefaultData,
} from '../data/defaultData';
import {
  formatCurrency,
  formatShortCurrency,
  calculateNextDueDate,
  triggerHaptic,
} from '../utils/formatters';
import { getTranslation, TranslationKey } from '../utils/i18n';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
} from '../lib/firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  pullUserDataFromCloud,
  pushUserDataToCloud,
  syncSingleDoc,
  deleteSingleDoc,
} from '../services/cloudSync';
import { AppUser, LoginDto, RegisterDto } from '../types/auth';
import { authService, simpleHash } from '../services/authService';

interface ExpenseContextType {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  debts: Debt[];
  totalLent: number;
  totalBorrowed: number;
  savingsGoals: SavingsGoal[];
  financialJars: FinancialJar[];
  totalSavingsTarget: number;
  totalSavingsCurrent: number;
  settings: AppSettings;
  isLocked: boolean;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (m: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  deviceMode: 'phone' | 'full';
  setDeviceMode: (mode: 'phone' | 'full') => void;

  // Multi-user Authentication
  user: AppUser | null;
  currentUser: AppUser | null; // Alias for compatibility
  savedUsers: AppUser[];
  login: (dto: LoginDto) => Promise<{ success: boolean; error?: string }>;
  register: (dto: RegisterDto) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  deleteAccount: (userId: string) => void;

  // Google Auth & Cloud Sync (Legacy / Optional)
  googleUser: FirebaseUser | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  syncNow: () => Promise<void>;
  pullFromCloud: () => Promise<void>;

  // Transaction Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Wallet Actions
  addWallet: (w: Omit<Wallet, 'id'>) => void;
  updateWallet: (id: string, w: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;

  // Category Actions
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Budget Actions
  setBudget: (categoryId: string, monthlyLimit: number, month?: string) => void;
  deleteBudget: (id: string) => void;

  // Recurring Actions
  addRecurringTransaction: (rec: Omit<RecurringTransaction, 'id' | 'createdAt'>) => void;
  updateRecurringTransaction: (id: string, rec: Partial<RecurringTransaction>) => void;
  deleteRecurringTransaction: (id: string) => void;
  executeRecurringNow: (id: string) => void;

  // Debt Actions
  addDebt: (
    debtData: Omit<Debt, 'id' | 'createdAt' | 'paidAmount' | 'status' | 'repayments'>,
    recordTransaction?: boolean
  ) => void;
  updateDebt: (id: string, debtData: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtRepayment: (
    debtId: string,
    repayment: { amount: number; date: string; walletId?: string; note?: string },
    recordTransaction?: boolean
  ) => void;

  // Savings Goals & Financial Jars Actions
  addSavingsGoal: (
    goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'status' | 'contributions' | 'createdAt'>,
    initialDeposit?: number,
    initialWalletId?: string
  ) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeToGoal: (
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdraw',
    walletId?: string,
    note?: string
  ) => void;
  updateFinancialJar: (id: string, percentage: number) => void;
  resetFinancialJars: () => void;

  // Split Bill (Chia tiền nhóm & VietQR) Actions
  splitBills: SplitBill[];
  addSplitBill: (billData: Omit<SplitBill, 'id' | 'createdAt'>) => string;
  updateSplitBill: (bill: SplitBill) => void;
  deleteSplitBill: (id: string) => void;
  toggleMemberPaidStatus: (billId: string, memberId: string) => void;
  convertMemberOwedToDebt: (billId: string, memberId: string) => void;
  convertBillToExpense: (billId: string, walletId?: string) => void;

  // Settings Actions
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  setPinCode: (pin: string | null) => void;
  verifyPin: (inputPin: string) => boolean;
  lockApp: () => void;
  unlockApp: () => void;

  // Import / Export
  resetToDefaultData: () => void;
  clearAllData: () => void;
  exportToCSV: () => void;
  exportToJSON: () => void;
  importFromJSON: (jsonStr: string) => boolean;

  // Computed & Formatters
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  getCategoryById: (id: string) => Category | undefined;
  getWalletById: (id: string) => Wallet | undefined;
  formatMoney: (amount: number, showSign?: boolean) => string;
  formatShortMoney: (amount: number) => string;
  t: (key: TranslationKey) => string;
  language: AppLanguage;
  theme: AppTheme;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const getUserStorageKeys = (userId: string) => ({
  TX: `expense_user_${userId}_tx_v2`,
  WALLETS: `expense_user_${userId}_wallets_v2`,
  CATEGORIES: `expense_user_${userId}_categories_v2`,
  BUDGETS: `expense_user_${userId}_budgets_v2`,
  RECURRING: `expense_user_${userId}_recurring_v2`,
  DEBTS: `expense_user_${userId}_debts_v2`,
  GOALS: `expense_user_${userId}_goals_v2`,
  JARS: `expense_user_${userId}_jars_v2`,
  SPLIT_BILLS: `expense_user_${userId}_split_bills_v2`,
  SETTINGS: `expense_user_${userId}_settings_v2`,
  LAST_SYNCED: `expense_user_${userId}_last_synced_v2`,
});

function initOrMigrateUsers(): { activeUser: AppUser | null; allUsers: AppUser[] } {
  let allUsers = authService.getAllUsers();
  if (allUsers.length === 0) {
    // Check if legacy single-user data exists in localStorage
    const legacyTx = localStorage.getItem('android_expense_transactions_v3');
    const legacyWallets = localStorage.getItem('android_expense_wallets_v3');

    // Create initial default user
    const defaultUser: AppUser = {
      id: 'usr_default_admin',
      username: 'admin',
      displayName: 'Tài khoản chính',
      passwordHash: simpleHash('123456'),
      avatar: '👤',
      color: '#0d9488',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
    allUsers = [defaultUser];
    authService.saveAllUsers(allUsers);
    authService.setActiveSession(defaultUser.id);

    // If legacy data exists, copy it into defaultUser keys
    const keys = getUserStorageKeys(defaultUser.id);
    if (legacyTx) localStorage.setItem(keys.TX, legacyTx);
    if (legacyWallets) localStorage.setItem(keys.WALLETS, legacyWallets);
    const legacyCats = localStorage.getItem('android_expense_categories_v3');
    if (legacyCats) localStorage.setItem(keys.CATEGORIES, legacyCats);
    const legacyBudgets = localStorage.getItem('android_expense_budgets_v3');
    if (legacyBudgets) localStorage.setItem(keys.BUDGETS, legacyBudgets);
    const legacyDebts = localStorage.getItem('android_expense_debts_v3');
    if (legacyDebts) localStorage.setItem(keys.DEBTS, legacyDebts);
    const legacyGoals = localStorage.getItem('android_expense_goals_v3');
    if (legacyGoals) localStorage.setItem(keys.GOALS, legacyGoals);
    const legacyJars = localStorage.getItem('android_expense_jars_v3');
    if (legacyJars) localStorage.setItem(keys.JARS, legacyJars);
    const legacyBills = localStorage.getItem('android_expense_split_bills_v4');
    if (legacyBills) localStorage.setItem(keys.SPLIT_BILLS, legacyBills);
    const legacySettings = localStorage.getItem('android_expense_settings_v3');
    if (legacySettings) localStorage.setItem(keys.SETTINGS, legacySettings);
  }

  const activeUser = authService.getActiveSession();
  return { activeUser, allUsers };
}

function loadUserDataForUser(userId: string) {
  const keys = getUserStorageKeys(userId);
  let tx: Transaction[] = [];
  let wallets: Wallet[] = DEFAULT_WALLETS;
  let categories: Category[] = DEFAULT_CATEGORIES;
  let budgets: Budget[] = [];
  let recurring: RecurringTransaction[] = [];
  let debts: Debt[] = [];
  let goals: SavingsGoal[] = [];
  let jars: FinancialJar[] = DEFAULT_FINANCIAL_JARS;
  let splitBills: SplitBill[] = [];
  let settings: AppSettings = DEFAULT_SETTINGS;

  try {
    const rawTx = localStorage.getItem(keys.TX);
    if (rawTx) tx = JSON.parse(rawTx);
    else if (userId === 'usr_default_admin') tx = DEFAULT_TRANSACTIONS;

    const rawWallets = localStorage.getItem(keys.WALLETS);
    if (rawWallets) wallets = JSON.parse(rawWallets);

    const rawCats = localStorage.getItem(keys.CATEGORIES);
    if (rawCats) categories = JSON.parse(rawCats);

    const rawBudgets = localStorage.getItem(keys.BUDGETS);
    if (rawBudgets) budgets = JSON.parse(rawBudgets);
    else if (userId === 'usr_default_admin') budgets = DEFAULT_BUDGETS;

    const rawRec = localStorage.getItem(keys.RECURRING);
    if (rawRec) recurring = JSON.parse(rawRec);
    else if (userId === 'usr_default_admin') recurring = DEFAULT_RECURRING;

    const rawDebts = localStorage.getItem(keys.DEBTS);
    if (rawDebts) debts = JSON.parse(rawDebts);
    else if (userId === 'usr_default_admin') debts = DEFAULT_DEBTS;

    const rawGoals = localStorage.getItem(keys.GOALS);
    if (rawGoals) goals = JSON.parse(rawGoals);
    else if (userId === 'usr_default_admin') goals = DEFAULT_SAVINGS_GOALS;

    const rawJars = localStorage.getItem(keys.JARS);
    if (rawJars) jars = JSON.parse(rawJars);

    const rawBills = localStorage.getItem(keys.SPLIT_BILLS);
    if (rawBills) splitBills = JSON.parse(rawBills);
    else if (userId === 'usr_default_admin') splitBills = DEFAULT_SPLIT_BILLS;

    const rawSettings = localStorage.getItem(keys.SETTINGS);
    if (rawSettings) settings = { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) };
  } catch (e) {
    console.error('Failed to load user data from localStorage', e);
  }

  return { tx, wallets, categories, budgets, recurring, debts, goals, jars, splitBills, settings };
}

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deviceMode, setDeviceMode] = useState<'phone' | 'full'>('phone');

  // User Authentication State
  const [{ activeUser: initialUser, allUsers: initialUsers }] = useState(() => initOrMigrateUsers());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initialUser);
  const [savedUsers, setSavedUsers] = useState<AppUser[]>(initialUsers);

  // Loaded user ID ref to strictly guard against cross-account persistence race conditions
  const loadedUserIdRef = useRef<string | null>(initialUser ? initialUser.id : null);

  // Initial user dataset
  const initialUserData = useMemo(() => {
    if (!initialUser) {
      return {
        tx: [] as Transaction[],
        wallets: DEFAULT_WALLETS,
        categories: DEFAULT_CATEGORIES,
        budgets: [] as Budget[],
        recurring: [] as RecurringTransaction[],
        debts: [] as Debt[],
        goals: [] as SavingsGoal[],
        jars: DEFAULT_FINANCIAL_JARS,
        splitBills: [] as SplitBill[],
        settings: DEFAULT_SETTINGS,
      };
    }
    return loadUserDataForUser(initialUser.id);
  }, []);

  // Google Auth & Cloud Sync state (Legacy)
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    if (!initialUser) return null;
    const keys = getUserStorageKeys(initialUser.id);
    return localStorage.getItem(keys.LAST_SYNCED) || null;
  });

  // State
  const [transactions, setTransactions] = useState<Transaction[]>(initialUserData.tx);
  const [wallets, setWallets] = useState<Wallet[]>(initialUserData.wallets);
  const [categories, setCategories] = useState<Category[]>(initialUserData.categories);
  const [budgets, setBudgets] = useState<Budget[]>(initialUserData.budgets);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(initialUserData.recurring);
  const [debts, setDebts] = useState<Debt[]>(initialUserData.debts);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(initialUserData.goals);
  const [financialJars, setFinancialJars] = useState<FinancialJar[]>(initialUserData.jars);
  const [splitBills, setSplitBills] = useState<SplitBill[]>(initialUserData.splitBills);
  const [settings, setSettings] = useState<AppSettings>(initialUserData.settings);

  // Refresh saved users list
  const refreshSavedUsers = useCallback(() => {
    setSavedUsers(authService.getAllUsers());
  }, []);

  // Function to load a user's data into current state safely
  const loadUserIntoState = useCallback((targetUser: AppUser) => {
    // 1. Temporarily pause localStorage writes while swapping in-memory data
    loadedUserIdRef.current = null;

    // 2. Read user data
    const data = loadUserDataForUser(targetUser.id);

    // 3. Set all in-memory data
    setTransactions(data.tx);
    setWallets(data.wallets);
    setCategories(data.categories);
    setBudgets(data.budgets);
    setRecurringTransactions(data.recurring);
    setDebts(data.debts);
    setSavingsGoals(data.goals);
    setFinancialJars(data.jars);
    setSplitBills(data.splitBills);
    setSettings(data.settings);
    const keys = getUserStorageKeys(targetUser.id);
    setLastSyncedAt(localStorage.getItem(keys.LAST_SYNCED) || null);

    // 4. Set current user & active session
    setCurrentUser(targetUser);
    authService.setActiveSession(targetUser.id);

    // 5. Re-enable persistence specifically for this user
    loadedUserIdRef.current = targetUser.id;
  }, []);

  // User Login
  const login = useCallback(async (dto: LoginDto) => {
    const res = authService.login(dto);
    if (res.success && res.user) {
      loadUserIntoState(res.user);
      refreshSavedUsers();
      triggerHaptic('success');
      return { success: true };
    }
    triggerHaptic('warning');
    return { success: false, error: res.error };
  }, [loadUserIntoState, refreshSavedUsers]);

  // User Register
  const register = useCallback(async (dto: RegisterDto) => {
    const res = authService.register(dto);
    if (res.success && res.user) {
      // Initialize new user storage with fresh starting defaults
      const keys = getUserStorageKeys(res.user.id);
      localStorage.setItem(keys.WALLETS, JSON.stringify(DEFAULT_WALLETS));
      localStorage.setItem(keys.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem(keys.JARS, JSON.stringify(DEFAULT_FINANCIAL_JARS));
      localStorage.setItem(keys.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem(keys.TX, JSON.stringify([]));
      localStorage.setItem(keys.BUDGETS, JSON.stringify([]));
      localStorage.setItem(keys.DEBTS, JSON.stringify([]));
      localStorage.setItem(keys.GOALS, JSON.stringify([]));
      localStorage.setItem(keys.RECURRING, JSON.stringify([]));
      localStorage.setItem(keys.SPLIT_BILLS, JSON.stringify([]));

      loadUserIntoState(res.user);
      refreshSavedUsers();
      triggerHaptic('success');
      return { success: true };
    }
    triggerHaptic('warning');
    return { success: false, error: res.error };
  }, [loadUserIntoState, refreshSavedUsers]);

  // User Logout
  const logout = useCallback(() => {
    // 1. Immediately block any further persistence
    loadedUserIdRef.current = null;

    // 2. Clear storage session
    authService.clearActiveSession();

    // 3. Clear current user state
    setCurrentUser(null);

    // 4. Reset in-memory state so no data from the logged-out user remains
    setTransactions([]);
    setWallets(DEFAULT_WALLETS);
    setCategories(DEFAULT_CATEGORIES);
    setBudgets([]);
    setRecurringTransactions([]);
    setDebts([]);
    setSavingsGoals([]);
    setFinancialJars(DEFAULT_FINANCIAL_JARS);
    setSplitBills([]);
    setSettings(DEFAULT_SETTINGS);
    setLastSyncedAt(null);
    setEditingTransaction(null);
    setIsAddModalOpen(false);

    refreshSavedUsers();
    triggerHaptic('light');
  }, [refreshSavedUsers]);

  // Switch User
  const switchUser = useCallback((userId: string) => {
    const targetUser = authService.getUserById(userId);
    if (targetUser) {
      loadUserIntoState(targetUser);
      refreshSavedUsers();
      triggerHaptic('success');
    }
  }, [loadUserIntoState, refreshSavedUsers]);

  // Delete User Account
  const deleteAccount = useCallback((userId: string) => {
    authService.deleteUser(userId);
    // Remove local storage keys for this user
    const keys = getUserStorageKeys(userId);
    Object.values(keys).forEach(k => localStorage.removeItem(k));
    refreshSavedUsers();
    if (currentUser?.id === userId) {
      const remaining = authService.getAllUsers();
      if (remaining.length > 0) {
        switchUser(remaining[0].id);
      } else {
        logout();
      }
    }
    triggerHaptic('medium');
  }, [currentUser, logout, refreshSavedUsers, switchUser]);

  // Persist to user-scoped LocalStorage (Guarded by loadedUserIdRef)
  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.TX, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.WALLETS, JSON.stringify(wallets));
    } catch (e) {
      console.error('Failed to save wallets to localStorage', e);
    }
  }, [wallets, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Failed to save budgets to localStorage', e);
    }
  }, [budgets, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.RECURRING, JSON.stringify(recurringTransactions));
    } catch (e) {
      console.error('Failed to save recurring to localStorage', e);
    }
  }, [recurringTransactions, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.DEBTS, JSON.stringify(debts));
    } catch (e) {
      console.error('Failed to save debts to localStorage', e);
    }
  }, [debts, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.GOALS, JSON.stringify(savingsGoals));
    } catch (e) {
      console.error('Failed to save savingsGoals to localStorage', e);
    }
  }, [savingsGoals, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.JARS, JSON.stringify(financialJars));
    } catch (e) {
      console.error('Failed to save financialJars to localStorage', e);
    }
  }, [financialJars, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.SPLIT_BILLS, JSON.stringify(splitBills));
    } catch (e) {
      console.error('Failed to save splitBills to localStorage', e);
    }
  }, [splitBills, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id) return;
    const keys = getUserStorageKeys(currentUser.id);
    try {
      localStorage.setItem(keys.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings, currentUser]);

  useEffect(() => {
    if (!currentUser || loadedUserIdRef.current !== currentUser.id || !lastSyncedAt) return;
    const keys = getUserStorageKeys(currentUser.id);
    localStorage.setItem(keys.LAST_SYNCED, lastSyncedAt);
  }, [lastSyncedAt, currentUser]);

  // Apply dark mode theme if configured
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  // Translation helper
  const t = useCallback(
    (key: TranslationKey): string => {
      return getTranslation(settings.language || 'vi', key);
    },
    [settings.language]
  );

  // Subscribe to Firebase Auth state for automatic Google Cloud sync
  useEffect(() => {
    // Handle redirect result if returning from Google Sign-In redirect
    getRedirectResult(auth).catch(e => {
      console.warn('Redirect sign-in check:', e);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setGoogleUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          const googleUserId = `usr_google_${user.uid}`;
          const existingUser = authService.getUserById(googleUserId);
          const googleAppUser: AppUser = existingUser || {
            id: googleUserId,
            username: user.email ? user.email.toLowerCase() : `google_${user.uid.slice(0, 8)}`,
            displayName: user.displayName || user.email || 'Tài khoản Google',
            passwordHash: 'oauth_google_cloud',
            avatar: user.photoURL ? '🌐' : '👤',
            color: '#4285F4',
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
          };

          // Register in saved accounts if not present
          const allUsers = authService.getAllUsers();
          if (!allUsers.some(u => u.id === googleUserId)) {
            allUsers.push(googleAppUser);
            authService.saveAllUsers(allUsers);
          }
          authService.setActiveSession(googleUserId);
          setCurrentUser(googleAppUser);
          loadedUserIdRef.current = googleUserId;
          refreshSavedUsers();

          const cloudData = await pullUserDataFromCloud(user.uid);
          if (
            cloudData.transactions.length > 0 ||
            cloudData.wallets.length > 0 ||
            cloudData.categories.length > 0
          ) {
            // Cloud has existing data! Sync into local state
            if (cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
            if (cloudData.wallets.length > 0) setWallets(cloudData.wallets);
            if (cloudData.categories.length > 0) setCategories(cloudData.categories);
            if (cloudData.budgets.length > 0) setBudgets(cloudData.budgets);
            if (cloudData.recurring.length > 0) setRecurringTransactions(cloudData.recurring);
            if (cloudData.debts && cloudData.debts.length > 0) setDebts(cloudData.debts);
            if (cloudData.savingsGoals && cloudData.savingsGoals.length > 0) setSavingsGoals(cloudData.savingsGoals);
            if (cloudData.financialJars && cloudData.financialJars.length > 0) setFinancialJars(cloudData.financialJars);
            if (cloudData.splitBills && cloudData.splitBills.length > 0) setSplitBills(cloudData.splitBills);
            if (cloudData.settings) {
              setSettings(prev => ({ ...prev, ...cloudData.settings, isLocked: prev.isLocked }));
            }
            const syncTime = cloudData.lastSyncedAt || new Date().toISOString();
            setLastSyncedAt(syncTime);
          } else {
            // New cloud account: initialize cloud with current local data
            const syncTime = await pushUserDataToCloud(user.uid, {
              transactions,
              wallets,
              categories,
              budgets,
              recurring: recurringTransactions,
              debts,
              savingsGoals,
              financialJars,
              splitBills,
              settings,
              userProfile: {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              },
            });
            setLastSyncedAt(syncTime);
          }
        } catch (e) {
          console.error('Failed to pull from cloud on auth change', e);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, [refreshSavedUsers]);

  // Google Login
  const loginWithGoogle = async () => {
    setIsSyncing(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        } else {
          throw new Error('No credential returned from Google Sign-In');
        }
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupErr: any) {
          if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/cancelled-popup-request') {
            console.log('Popup blocked, falling back to redirect...');
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw popupErr;
        }
      }
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      triggerHaptic('warning');
      if (err?.code === 'auth/operation-not-allowed') {
        alert(
          '⚠️ Tính năng đăng nhập Google chưa được kích hoạt trong Firebase Console!\n\n' +
          '👉 Cách sửa:\n' +
          '1. Vào Firebase Console > Security > Authentication\n' +
          '2. Chọn tab "Sign-in method" > Bấm vào dòng "Google"\n' +
          '3. Gạt sang "Enable", chọn Support Email và bấm "Save"!'
        );
      } else if (err?.code === 'auth/unauthorized-domain') {
        alert(
          '⚠️ Tên miền chưa được cấp quyền (Authorized Domain):\n' +
          'Tên miền hiện tại: ' + window.location.hostname + '\n\n' +
          '👉 Cách sửa:\n' +
          '1. Vào Firebase Console > Security > Authentication > Tab Settings\n' +
          '2. Tại mục "Authorized domains", bấm "Add domain"\n' +
          '3. Nhập chính xác: ' + window.location.hostname + ' và bấm Add!\n' +
          '(Nếu vừa thêm, vui lòng chờ 1 phút rồi F5 tải lại trang)'
        );
      } else if (err?.code === 'auth/popup-blocked') {
        // Fallback to redirect
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          alert('Trình duyệt đang chặn cửa sổ đăng nhập Google. Vui lòng tắt chặn pop-up.');
        }
      } else if (err?.code !== 'auth/popup-closed-by-user') {
        alert(`Đăng nhập Google thất bại [${err?.code || 'Error'}]: ${err?.message || 'Vui lòng thử lại'}`);
      }
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Logout
  const logoutGoogle = async () => {
    setIsSyncing(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      await signOut(auth);
      setGoogleUser(null);
      setLastSyncedAt(null);
      logout();
      triggerHaptic('light');
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Push to Cloud (Sync Now)
  const syncNow = async () => {
    if (!googleUser) {
      alert('Vui lòng đăng nhập Google để đồng bộ dữ liệu.');
      return;
    }
    setIsSyncing(true);
    try {
      const syncTime = await pushUserDataToCloud(googleUser.uid, {
        transactions,
        wallets,
        categories,
        budgets,
        recurring: recurringTransactions,
        debts,
        savingsGoals,
        financialJars,
        splitBills,
        settings,
        userProfile: {
          email: googleUser.email,
          displayName: googleUser.displayName,
          photoURL: googleUser.photoURL,
        },
      });
      setLastSyncedAt(syncTime);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      triggerHaptic('warning');
      alert('Đồng bộ thất bại: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual Pull from Cloud
  const pullFromCloud = async () => {
    if (!googleUser) {
      alert('Vui lòng đăng nhập Google để tải dữ liệu từ đám mây.');
      return;
    }
    setIsSyncing(true);
    try {
      const cloudData = await pullUserDataFromCloud(googleUser.uid);
      if (cloudData.transactions.length > 0) setTransactions(cloudData.transactions);
      if (cloudData.wallets.length > 0) setWallets(cloudData.wallets);
      if (cloudData.categories.length > 0) setCategories(cloudData.categories);
      if (cloudData.budgets.length > 0) setBudgets(cloudData.budgets);
      if (cloudData.recurring.length > 0) setRecurringTransactions(cloudData.recurring);
      if (cloudData.debts && cloudData.debts.length > 0) setDebts(cloudData.debts);
      if (cloudData.savingsGoals && cloudData.savingsGoals.length > 0) setSavingsGoals(cloudData.savingsGoals);
      if (cloudData.financialJars && cloudData.financialJars.length > 0) setFinancialJars(cloudData.financialJars);
      if (cloudData.splitBills && cloudData.splitBills.length > 0) setSplitBills(cloudData.splitBills);
      if (cloudData.settings) {
        setSettings(prev => ({ ...prev, ...cloudData.settings, isLocked: prev.isLocked }));
      }
      const syncTime = cloudData.lastSyncedAt || new Date().toISOString();
      setLastSyncedAt(syncTime);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Pull from cloud failed:', err);
      triggerHaptic('warning');
      alert('Tải dữ liệu từ đám mây thất bại: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper getters
  const getCategoryById = useCallback((id: string) => categories.find(c => c.id === id), [categories]);
  const getWalletById = useCallback((id: string) => wallets.find(w => w.id === id), [wallets]);

  // Money Formatters using active currency in settings
  const formatMoney = useCallback(
    (amount: number, showSign: boolean = false) => {
      return formatCurrency(amount, settings.currency, showSign);
    },
    [settings.currency]
  );

  const formatShortMoney = useCallback(
    (amount: number) => {
      return formatShortCurrency(amount, settings.currency);
    },
    [settings.currency]
  );

  // Add Transaction & adjust wallet
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };

    let updatedWallets = wallets;
    setWallets(prevWallets => {
      const next = prevWallets.map(wallet => {
        if (data.type === 'expense' && wallet.id === data.walletId) {
          return { ...wallet, balance: wallet.balance - data.amount };
        }
        if (data.type === 'income' && wallet.id === data.walletId) {
          return { ...wallet, balance: wallet.balance + data.amount };
        }
        if (data.type === 'transfer') {
          if (wallet.id === data.walletId) {
            return { ...wallet, balance: wallet.balance - data.amount };
          }
          if (wallet.id === data.toWalletId) {
            return { ...wallet, balance: wallet.balance + data.amount };
          }
        }
        return wallet;
      });
      updatedWallets = next;
      return next;
    });

    setTransactions(prev => [newTx, ...prev]);
    triggerHaptic('success');

    // Cloud auto-sync
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'transactions', newTx.id, newTx);
      updatedWallets.forEach(w => syncSingleDoc(googleUser.uid, 'wallets', w.id, w));
    }
  };

  // Delete Transaction & reverse wallet changes
  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    let updatedWallets = wallets;
    setWallets(prevWallets => {
      const next = prevWallets.map(wallet => {
        if (tx.type === 'expense' && wallet.id === tx.walletId) {
          return { ...wallet, balance: wallet.balance + tx.amount };
        }
        if (tx.type === 'income' && wallet.id === tx.walletId) {
          return { ...wallet, balance: wallet.balance - tx.amount };
        }
        if (tx.type === 'transfer') {
          if (wallet.id === tx.walletId) {
            return { ...wallet, balance: wallet.balance + tx.amount };
          }
          if (wallet.id === tx.toWalletId) {
            return { ...wallet, balance: wallet.balance - tx.amount };
          }
        }
        return wallet;
      });
      updatedWallets = next;
      return next;
    });

    setTransactions(prev => prev.filter(t => t.id !== id));
    triggerHaptic('medium');

    // Cloud auto-sync
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'transactions', id);
      updatedWallets.forEach(w => syncSingleDoc(googleUser.uid, 'wallets', w.id, w));
    }
  };

  // Update Transaction
  const updateTransaction = (id: string, updatedData: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    let updatedWallets = wallets;
    setWallets(prevWallets => {
      let tempWallets = prevWallets.map(w => {
        if (oldTx.type === 'expense' && w.id === oldTx.walletId) {
          return { ...w, balance: w.balance + oldTx.amount };
        }
        if (oldTx.type === 'income' && w.id === oldTx.walletId) {
          return { ...w, balance: w.balance - oldTx.amount };
        }
        if (oldTx.type === 'transfer') {
          if (w.id === oldTx.walletId) return { ...w, balance: w.balance + oldTx.amount };
          if (w.id === oldTx.toWalletId) return { ...w, balance: w.balance - oldTx.amount };
        }
        return w;
      });

      const nextTx: Transaction = { ...oldTx, ...updatedData };
      const nextWallets = tempWallets.map(w => {
        if (nextTx.type === 'expense' && w.id === nextTx.walletId) {
          return { ...w, balance: w.balance - nextTx.amount };
        }
        if (nextTx.type === 'income' && w.id === nextTx.walletId) {
          return { ...w, balance: w.balance + nextTx.amount };
        }
        if (nextTx.type === 'transfer') {
          if (w.id === nextTx.walletId) return { ...w, balance: w.balance - nextTx.amount };
          if (w.id === nextTx.toWalletId) return { ...w, balance: w.balance + nextTx.amount };
        }
        return w;
      });
      updatedWallets = nextWallets;
      return nextWallets;
    });

    let mergedTx: Transaction | undefined;
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === id) {
          mergedTx = { ...t, ...updatedData };
          return mergedTx;
        }
        return t;
      })
    );
    triggerHaptic('success');

    if (googleUser && mergedTx) {
      syncSingleDoc(googleUser.uid, 'transactions', id, mergedTx);
      updatedWallets.forEach(w => syncSingleDoc(googleUser.uid, 'wallets', w.id, w));
    }
  };

  // Wallet actions
  const addWallet = (w: Omit<Wallet, 'id'>) => {
    const newWallet: Wallet = {
      ...w,
      id: `w_${Date.now()}`,
    };
    setWallets(prev => [...prev, newWallet]);
    triggerHaptic('success');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'wallets', newWallet.id, newWallet);
    }
  };

  const updateWallet = (id: string, w: Partial<Wallet>) => {
    let updated: Wallet | undefined;
    setWallets(prev =>
      prev.map(item => {
        if (item.id === id) {
          updated = { ...item, ...w };
          return updated;
        }
        return item;
      })
    );
    triggerHaptic('success');
    if (googleUser && updated) {
      syncSingleDoc(googleUser.uid, 'wallets', id, updated);
    }
  };

  const deleteWallet = (id: string) => {
    if (wallets.length <= 1) {
      alert('Bạn phải giữ ít nhất 1 ví tiền!');
      return;
    }
    setWallets(prev => prev.filter(w => w.id !== id));
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'wallets', id);
    }
  };

  // Category actions
  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...c,
      id: `cat_${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
    triggerHaptic('success');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'categories', newCat.id, newCat);
    }
  };

  const updateCategory = (id: string, c: Partial<Category>) => {
    let updated: Category | undefined;
    setCategories(prev =>
      prev.map(item => {
        if (item.id === id) {
          updated = { ...item, ...c };
          return updated;
        }
        return item;
      })
    );
    triggerHaptic('success');
    if (googleUser && updated) {
      syncSingleDoc(googleUser.uid, 'categories', id, updated);
    }
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(item => item.id !== id));
    triggerHaptic('medium');
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'categories', id);
    }
  };

  // Budgets actions
  const setBudget = (categoryId: string, monthlyLimit: number, month = selectedMonth) => {
    let savedBudget: Budget | undefined;
    setBudgets(prev => {
      const existing = prev.find(b => b.categoryId === categoryId && b.month === month);
      if (existing) {
        savedBudget = { ...existing, monthlyLimit };
        return prev.map(b => (b.id === existing.id ? savedBudget! : b));
      }
      savedBudget = {
        id: `b_${Date.now()}`,
        categoryId,
        monthlyLimit,
        month,
      };
      return [...prev, savedBudget];
    });
    triggerHaptic('success');
    if (googleUser && savedBudget) {
      syncSingleDoc(googleUser.uid, 'budgets', savedBudget.id, savedBudget);
    }
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'budgets', id);
    }
  };

  // Recurring Actions
  const addRecurringTransaction = (rec: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
    const newRec: RecurringTransaction = {
      ...rec,
      id: `rec_${Date.now()}`,
      createdAt: Date.now(),
    };
    setRecurringTransactions(prev => [...prev, newRec]);
    triggerHaptic('success');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'recurring', newRec.id, newRec);
    }
  };

  const updateRecurringTransaction = (id: string, rec: Partial<RecurringTransaction>) => {
    let updated: RecurringTransaction | undefined;
    setRecurringTransactions(prev =>
      prev.map(item => {
        if (item.id === id) {
          updated = { ...item, ...rec };
          return updated;
        }
        return item;
      })
    );
    triggerHaptic('success');
    if (googleUser && updated) {
      syncSingleDoc(googleUser.uid, 'recurring', id, updated);
    }
  };

  const deleteRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.filter(item => item.id !== id));
    triggerHaptic('medium');
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'recurring', id);
    }
  };

  const executeRecurringNow = (id: string) => {
    const rec = recurringTransactions.find(r => r.id === id);
    if (!rec) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    addTransaction({
      type: rec.type,
      amount: rec.amount,
      categoryId: rec.categoryId,
      walletId: rec.walletId,
      date: todayStr,
      time: nowTime,
      note: `${rec.note} [Định kỳ]`,
      recurringId: rec.id,
    });

    const nextDue = calculateNextDueDate(todayStr, rec.frequency);
    updateRecurringTransaction(id, {
      lastExecutedDate: todayStr,
      nextDueDate: nextDue,
    });
    triggerHaptic('success');
  };

  // Debt Actions (Sổ nợ & Cho vay)
  const addDebt = (
    debtData: Omit<Debt, 'id' | 'createdAt' | 'paidAmount' | 'status' | 'repayments'>,
    recordTransaction: boolean = true
  ) => {
    const newDebt: Debt = {
      ...debtData,
      id: `debt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      paidAmount: 0,
      status: 'active',
      repayments: [],
      createdAt: Date.now(),
    };

    setDebts(prev => [newDebt, ...prev]);
    triggerHaptic('success');

    // Optionally record transaction into cash flow
    if (recordTransaction && debtData.walletId) {
      if (debtData.type === 'lend') {
        // Cho vay = tiền xuất khỏi ví (Chi tiêu)
        addTransaction({
          type: 'expense',
          amount: debtData.amount,
          categoryId: 'cat_other_expense',
          walletId: debtData.walletId,
          date: debtData.startDate,
          time: '10:00',
          note: `Cho ${debtData.personName} vay / mượn${debtData.note ? `: ${debtData.note}` : ''}`,
        });
      } else {
        // Đi vay = tiền vào ví (Thu nhập)
        addTransaction({
          type: 'income',
          amount: debtData.amount,
          categoryId: 'cat_other_income',
          walletId: debtData.walletId,
          date: debtData.startDate,
          time: '10:00',
          note: `Vay tiền từ ${debtData.personName}${debtData.note ? `: ${debtData.note}` : ''}`,
        });
      }
    }

    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'debts', newDebt.id, newDebt);
    }
  };

  const updateDebt = (id: string, debtData: Partial<Debt>) => {
    let updated: Debt | undefined;
    setDebts(prev =>
      prev.map(d => {
        if (d.id === id) {
          updated = { ...d, ...debtData };
          return updated;
        }
        return d;
      })
    );
    triggerHaptic('light');
    if (googleUser && updated) {
      syncSingleDoc(googleUser.uid, 'debts', id, updated);
    }
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    triggerHaptic('medium');
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'debts', id);
    }
  };

  const addDebtRepayment = (
    debtId: string,
    repayment: { amount: number; date: string; walletId?: string; note?: string },
    recordTransaction: boolean = true
  ) => {
    const targetDebt = debts.find(d => d.id === debtId);
    if (!targetDebt) return;

    const newRepayment: DebtRepayment = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      amount: repayment.amount,
      date: repayment.date,
      walletId: repayment.walletId,
      note: repayment.note,
      createdAt: Date.now(),
    };

    const nextRepayments = [newRepayment, ...(targetDebt.repayments || [])];
    const nextPaid = (targetDebt.paidAmount || 0) + repayment.amount;
    const isDone = nextPaid >= targetDebt.amount;

    const updatedDebt: Debt = {
      ...targetDebt,
      paidAmount: nextPaid,
      status: isDone ? 'completed' : 'active',
      repayments: nextRepayments,
    };

    setDebts(prev => prev.map(d => (d.id === debtId ? updatedDebt : d)));
    triggerHaptic('success');

    // Optionally record repayment into cash flow
    if (recordTransaction && repayment.walletId) {
      if (targetDebt.type === 'lend') {
        // Thu nợ (người ta trả mình) = Thu nhập vào ví
        addTransaction({
          type: 'income',
          amount: repayment.amount,
          categoryId: 'cat_other_income',
          walletId: repayment.walletId,
          date: repayment.date,
          time: '10:00',
          note: `${targetDebt.personName} trả nợ${repayment.note ? `: ${repayment.note}` : ''}`,
        });
      } else {
        // Trả nợ (mình trả người ta) = Chi tiêu khỏi ví
        addTransaction({
          type: 'expense',
          amount: repayment.amount,
          categoryId: 'cat_other_expense',
          walletId: repayment.walletId,
          date: repayment.date,
          time: '10:00',
          note: `Trả nợ cho ${targetDebt.personName}${repayment.note ? `: ${repayment.note}` : ''}`,
        });
      }
    }

    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'debts', debtId, updatedDebt);
    }
  };

  // Savings Goal Actions
  const addSavingsGoal = (
    goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'status' | 'contributions' | 'createdAt'>,
    initialDeposit?: number,
    initialWalletId?: string
  ) => {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const contributions: SavingsContribution[] = [];
    const deposit = initialDeposit && initialDeposit > 0 ? initialDeposit : 0;

    if (deposit > 0) {
      contributions.push({
        id: `contrib_${Date.now()}`,
        amount: deposit,
        date: new Date().toISOString().split('T')[0],
        walletId: initialWalletId,
        note: 'Khoản tích lũy khởi đầu',
        type: 'deposit',
        createdAt: Date.now(),
      });

      if (initialWalletId) {
        addTransaction({
          type: 'expense',
          amount: deposit,
          categoryId: 'cat_investment',
          walletId: initialWalletId,
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          note: `Nạp vào mục tiêu tiết kiệm: ${goal.name}`,
        });
      }
    }

    const newGoal: SavingsGoal = {
      ...goal,
      id,
      currentAmount: deposit,
      status: deposit >= goal.targetAmount ? 'achieved' : 'in_progress',
      contributions,
      createdAt: Date.now(),
    };

    setSavingsGoals(prev => [newGoal, ...prev]);
    triggerHaptic('success');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'savingsGoals', id, newGoal);
    }
  };

  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    let updated: SavingsGoal | undefined;
    setSavingsGoals(prev =>
      prev.map(g => {
        if (g.id === id) {
          const next = { ...g, ...updates };
          next.status = next.currentAmount >= next.targetAmount ? 'achieved' : 'in_progress';
          updated = next;
          return next;
        }
        return g;
      })
    );
    triggerHaptic('light');
    if (googleUser && updated) {
      syncSingleDoc(googleUser.uid, 'savingsGoals', id, updated);
    }
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    triggerHaptic('medium');
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'savingsGoals', id);
    }
  };

  const contributeToGoal = (
    goalId: string,
    amount: number,
    type: 'deposit' | 'withdraw',
    walletId?: string,
    note?: string
  ) => {
    const target = savingsGoals.find(g => g.id === goalId);
    if (!target || amount <= 0) return;

    const newContribution: SavingsContribution = {
      id: `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      walletId,
      note,
      type,
      createdAt: Date.now(),
    };

    let nextCurrent = target.currentAmount;
    if (type === 'deposit') {
      nextCurrent += amount;
      if (walletId) {
        addTransaction({
          type: 'expense',
          amount,
          categoryId: 'cat_investment',
          walletId,
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          note: `Nạp heo đất: ${target.name}${note ? ` (${note})` : ''}`,
        });
      }
    } else {
      nextCurrent = Math.max(0, nextCurrent - amount);
      if (walletId) {
        addTransaction({
          type: 'income',
          amount,
          categoryId: 'cat_investment',
          walletId,
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          note: `Rút tiền từ heo đất: ${target.name}${note ? ` (${note})` : ''}`,
        });
      }
    }

    const updatedGoal: SavingsGoal = {
      ...target,
      currentAmount: nextCurrent,
      status: nextCurrent >= target.targetAmount ? 'achieved' : 'in_progress',
      contributions: [newContribution, ...(target.contributions || [])],
    };

    setSavingsGoals(prev => prev.map(g => (g.id === goalId ? updatedGoal : g)));
    triggerHaptic('success');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'savingsGoals', goalId, updatedGoal);
    }
  };

  // Financial Jars Actions
  const updateFinancialJar = (id: string, percentage: number) => {
    let updated: FinancialJar | undefined;
    setFinancialJars(prev =>
      prev.map(j => {
        if (j.id === id) {
          updated = { ...j, percentage };
          return updated;
        }
        return j;
      })
    );
    triggerHaptic('light');
    if (googleUser && updated) {
      syncSingleDoc(googleUser.uid, 'financialJars', id, updated);
    }
  };

  const resetFinancialJars = () => {
    setFinancialJars(DEFAULT_FINANCIAL_JARS);
    triggerHaptic('light');
    if (googleUser) {
      DEFAULT_FINANCIAL_JARS.forEach(j => {
        syncSingleDoc(googleUser.uid, 'financialJars', j.id, j);
      });
    }
  };

  // Split Bill (Chia tiền nhóm & VietQR) Actions
  const addSplitBill = (billData: Omit<SplitBill, 'id' | 'createdAt'>): string => {
    const newId = `bill_${Date.now()}`;
    const newBill: SplitBill = {
      ...billData,
      id: newId,
      createdAt: Date.now(),
    };
    setSplitBills(prev => [newBill, ...prev]);
    triggerHaptic('success');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'splitBills', newId, newBill);
    }
    return newId;
  };

  const updateSplitBill = (bill: SplitBill) => {
    setSplitBills(prev => prev.map(b => (b.id === bill.id ? bill : b)));
    triggerHaptic('light');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'splitBills', bill.id, bill);
    }
  };

  const deleteSplitBill = (id: string) => {
    setSplitBills(prev => prev.filter(b => b.id !== id));
    triggerHaptic('warning');
    if (googleUser) {
      deleteSingleDoc(googleUser.uid, 'splitBills', id);
    }
  };

  const toggleMemberPaidStatus = (billId: string, memberId: string) => {
    let updatedBill: SplitBill | undefined;
    setSplitBills(prev =>
      prev.map(b => {
        if (b.id !== billId) return b;
        const updatedMembers = b.members.map(m => {
          if (m.id !== memberId) return m;
          const nextPaid = !m.isPaid;
          return {
            ...m,
            isPaid: nextPaid,
            paidAt: nextPaid ? Date.now() : undefined,
          };
        });
        const allSettled = updatedMembers.every(m => m.isPaid || m.isPayer);
        updatedBill = {
          ...b,
          members: updatedMembers,
          status: allSettled ? 'settled' : 'pending',
        };
        return updatedBill;
      })
    );
    triggerHaptic('light');
    if (googleUser && updatedBill) {
      syncSingleDoc(googleUser.uid, 'splitBills', billId, updatedBill);
    }
  };

  const convertMemberOwedToDebt = (billId: string, memberId: string) => {
    const bill = splitBills.find(b => b.id === billId);
    if (!bill) return;
    const member = bill.members.find(m => m.id === memberId);
    if (!member || member.isPaid || member.isPayer) return;

    addDebt(
      {
        type: 'lend',
        personName: member.name,
        phoneNumber: member.phoneNumber,
        amount: member.amount,
        walletId: bill.payerWalletId || wallets[0]?.id || '',
        startDate: bill.date,
        note: `Chia tiền: ${bill.title}`,
      },
      false
    );
    triggerHaptic('success');
  };

  const convertBillToExpense = (billId: string, walletId?: string) => {
    const bill = splitBills.find(b => b.id === billId);
    if (!bill) return;
    const myMember = bill.members.find(m => m.isPayer) || bill.members[0];
    const myShare = myMember ? myMember.amount : Math.round(bill.totalAmount / (bill.members.length || 1));
    const targetWallet = walletId || bill.payerWalletId || wallets[0]?.id || '';

    addTransaction({
      type: 'expense',
      amount: myShare,
      categoryId: 'cat_food',
      walletId: targetWallet,
      date: bill.date,
      time: '12:00',
      note: `Phần tiền của tôi: ${bill.title}`,
    });
    triggerHaptic('success');
  };

  // Settings Actions
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    triggerHaptic('light');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'settings', 'config', { ...merged, isLocked: false });
    }
  };

  const setPinCode = (pin: string | null) => {
    const merged = { ...settings, pinCode: pin, isLocked: false };
    setSettings(merged);
    triggerHaptic('success');
    if (googleUser) {
      syncSingleDoc(googleUser.uid, 'settings', 'config', merged);
    }
  };

  const verifyPin = (inputPin: string): boolean => {
    if (!settings.pinCode) return true;
    if (settings.pinCode === inputPin) {
      setSettings(prev => ({ ...prev, isLocked: false }));
      triggerHaptic('success');
      return true;
    }
    triggerHaptic('warning');
    return false;
  };

  const lockApp = () => {
    if (settings.pinCode) {
      setSettings(prev => ({ ...prev, isLocked: true }));
      triggerHaptic('light');
    }
  };

  const unlockApp = () => {
    setSettings(prev => ({ ...prev, isLocked: false }));
  };

  // Reset & Clear
  const resetToDefaultData = () => {
    const fresh = getFreshDefaultData();
    setTransactions(fresh.transactions);
    setWallets(fresh.wallets);
    setCategories(fresh.categories);
    setBudgets(fresh.budgets);
    setRecurringTransactions(fresh.recurring);
    setDebts(fresh.debts);
    setSavingsGoals(fresh.savingsGoals);
    setFinancialJars(fresh.financialJars);
    setSplitBills(fresh.splitBills);
    setSettings(fresh.settings);
    triggerHaptic('warning');
    if (googleUser) {
      pushUserDataToCloud(googleUser.uid, {
        transactions: fresh.transactions,
        wallets: fresh.wallets,
        categories: fresh.categories,
        budgets: fresh.budgets,
        recurring: fresh.recurring,
        debts: fresh.debts,
        savingsGoals: fresh.savingsGoals,
        financialJars: fresh.financialJars,
        splitBills: fresh.splitBills,
        settings: fresh.settings,
      });
    }
  };

  const clearAllData = () => {
    const clearedWallets = DEFAULT_WALLETS.map(w => ({ ...w, balance: 0 }));
    setTransactions([]);
    setWallets(clearedWallets);
    setBudgets([]);
    setRecurringTransactions([]);
    setDebts([]);
    setSavingsGoals([]);
    setSplitBills([]);
    triggerHaptic('warning');
    if (googleUser) {
      pushUserDataToCloud(googleUser.uid, {
        transactions: [],
        wallets: clearedWallets,
        categories,
        budgets: [],
        recurring: [],
        debts: [],
        savingsGoals: [],
        financialJars,
        splitBills: [],
        settings,
      });
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Mã GD', 'Ngày', 'Giờ', 'Loại', 'Số tiền (VNĐ)', 'Danh mục', 'Ví thanh toán', 'Ví nhận', 'Ghi chú'];
    const rows = transactions.map(t => {
      const cat = getCategoryById(t.categoryId)?.name || 'Khác';
      const walletFrom = getWalletById(t.walletId)?.name || '';
      const walletTo = t.toWalletId ? getWalletById(t.toWalletId)?.name || '' : '';
      const typeLabel = t.type === 'expense' ? 'Chi tiêu' : t.type === 'income' ? 'Thu nhập' : 'Chuyển khoản';
      return [
        t.id,
        t.date,
        t.time || '',
        typeLabel,
        t.amount,
        `"${cat.replace(/"/g, '""')}"`,
        `"${walletFrom.replace(/"/g, '""')}"`,
        `"${walletTo.replace(/"/g, '""')}"`,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SoThuChi_Export_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      transactions,
      wallets,
      categories,
      budgets,
      recurringTransactions,
      debts,
      savingsGoals,
      financialJars,
      splitBills,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SaoLuu_ThuChi_${selectedMonth}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON
  const importFromJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data.transactions) || !Array.isArray(data.wallets)) {
        return false;
      }
      setTransactions(data.transactions);
      setWallets(data.wallets);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.budgets)) setBudgets(data.budgets);
      if (Array.isArray(data.recurringTransactions)) setRecurringTransactions(data.recurringTransactions);
      if (Array.isArray(data.debts)) setDebts(data.debts);
      if (Array.isArray(data.savingsGoals)) setSavingsGoals(data.savingsGoals);
      if (Array.isArray(data.financialJars)) setFinancialJars(data.financialJars);
      if (Array.isArray(data.splitBills)) setSplitBills(data.splitBills);
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings, isLocked: prev.isLocked }));
      triggerHaptic('success');
      if (googleUser) {
        pushUserDataToCloud(googleUser.uid, {
          transactions: data.transactions,
          wallets: data.wallets,
          categories: data.categories || categories,
          budgets: data.budgets || budgets,
          recurring: data.recurringTransactions || recurringTransactions,
          debts: data.debts || debts,
          savingsGoals: data.savingsGoals || savingsGoals,
          financialJars: data.financialJars || financialJars,
          splitBills: data.splitBills || splitBills,
          settings: data.settings || settings,
        });
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Computed Values
  const totalBalance = useMemo(() => {
    return wallets.reduce((acc, w) => acc + w.balance, 0);
  }, [wallets]);

  const totalLent = useMemo(() => {
    return debts
      .filter(d => d.type === 'lend' && d.status === 'active')
      .reduce((sum, d) => sum + Math.max(0, d.amount - (d.paidAmount || 0)), 0);
  }, [debts]);

  const totalBorrowed = useMemo(() => {
    return debts
      .filter(d => d.type === 'borrow' && d.status === 'active')
      .reduce((sum, d) => sum + Math.max(0, d.amount - (d.paidAmount || 0)), 0);
  }, [debts]);

  const totalSavingsTarget = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  }, [savingsGoals]);

  const totalSavingsCurrent = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [savingsGoals]);

  const { monthIncome, monthExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.date.startsWith(selectedMonth)) {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expense += t.amount;
      }
    });

    return { monthIncome: income, monthExpense: expense };
  }, [transactions, selectedMonth]);

  const monthNet = monthIncome - monthExpense;

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        categories,
        wallets,
        budgets,
        recurringTransactions,
        debts,
        totalLent,
        totalBorrowed,
        savingsGoals,
        financialJars,
        totalSavingsTarget,
        totalSavingsCurrent,
        settings,
        isLocked: !!(settings.pinCode && settings.isLocked),
        activeTab,
        setActiveTab,
        selectedMonth,
        setSelectedMonth,
        isAddModalOpen,
        setIsAddModalOpen,
        editingTransaction,
        setEditingTransaction,
        deviceMode,
        setDeviceMode,
        user: currentUser,
        currentUser,
        savedUsers,
        login,
        register,
        logout,
        switchUser,
        deleteAccount,
        googleUser,
        isSyncing,
        lastSyncedAt,
        loginWithGoogle,
        logoutGoogle,
        syncNow,
        pullFromCloud,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        addCategory,
        updateCategory,
        deleteCategory,
        setBudget,
        deleteBudget,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        executeRecurringNow,
        addDebt,
        updateDebt,
        deleteDebt,
        addDebtRepayment,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        contributeToGoal,
        updateFinancialJar,
        resetFinancialJars,
        splitBills,
        addSplitBill,
        updateSplitBill,
        deleteSplitBill,
        toggleMemberPaidStatus,
        convertMemberOwedToDebt,
        convertBillToExpense,
        updateSettings,
        setPinCode,
        verifyPin,
        lockApp,
        unlockApp,
        resetToDefaultData,
        clearAllData,
        exportToCSV,
        exportToJSON,
        importFromJSON,
        totalBalance,
        monthIncome,
        monthExpense,
        monthNet,
        getCategoryById,
        getWalletById,
        formatMoney,
        formatShortMoney,
        t,
        language: settings.language,
        theme: settings.theme,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
