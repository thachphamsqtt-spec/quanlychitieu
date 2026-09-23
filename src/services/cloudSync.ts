import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Transaction,
  Wallet,
  Category,
  Budget,
  RecurringTransaction,
  Debt,
  SavingsGoal,
  FinancialJar,
  SplitBill,
  AppSettings,
} from '../types/expense';

export interface CloudUserData {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  financialJars: FinancialJar[];
  splitBills: SplitBill[];
  settings?: Partial<AppSettings>;
  lastSyncedAt?: string;
}

/**
 * Recursively remove undefined fields because Firestore throws an error on `undefined`.
 */
function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Fetch all financial data for a user from Firestore
 */
export async function pullUserDataFromCloud(userId: string): Promise<CloudUserData> {
  const userRef = doc(db, 'users', userId);

  // 1. Transactions
  const txSnap = await getDocs(collection(userRef, 'transactions'));
  const transactions: Transaction[] = [];
  txSnap.forEach(d => transactions.push(d.data() as Transaction));

  // 2. Wallets
  const walletSnap = await getDocs(collection(userRef, 'wallets'));
  const wallets: Wallet[] = [];
  walletSnap.forEach(d => wallets.push(d.data() as Wallet));

  // 3. Categories
  const catSnap = await getDocs(collection(userRef, 'categories'));
  const categories: Category[] = [];
  catSnap.forEach(d => categories.push(d.data() as Category));

  // 4. Budgets
  const budgetSnap = await getDocs(collection(userRef, 'budgets'));
  const budgets: Budget[] = [];
  budgetSnap.forEach(d => budgets.push(d.data() as Budget));

  // 5. Recurring
  const recSnap = await getDocs(collection(userRef, 'recurring'));
  const recurring: RecurringTransaction[] = [];
  recSnap.forEach(d => recurring.push(d.data() as RecurringTransaction));

  // 6. Debts
  const debtSnap = await getDocs(collection(userRef, 'debts'));
  const debts: Debt[] = [];
  debtSnap.forEach(d => debts.push(d.data() as Debt));

  // 7. Savings Goals
  const goalSnap = await getDocs(collection(userRef, 'savingsGoals'));
  const savingsGoals: SavingsGoal[] = [];
  goalSnap.forEach(d => savingsGoals.push(d.data() as SavingsGoal));

  // 8. Financial Jars
  const jarSnap = await getDocs(collection(userRef, 'financialJars'));
  const financialJars: FinancialJar[] = [];
  jarSnap.forEach(d => financialJars.push(d.data() as FinancialJar));

  // 9. Split Bills
  const splitSnap = await getDocs(collection(userRef, 'splitBills'));
  const splitBills: SplitBill[] = [];
  splitSnap.forEach(d => splitBills.push(d.data() as SplitBill));

  // 10. Settings
  let settings: Partial<AppSettings> | undefined;
  try {
    const settingsSnap = await getDoc(doc(userRef, 'settings', 'config'));
    if (settingsSnap.exists()) {
      settings = settingsSnap.data() as Partial<AppSettings>;
    }
  } catch (err) {
    console.warn('Failed to fetch settings from cloud:', err);
  }

  // 11. User profile / metadata
  const userDocSnap = await getDoc(userRef);
  const lastSyncedAt = userDocSnap.exists() ? (userDocSnap.data()?.lastSyncedAt as string) : undefined;

  return {
    transactions,
    wallets,
    categories,
    budgets,
    recurring,
    debts,
    savingsGoals,
    financialJars,
    splitBills,
    settings,
    lastSyncedAt,
  };
}

/**
 * Push all local data to Firestore for a user
 */
export async function pushUserDataToCloud(
  userId: string,
  data: {
    transactions: Transaction[];
    wallets: Wallet[];
    categories: Category[];
    budgets: Budget[];
    recurring: RecurringTransaction[];
    debts: Debt[];
    savingsGoals?: SavingsGoal[];
    financialJars?: FinancialJar[];
    splitBills?: SplitBill[];
    settings: AppSettings;
    userProfile?: {
      email?: string | null;
      displayName?: string | null;
      photoURL?: string | null;
    };
  }
): Promise<string> {
  const userRef = doc(db, 'users', userId);
  const now = new Date().toISOString();

  // Update user profile metadata
  await setDoc(
    userRef,
    cleanFirestoreData({
      uid: userId,
      email: data.userProfile?.email || null,
      displayName: data.userProfile?.displayName || null,
      photoURL: data.userProfile?.photoURL || null,
      lastSyncedAt: now,
    }),
    { merge: true }
  );

  // Sync in chunks / batches
  // Save transactions
  for (const tx of data.transactions) {
    await setDoc(doc(userRef, 'transactions', tx.id), cleanFirestoreData(tx), { merge: true });
  }

  // Save wallets
  for (const w of data.wallets) {
    await setDoc(doc(userRef, 'wallets', w.id), cleanFirestoreData(w), { merge: true });
  }

  // Save categories
  for (const c of data.categories) {
    await setDoc(doc(userRef, 'categories', c.id), cleanFirestoreData(c), { merge: true });
  }

  // Save budgets
  for (const b of data.budgets) {
    await setDoc(doc(userRef, 'budgets', b.id), cleanFirestoreData(b), { merge: true });
  }

  // Save recurring
  for (const r of data.recurring) {
    await setDoc(doc(userRef, 'recurring', r.id), cleanFirestoreData(r), { merge: true });
  }

  // Save debts
  for (const d of data.debts) {
    await setDoc(doc(userRef, 'debts', d.id), cleanFirestoreData(d), { merge: true });
  }

  // Save savingsGoals
  if (data.savingsGoals) {
    for (const g of data.savingsGoals) {
      await setDoc(doc(userRef, 'savingsGoals', g.id), cleanFirestoreData(g), { merge: true });
    }
  }

  // Save financialJars
  if (data.financialJars) {
    for (const j of data.financialJars) {
      await setDoc(doc(userRef, 'financialJars', j.id), cleanFirestoreData(j), { merge: true });
    }
  }

  // Save splitBills
  if (data.splitBills) {
    for (const s of data.splitBills) {
      await setDoc(doc(userRef, 'splitBills', s.id), cleanFirestoreData(s), { merge: true });
    }
  }

  // Save settings (excluding local isLocked state)
  const safeSettings = { ...data.settings, isLocked: false };
  await setDoc(doc(userRef, 'settings', 'config'), cleanFirestoreData(safeSettings), { merge: true });

  return now;
}

/**
 * Real-time atomic document helpers
 */
export async function syncSingleDoc(
  userId: string,
  collectionName:
    | 'transactions'
    | 'wallets'
    | 'categories'
    | 'budgets'
    | 'recurring'
    | 'debts'
    | 'savingsGoals'
    | 'financialJars'
    | 'splitBills'
    | 'settings',
  docId: string,
  docData: any
) {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(doc(userRef, collectionName, docId), cleanFirestoreData(docData), { merge: true });
    // Update last sync time
    await setDoc(userRef, { lastSyncedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn(`Sync failed for ${collectionName}/${docId}:`, err);
  }
}

export async function deleteSingleDoc(
  userId: string,
  collectionName:
    | 'transactions'
    | 'wallets'
    | 'categories'
    | 'budgets'
    | 'recurring'
    | 'debts'
    | 'savingsGoals'
    | 'financialJars'
    | 'splitBills'
    | 'settings',
  docId: string
) {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(doc(userRef, collectionName, docId));
  } catch (err) {
    console.warn(`Delete sync failed for ${collectionName}/${docId}:`, err);
  }
}

