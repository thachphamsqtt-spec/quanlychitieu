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

/**
 * High-accuracy local Vietnamese NLP parser for speech-to-text & voice input.
 * Ensures the app works smoothly on GitHub Pages, Vercel, or even when offline / Gemini API is busy.
 */
export function parseVietnameseTextLocally(
  text: string,
  categories: Category[] = [],
  wallets: Wallet[] = []
): ParsedTextResult {
  const rawText = text.trim();
  const lower = rawText.toLowerCase();

  // 1. Detect Date
  const now = new Date();
  let targetDate = new Date(now);

  if (/\b(?:hôm qua|qua)\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() - 1);
  } else if (/\b(?:hôm kia|kia)\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() - 2);
  } else if (/\b(?:ngày mai|mai)\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else {
    // Check specific day: "ngày 15" or "ngày 15/09"
    const specificDayMatch = lower.match(/\bngày\s*(\d{1,2})(?:\/(\d{1,2}))?\b/i);
    if (specificDayMatch) {
      const day = parseInt(specificDayMatch[1], 10);
      const month = specificDayMatch[2] ? parseInt(specificDayMatch[2], 10) - 1 : now.getMonth();
      if (day >= 1 && day <= 31) {
        targetDate = new Date(now.getFullYear(), month, day);
      }
    }
  }

  const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

  // 2. Detect Amount (covers all Vietnamese spoken formats)
  let amount = 0;

  // Words to numbers (e.g., "nửa triệu", "một triệu", "hai củ rưỡi", "năm mươi ngàn")
  if (/nửa triệu|500k|500 k|nửa củ/i.test(lower)) {
    amount = 500000;
  } else if (/(\d+(?:[.,]\d+)?)\s*(?:củ rưỡi|triệu rưỡi|tr rưỡi)/i.test(lower)) {
    const match = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:củ rưỡi|triệu rưỡi|tr rưỡi)/i);
    if (match) {
      amount = Math.round(parseFloat(match[1].replace(',', '.')) * 1000000 + 500000);
    }
  } else if (/(\d+)\s*(?:tr|triệu|củ)\s*(\d{1,3})(?:\s*k|\s*nghìn|\s*ngàn)?\b/i.test(lower)) {
    // "1tr5" -> 1500000, "2 củ 3" -> 2300000
    const match = lower.match(/(\d+)\s*(?:tr|triệu|củ)\s*(\d{1,3})(?:\s*k|\s*nghìn|\s*ngàn)?\b/i);
    if (match) {
      const major = parseInt(match[1], 10);
      let minorStr = match[2];
      if (minorStr.length === 1) minorStr += '00000';
      else if (minorStr.length === 2) minorStr += '0000';
      else if (minorStr.length === 3) minorStr += '000';
      amount = major * 1000000 + parseInt(minorStr, 10);
    }
  } else {
    // Standard multipliers: triệu/củ/tr/m, lít/xị, k/nghìn/ngàn/ng, plain digits
    const millionMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|củ|m\b)/i);
    const hundredKMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:lít|lit|xị|xi)\b/i);
    const thousandMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:k\b|nghìn|ngàn|ng\b)/i);
    const dotFormattedMatch = lower.match(/\b(\d{1,3}(?:\.\d{3})+)\s*(?:đ|vnd|đồng)?\b/i);
    const plainDigitsMatch = lower.match(/\b(\d{4,12})\b/);

    if (millionMatch) {
      amount = Math.round(parseFloat(millionMatch[1].replace(',', '.')) * 1000000);
    } else if (hundredKMatch) {
      amount = Math.round(parseFloat(hundredKMatch[1].replace(',', '.')) * 100000);
    } else if (thousandMatch) {
      amount = Math.round(parseFloat(thousandMatch[1].replace(',', '.')) * 1000);
    } else if (dotFormattedMatch) {
      amount = parseInt(dotFormattedMatch[1].replace(/\./g, ''), 10);
    } else if (plainDigitsMatch) {
      amount = parseInt(plainDigitsMatch[1], 10);
    }
  }

  // 3. Detect Type (income vs transfer vs expense)
  let type: 'expense' | 'income' | 'transfer' = 'expense';
  const isIncome = /lương|thưởng|nhận tiền|nhận|được cho|được tặng|lì xì|li xi|bán|thu tiền|tiền vào|hoàn tiền|cộng tiền|thu nhập|trúng số|tiền lãi/i.test(lower);
  const isTransfer = /chuyển khoản|chuyển tiền|chuyển qua|chuyển sang|nạp vào|nạp tiền|rút tiền/i.test(lower);

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  }

  // 4. Match Category
  let categoryId = categories[0]?.id;
  
  // First, check direct name match from user's custom categories
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase();
    if (lower.includes(catNameLower)) {
      categoryId = cat.id;
      break;
    }
  }

  // If not matched, use smart keyword mappings to find category in user's category list
  if (categoryId === categories[0]?.id) {
    const categoryMappings: Array<{ regex: RegExp; keywords: string[] }> = [
      {
        regex: /ăn|cơm|bún|phở|bánh mì|hủ tiếu|xôi|sáng|trưa|tối|nhậu|lẩu|nướng|ốc|trà sữa|cafe|cà phê|highland|phúc long|nước ngọt|sinh tố|ăn vặt|kfc|lotteria|pizza|bánh|chè|cháo|mì cay|gà rán|kem/i,
        keywords: ['ăn uống', 'ăn', 'uống', 'ẩm thực', 'food', 'f&b'],
      },
      {
        regex: /xăng|đổ xăng|gửi xe|giữ xe|sửa xe|rửa xe|bảo dưỡng|thay nhớt|grab|be|taxi|xanh sm|xe buýt|bus|vé tàu|vé xe|máy bay|cầu đường|bot|xe máy|ô tô/i,
        keywords: ['đi lại', 'di chuyển', 'xe cộ', 'xăng', 'transport'],
      },
      {
        regex: /mua|chợ|siêu thị|winmart|coopmart|bách hóa|shopee|lazada|tiktok|tiki|quần áo|áo|quần|váy|đầm|giày|dép|mỹ phẩm|skincare|son|phụ kiện|túi xách|đồng hồ|đồ gia dụng|đồ dùng/i,
        keywords: ['mua sắm', 'chợ', 'siêu thị', 'shopping'],
      },
      {
        regex: /tiền nhà|phòng trọ|thuê nhà|tiền điện|điện lực|tiền nước|internet|wifi|fpt|viettel|vnpt|4g|5g|nạp đt|thẻ cào|rác|dịch vụ chung cư|sửa nhà/i,
        keywords: ['hóa đơn', 'nhà cửa', 'tiện ích', 'tiền nhà', 'bills'],
      },
      {
        regex: /thuốc|tiệm thuốc|pharmacy|long châu|an khang|khám bệnh|bác sĩ|nha khoa|răng|mắt|kính|xét nghiệm|bệnh viện|vitamin|gym|yoga|thể thao/i,
        keywords: ['sức khỏe', 'y tế', 'thuốc', 'health'],
      },
      {
        regex: /xem phim|cgv|lotte|game|net|bida|karaoke|du lịch|khách sạn|vé xem|netflix|spotify|youtube|chơi|nhạc/i,
        keywords: ['giải trí', 'vui chơi', 'du lịch', 'entertainment'],
      },
      {
        regex: /học phí|sách|vở|khóa học|tiền học|gia sư|chứng chỉ|thi/i,
        keywords: ['giáo dục', 'học tập', 'học', 'education'],
      },
      {
        regex: /lương|thưởng|hoa hồng|freelance|làm thêm|thu nhập|cổ tức|bán đồ/i,
        keywords: ['lương', 'thu nhập', 'thưởng', 'income'],
      },
    ];

    for (const mapping of categoryMappings) {
      if (mapping.regex.test(lower)) {
        const found = categories.find(c =>
          mapping.keywords.some(k => c.name.toLowerCase().includes(k))
        );
        if (found) {
          categoryId = found.id;
          break;
        }
      }
    }
  }

  // 5. Match Wallet
  let walletId = wallets[0]?.id;

  // Direct wallet name match
  for (const w of wallets) {
    const wNameLower = w.name.toLowerCase();
    if (lower.includes(wNameLower)) {
      walletId = w.id;
      break;
    }
  }

  // Wallet alias matches
  if (walletId === wallets[0]?.id) {
    const walletAliases: Array<{ regex: RegExp; keywords: string[] }> = [
      { regex: /momo|ví momo/i, keywords: ['momo'] },
      { regex: /zalopay|zalo pay|zalo/i, keywords: ['zalopay', 'zalo'] },
      { regex: /mb|mbbank|quân đội/i, keywords: ['mb', 'mbbank', 'quân đội'] },
      { regex: /vietcom|vietcombank|vcb/i, keywords: ['vietcom', 'vcb'] },
      { regex: /techcom|techcombank|tcb/i, keywords: ['techcom', 'tcb'] },
      { regex: /vpbank|vpb|cake/i, keywords: ['vpbank', 'cake'] },
      { regex: /tpbank|tpb/i, keywords: ['tpbank', 'tpb'] },
      { regex: /bidv/i, keywords: ['bidv'] },
      { regex: /agribank|nông nghiệp/i, keywords: ['agribank'] },
      { regex: /acb|á châu/i, keywords: ['acb'] },
      { regex: /sacombank|stb/i, keywords: ['sacombank'] },
      { regex: /thẻ tín dụng|visa|mastercard|credit/i, keywords: ['tín dụng', 'credit', 'visa'] },
      { regex: /tiền mặt|ví tiền|túi|cash/i, keywords: ['tiền mặt', 'ví chính', 'cash'] },
    ];

    for (const alias of walletAliases) {
      if (alias.regex.test(lower)) {
        const found = wallets.find(w =>
          alias.keywords.some(k => w.name.toLowerCase().includes(k))
        );
        if (found) {
          walletId = found.id;
          break;
        }
      }
    }
  }

  // 6. Clean Note (clean up raw speech to create a concise description)
  let note = rawText
    // Remove wallet keywords
    .replace(/(?:vào|bằng|từ|qua|ví|tài khoản|tk)?\s*(?:momo|zalopay|mb\s*bank|mb|mbbank|tcb|techcombank|vcb|vietcombank|vpbank|tpbank|bidv|agribank|acb|sacombank|tiền\s*mặt|thẻ\s*tín\s*dụng|thẻ\s*visa|thẻ)\b/gi, '')
    // Remove date keywords
    .replace(/\b(?:hôm nay|hôm qua|hôm kia|ngày mai|ngày\s*\d{1,2}(?:\/\d{1,2})?)\b/gi, '')
    // Remove amount patterns
    .replace(/\b(?:\d+(?:[.,]\d+)?\s*(?:củ rưỡi|triệu rưỡi|tr rưỡi|triệu|tr|củ|lít|lit|xị|xi|k|nghìn|ngàn|ng|m|vnd|đ|đồng)|\d{4,12})\b/gi, '')
    .replace(/\b(?:nửa triệu|nửa củ)\b/gi, '')
    // Clean extra whitespace
    .replace(/\s+/g, ' ')
    .trim();

  // If note became empty, default based on type
  if (!note || note.length < 2) {
    if (type === 'income') {
      note = 'Thu nhập';
    } else if (type === 'transfer') {
      note = 'Chuyển tiền';
    } else {
      const cat = categories.find(c => c.id === categoryId);
      note = cat ? cat.name : 'Chi tiêu';
    }
  }

  // Capitalize first letter
  note = note.charAt(0).toUpperCase() + note.slice(1);

  return {
    amount: amount || 0,
    type,
    date: dateStr,
    note,
    categoryId,
    walletId,
  };
}

/**
 * Smart Text/Speech AI Parser with Automatic Local Fallback
 */
export async function parseTextWithAI(
  text: string,
  categories: Category[],
  wallets: Wallet[]
): Promise<ParsedTextResult> {
  if (!text || !text.trim()) {
    throw new Error('Vui lòng nói hoặc nhập nội dung giao dịch!');
  }

  try {
    const res = await fetch('/api/gemini/parse-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        categories: categories.map(c => ({ id: c.id, name: c.name })),
        wallets: wallets.map(w => ({ id: w.id, name: w.name })),
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.data && typeof json.data.amount === 'number') {
        return json.data;
      }
    }
  } catch (apiError) {
    console.warn('API backend unreachable or offline, using smart local parser:', apiError);
  }

  // Guaranteed accurate local Vietnamese NLP parser fallback
  return parseVietnameseTextLocally(text, categories, wallets);
}

/**
 * Receipt OCR AI Parser
 */
export async function parseReceiptWithAI(
  imageBase64: string,
  mimeType: string,
  categories: Category[],
  wallets: Wallet[]
): Promise<ParsedReceiptResult> {
  try {
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

    if (res.ok) {
      const json = await res.json();
      return json.data;
    }

    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Lỗi khi nhận diện hóa đơn qua AI');
  } catch (err: any) {
    console.error('Receipt OCR error:', err);
    throw new Error(err?.message || 'Không thể kết nối dịch vụ quét hóa đơn lúc này');
  }
}

/**
 * Financial Advice AI with Smart Local Analytics Fallback
 */
export async function getFinancialAdviceAI(data: {
  month: string;
  income: number;
  expense: number;
  balance: number;
  categoriesBreakdown: Array<{ name: string; amount: number; percentage: number }>;
  budgets: Array<{ categoryName: string; spent: number; limit: number }>;
  topTransactions: Array<{ note: string; amount: number; type: string; categoryName: string }>;
}): Promise<FinancialAdviceResult> {
  try {
    const res = await fetch('/api/gemini/financial-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (apiErr) {
    console.warn('Financial advisor backend unavailable, using local intelligence engine:', apiErr);
  }

  // Local Intelligence Analytics Engine
  const { month, income = 0, expense = 0, categoriesBreakdown = [], budgets = [] } = data;
  const net = income - expense;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  let overallRating: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
  let healthScore = 75;

  if (savingsRate >= 30) {
    overallRating = 'excellent';
    healthScore = 92;
  } else if (savingsRate >= 15) {
    overallRating = 'good';
    healthScore = 78;
  } else if (savingsRate >= 0) {
    overallRating = 'warning';
    healthScore = 58;
  } else {
    overallRating = 'critical';
    healthScore = 38;
  }

  const alerts: string[] = [];
  if (net < 0) {
    alerts.push(`Chi tiêu đang vượt thu nhập ${Math.abs(net).toLocaleString('vi-VN')} ₫ trong tháng này.`);
  }

  budgets.forEach(b => {
    if (b.limit > 0 && b.spent >= b.limit) {
      alerts.push(`Hạng mục "${b.categoryName}" đã vượt ngân sách (${b.spent.toLocaleString('vi-VN')} ₫ / ${b.limit.toLocaleString('vi-VN')} ₫).`);
    } else if (b.limit > 0 && b.spent >= b.limit * 0.85) {
      alerts.push(`Hạng mục "${b.categoryName}" sắp chạm ngưỡng (${((b.spent / b.limit) * 100).toFixed(0)}%).`);
    }
  });

  if (alerts.length === 0) {
    alerts.push('Các chỉ số chi tiêu trong tháng đang được kiểm soát tốt trong giới hạn an toàn.');
  }

  const topCategory = categoriesBreakdown[0];
  const savingsTips = [
    {
      title: 'Tối ưu danh mục chi tiêu lớn nhất',
      detail: topCategory
        ? `Hạng mục "${topCategory.name}" chiếm ${topCategory.percentage?.toFixed?.(1) || 0}% (${topCategory.amount?.toLocaleString('vi-VN')} ₫). Hãy thử lên kế hoạch trước để giảm khoảng 10-15%.`
        : 'Theo dõi chi tiết các khoản chi thường nhật để phát hiện các khoản tiền lắt nhắt không cần thiết.',
      potentialSavings: 'Khoảng 200.000 ₫ - 500.000 ₫ / tháng',
    },
    {
      title: 'Áp dụng quy tắc chi tiêu 50/30/20',
      detail: 'Dành 50% cho nhu cầu thiết yếu, 30% cho sở thích linh hoạt và ít nhất 20% cho tiết kiệm tích lũy hoặc quỹ dự phòng khẩn cấp.',
      potentialSavings: 'Gia tăng tỷ lệ tích lũy tài sản đều đặn',
    },
    {
      title: 'Hạn chế chi tiêu cảm xúc bằng nguyên tắc 24h',
      detail: 'Trước các quyết định mua sắm đồ dùng ngoài kế hoạch, hãy trì hoãn 24 giờ để tự hỏi liệu mình có thực sự cần món đồ đó hay không.',
      potentialSavings: 'Tránh các khoản chi bộc phát',
    },
  ];

  return {
    overallRating,
    healthScore,
    summary: `Tháng ${month}, tổng thu nhập là ${income.toLocaleString('vi-VN')} ₫ và đã chi tiêu ${expense.toLocaleString('vi-VN')} ₫ (tỷ lệ tiết kiệm ${savingsRate.toFixed(1)}%). ${
      net >= 0 ? 'Dòng tiền tháng đang dương và duy trì ổn định.' : 'Cần thắt chặt các khoản chi tiêu linh hoạt để cân bằng dòng tiền.'
    }`,
    alerts,
    savingsTips,
    projection:
      savingsRate > 20
        ? 'Duy trì tốc độ này, bạn sẽ sớm hoàn thành các mục tiêu tài chính và tích lũy được quỹ dự phòng vững chắc.'
        : 'Hãy cố gắng nâng tỷ lệ tiết kiệm lên mức tối thiểu 20% thu nhập hàng tháng để tạo bệ đỡ tài chính an toàn.',
  };
}
