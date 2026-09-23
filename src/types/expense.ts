export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  type: 'expense' | 'income';
  icon: string;
  color: string; // Hex or CSS color
  bgColor: string; // Tailwind soft bg
  isDefault?: boolean;
}

export type WalletType = 'cash' | 'bank' | 'e_wallet' | 'credit_card';
export type CardNetwork = 'visa' | 'mastercard' | 'jcb' | 'napas' | 'amex';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number; // in base currency (VNĐ)
  icon: string;
  color: string;
  accountNumber?: string;
  customQrImage?: string; // Optional custom QR code image (Base64 data URL)
  // Credit card specific fields
  creditLimit?: number; // For credit cards (Hạn mức tín dụng)
  statementDate?: number; // Day of month (1-31) (Ngày sao kê)
  paymentDueDate?: number; // Day of month (1-31) (Ngày đến hạn thanh toán)
  gracePeriodDays?: number; // Max interest-free days (45 or 55 days)
  cardNetwork?: CardNetwork; // Visa, Mastercard, JCB, Napas, Amex
  bankName?: string; // Bank name
  cardHolderName?: string; // Name on card
  interestRateAnnual?: number; // Annual interest rate percentage (e.g. 30%)
  cashbackNote?: string; // Cashback or promotion note
  minimumPaymentPercent?: number; // Default 5%
  isCardLocked?: boolean; // Temporary card lock
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // positive number in base currency
  categoryId: string;
  walletId: string;
  toWalletId?: string; // only for transfer
  date: string; // ISO format: YYYY-MM-DD
  time?: string; // HH:mm
  note: string;
  createdAt: number;
  receiptImage?: string; // Base64 or URL
  recurringId?: string; // If created from a recurring rule
}

export interface Budget {
  id: string;
  categoryId: string; // 'all' or specific category ID
  monthlyLimit: number; // in base currency
  month: string; // YYYY-MM
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId: string;
  note: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  nextDueDate: string;
  lastExecutedDate?: string;
  isActive: boolean;
  createdAt: number;
}

export interface SavingsContribution {
  id: string;
  amount: number;
  date: string;
  walletId?: string;
  note?: string;
  type: 'deposit' | 'withdraw';
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  color: string;
  icon: string;
  note?: string;
  status: 'in_progress' | 'achieved';
  contributions: SavingsContribution[];
  createdAt: number;
}

export interface FinancialJar {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  percentage: number;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
  categoryIds: string[];
}

export type DebtType = 'lend' | 'borrow'; // lend: Tôi cho vay, borrow: Tôi đi vay
export type DebtStatus = 'active' | 'completed';

export interface DebtRepayment {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  walletId?: string;
  note?: string;
  createdAt: number;
}

export interface Debt {
  id: string;
  type: DebtType;
  personName: string;
  phoneNumber?: string;
  amount: number;
  paidAmount: number;
  walletId?: string;
  startDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  note?: string;
  status: DebtStatus;
  repayments: DebtRepayment[];
  createdAt: number;
}

export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'JPY';
export type AppLanguage = 'vi' | 'en';
export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
  currency: CurrencyCode;
  language: AppLanguage;
  theme: AppTheme;
  pinCode: string | null; // 4 digits or null
  isLocked: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // "20:00"
}

export type ActiveTab = 'dashboard' | 'transactions' | 'analytics' | 'budget' | 'wallets' | 'recurring' | 'debts' | 'savings' | 'split_bill' | 'jars' | 'credit_cards';

export type SplitMethod = 'equal' | 'custom' | 'itemized' | 'percentage';

export interface SplitBillItem {
  id: string;
  name: string;
  price: number;
  assignedMemberIds: string[]; // members sharing this item/dish
}

export interface SplitBillMember {
  id: string;
  name: string;
  phoneNumber?: string;
  avatarColor?: string;
  amount: number; // calculated or custom amount
  isPaid: boolean;
  paidAt?: number;
  isPayer?: boolean; // True if this member paid upfront
  customPercentage?: number;
}

export interface BankAccountInfo {
  bankCode: string; // e.g., 'VCB', 'MB', 'TCB'
  bankName?: string;
  accountNo: string;
  accountName: string;
  customQrImage?: string; // Optional user uploaded custom QR code image (Base64)
}

export interface SplitBill {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  totalAmount: number;
  tipAmount?: number;
  taxPercent?: number; // VAT % e.g. 8 or 10
  discountAmount?: number;
  splitMethod: SplitMethod;
  members: SplitBillMember[];
  items?: SplitBillItem[];
  payerMemberId?: string; // id of the member who paid
  payerWalletId?: string; // wallet used to pay initially
  bankInfo?: BankAccountInfo; // Bank details for VietQR generation
  note?: string;
  status: 'pending' | 'settled'; // settled when all members have paid
  createdAt: number;
}

export interface QuickNLPResult {
  amount?: number;
  type: TransactionType;
  categoryId?: string;
  walletId?: string;
  note: string;
}
