import { Category, Wallet, QuickNLPResult, TransactionType } from '../types/expense';

export const parseQuickExpenseText = (
  input: string,
  categories: Category[],
  wallets: Wallet[]
): QuickNLPResult => {
  const text = input.trim();
  let amount: number | undefined;
  let type: TransactionType = 'expense';
  let categoryId: string | undefined;
  let walletId: string | undefined;

  // 1. Detect amount with units:
  // e.g. 50k, 50.000, 50000, 1.5tr, 1.5 triệu, 200 ngàn, 25tr
  const amountPattern = /(\d+(?:[.,]\d+)?)\s*(k|ngàn|nghin|nghìn|tr|trieu|triệu|ty|tỷ|d|đ|vnd)?\b/i;
  const match = text.match(amountPattern);

  if (match) {
    let num = parseFloat(match[1].replace(',', '.'));
    const unit = (match[2] || '').toLowerCase();

    if (unit === 'k' || unit === 'ngàn' || unit === 'nghin' || unit === 'nghìn') {
      num *= 1000;
    } else if (unit === 'tr' || unit === 'trieu' || unit === 'triệu') {
      num *= 1000000;
    } else if (unit === 'ty' || unit === 'tỷ') {
      num *= 1000000000;
    } else if (num < 1000 && !unit) {
      // If someone types "50" for coffee, usually in VN it implies 50k
      if (num > 0 && num <= 500) {
        num *= 1000;
      }
    }
    amount = Math.round(num);
  }

  // 2. Detect Income keywords
  const lowerText = text.toLowerCase();
  const incomeKeywords = ['lương', 'luong', 'thưởng', 'thuong', 'bán', 'nhận tiền', 'được cho', 'tiền về', 'lãi', 'thu nhập'];
  if (incomeKeywords.some(k => lowerText.includes(k))) {
    type = 'income';
  }

  // 3. Match Category
  const foodKeywords = ['ăn', 'cơm', 'bún', 'phở', 'bánh', 'trưa', 'tối', 'sáng', 'lẩu', 'gà', 'thịt', 'đồ ăn', 'uống'];
  const coffeeKeywords = ['cà phê', 'cafe', 'cf', 'trà', 'trà sữa', 'highland', 'starbucks', 'phúc long'];
  const transportKeywords = ['xăng', 'xe', 'grab', 'be', 'gojek', 'gửi xe', 'rửa xe', 'vé xe', 'bus', 'sửa xe'];
  const shoppingKeywords = ['mua', 'shopee', 'lazada', 'tiki', 'siêu thị', 'winmart', 'quần áo', 'giày', 'chợ'];
  const billsKeywords = ['điện', 'nước', 'wifi', 'internet', 'fpt', 'viettel', 'hóa đơn', 'cước'];
  const entertainmentKeywords = ['phim', 'cgv', 'game', 'du lịch', 'karaoke', 'nhậu', 'tiệc'];
  const homeKeywords = ['tiền nhà', 'tiền trọ', 'phòng trọ', 'thuê nhà'];
  const healthKeywords = ['thuốc', 'khám', 'bác sĩ', 'bệnh', 'nha khoa', 'vitamin'];

  if (type === 'income') {
    if (lowerText.includes('lương') || lowerText.includes('luong')) {
      categoryId = categories.find(c => c.id === 'cat_salary')?.id;
    } else if (lowerText.includes('thưởng') || lowerText.includes('thuong')) {
      categoryId = categories.find(c => c.id === 'cat_bonus')?.id;
    } else if (lowerText.includes('làm thêm') || lowerText.includes('dự án') || lowerText.includes('bán')) {
      categoryId = categories.find(c => c.id === 'cat_freelance')?.id;
    } else {
      categoryId = categories.find(c => c.type === 'income')?.id;
    }
  } else {
    if (coffeeKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_coffee')?.id;
    } else if (transportKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_transport')?.id;
    } else if (shoppingKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_shopping')?.id;
    } else if (billsKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_bills')?.id;
    } else if (homeKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_home')?.id;
    } else if (entertainmentKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_entertainment')?.id;
    } else if (healthKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_health')?.id;
    } else if (foodKeywords.some(k => lowerText.includes(k))) {
      categoryId = categories.find(c => c.id === 'cat_food')?.id;
    } else {
      categoryId = categories.find(c => c.id === 'cat_other_expense')?.id;
    }
  }

  // 4. Match Wallet
  if (lowerText.includes('momo') || lowerText.includes('ví')) {
    const w = wallets.find(w => w.name.toLowerCase().includes('momo') || w.type === 'e_wallet');
    if (w) walletId = w.id;
  } else if (lowerText.includes('vcb') || lowerText.includes('vietcombank') || lowerText.includes('ngân hàng') || lowerText.includes('ck')) {
    const w = wallets.find(w => w.type === 'bank');
    if (w) walletId = w.id;
  } else if (lowerText.includes('tiền mặt') || lowerText.includes('tm')) {
    const w = wallets.find(w => w.type === 'cash');
    if (w) walletId = w.id;
  }

  // Clean note (strip the numeric amount part from original string)
  let cleanNote = text;
  if (match) {
    cleanNote = cleanNote.replace(match[0], '').trim();
    // remove trailing or leading dashes or commas
    cleanNote = cleanNote.replace(/^[-:,.\s]+|[-:,.\s]+$/g, '');
  }
  if (!cleanNote) {
    cleanNote = text;
  }

  return {
    amount,
    type,
    categoryId,
    walletId: walletId || wallets[0]?.id,
    note: cleanNote.charAt(0).toUpperCase() + cleanNote.slice(1),
  };
};
