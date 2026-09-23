import { Category, Wallet } from '../types/expense';

export interface ParsedReceiptResult {
  amount: number;
  type: 'expense' | 'income';
  date: string;
  time?: string;
  note: string;
  categoryId?: string;
  categoryName?: string;
  walletId?: string;
  confidence?: number;
  items?: Array<{ name: string; price: number }>;
}

export interface ParsedTextResult {
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  date: string;
  note: string;
  categoryId?: string;
  walletId?: string;
}

export interface FinancialAdviceResult {
  overallRating: 'excellent' | 'good' | 'warning' | 'critical';
  healthScore: number;
  summary: string;
  alerts: string[];
  savingsTips: Array<{
    title: string;
    detail: string;
    potentialSavings?: string;
  }>;
  projection: string;
}

export async function parseReceiptWithAI(
  imageBase64: string,
  mimeType: string,
  categories: Category[],
  wallets: Wallet[]
): Promise<ParsedReceiptResult> {
  const res = await fetch('/api/gemini/parse-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      wallets: wallets.map(w => ({ id: w.id, name: w.name })),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi khi nhận diện hóa đơn qua AI');
  }

  const json = await res.json();
  return json.data;
}

export async function parseTextWithAI(
  text: string,
  categories: Category[],
  wallets: Wallet[]
): Promise<ParsedTextResult> {
  const res = await fetch('/api/gemini/parse-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      wallets: wallets.map(w => ({ id: w.id, name: w.name })),
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi khi phân tích câu nói qua AI');
  }

  const json = await res.json();
  return json.data;
}

export async function getFinancialAdviceAI(data: {
  month: string;
  income: number;
  expense: number;
  balance: number;
  categoriesBreakdown: Array<{ name: string; amount: number; percentage: number }>;
  budgets: Array<{ categoryName: string; spent: number; limit: number }>;
  topTransactions: Array<{ note: string; amount: number; type: string; categoryName: string }>;
}): Promise<FinancialAdviceResult> {
  const res = await fetch('/api/gemini/financial-advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Không thể lấy phân tích tài chính lúc này');
  }

  const json = await res.json();
  return json.data;
}
