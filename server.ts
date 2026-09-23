import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 25MB limit for image attachments & receipts
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to get GoogleGenAI instance safely
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in process.env');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Sleep helper for backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to call Gemini generateContent with 503/429 retry and fallback models
async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
  primaryModel?: string;
  fallbackModel?: string;
}) {
  const ai = getGenAI();
  const models = [
    params.primaryModel || 'gemini-3.8-flash',
    params.fallbackModel || 'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;

  for (const model of models) {
    // Attempt up to 2 tries per model if 503 / 429
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const isUnavailable =
          err?.status === 503 ||
          err?.code === 503 ||
          errMessage.includes('503') ||
          errMessage.includes('high demand') ||
          errMessage.includes('UNAVAILABLE') ||
          errMessage.includes('429') ||
          errMessage.includes('RESOURCE_EXHAUSTED');

        console.warn(`[Gemini API] Model ${model} attempt ${attempt} failed:`, errMessage);

        if (isUnavailable && attempt < 2) {
          await wait(700 * attempt);
          continue;
        }
        // If 503 persists on this model, break to try fallback model
        if (isUnavailable) {
          break;
        }
        // If other fatal error (e.g. invalid arguments), rethrow
        throw err;
      }
    }
  }

  throw lastError;
}

// Deterministic Vietnamese rule-based parser as robust fallback when AI service is 503/unavailable
function fallbackParseVietnameseText(text: string, categories: any[] = [], wallets: any[] = []) {
  const rawText = text.trim();
  const lower = rawText.toLowerCase();
  const today = new Date().toISOString().split('T')[0];

  // 1. Detect Amount
  let amount = 0;
  // Match patterns like "50k", "50 k", "50 nghìn", "50 ngàn", "1.5 triệu", "1 triệu", "2 củ", "2 lít", "3 xị", "50000"
  const millionMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|củ|m\b)/);
  const hundredKMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:lít|lit|xị|xi)/);
  const thousandMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:k\b|nghìn|ngàn|ng)/);
  const plainNumberMatch = lower.match(/\b(\d{4,12})\b/);

  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(',', '.'));
    amount = Math.round(num * 1000000);
  } else if (hundredKMatch) {
    const num = parseFloat(hundredKMatch[1].replace(',', '.'));
    amount = Math.round(num * 100000);
  } else if (thousandMatch) {
    const num = parseFloat(thousandMatch[1].replace(',', '.'));
    amount = Math.round(num * 1000);
  } else if (plainNumberMatch) {
    amount = parseInt(plainNumberMatch[1], 10);
  }

  // 2. Detect Type
  let type: 'expense' | 'income' | 'transfer' = 'expense';
  const isIncome = /lương|thưởng|nhận tiền|được cho|được lì xì|bán|thu tiền|tiền vào|hoàn tiền|cộng tiền/.test(lower);
  const isTransfer = /chuyển khoản|chuyển tiền|chuyển qua|nạp vào|rút tiền/.test(lower);

  if (isIncome) {
    type = 'income';
  } else if (isTransfer) {
    type = 'transfer';
  }

  // 3. Detect Category
  let categoryId = categories[0]?.id;
  for (const cat of categories) {
    const catLower = cat.name.toLowerCase();
    if (
      lower.includes(catLower) ||
      (catLower.includes('ăn') && /ăn|cơm|bún|phở|bánh|sáng|trưa|tối|nhậu|trà|cafe|cà phê/.test(lower)) ||
      (catLower.includes('uống') && /cafe|cà phê|trà|nước|sinh tố|bia/.test(lower)) ||
      (catLower.includes('xe') && /xăng|xe|rửa xe|gửi xe|sửa xe|grab|taxi/.test(lower)) ||
      (catLower.includes('mua') && /mua|siêu thị|chợ|shopee|quần áo|đồ/.test(lower)) ||
      (catLower.includes('nhà') && /tiền nhà|điện|nước|internet|phòng/.test(lower)) ||
      (catLower.includes('lương') && /lương|thưởng|thu nhập/.test(lower))
    ) {
      categoryId = cat.id;
      break;
    }
  }

  // 4. Detect Wallet
  let walletId = wallets[0]?.id;
  for (const w of wallets) {
    const wLower = w.name.toLowerCase();
    if (
      lower.includes(wLower) ||
      (wLower.includes('tiền mặt') && /tiền mặt|tiền ví|ví|túi/.test(lower)) ||
      (wLower.includes('mb') && /mb|mbbank|quân đội/.test(lower)) ||
      (wLower.includes('techcom') && /tcb|techcom/.test(lower)) ||
      (wLower.includes('vietcom') && /vcb|vietcom/.test(lower)) ||
      (wLower.includes('momo') && /momo/.test(lower)) ||
      (wLower.includes('thẻ') && /thẻ|visa|master/.test(lower))
    ) {
      walletId = w.id;
      break;
    }
  }

  // 5. Clean Note
  let note = rawText
    .replace(/(?:vào|bằng|từ|qua)?\s*(?:mb|tcb|vcb|momo|tiền mặt|vietcombank|techcombank|thẻ)\b/gi, '')
    .replace(/\b(?:\d+(?:[.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|củ|m|lít|xị)|\d{4,12})\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!note) {
    note = type === 'income' ? 'Khoản thu' : 'Chi tiêu';
  }

  return {
    amount: amount || 0,
    type,
    date: today,
    note,
    categoryId,
    walletId,
  };
}

// Algorithmic Financial Advisor fallback when Gemini API is experiencing 503
function fallbackFinancialAdvisor(data: {
  month: string;
  income: number;
  expense: number;
  balance: number;
  categoriesBreakdown?: any[];
  budgets?: any[];
}) {
  const { month, income = 0, expense = 0, balance = 0, categoriesBreakdown = [], budgets = [] } = data;
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

  // Check budgets
  budgets.forEach((b: any) => {
    if (b.limit > 0 && b.spent >= b.limit) {
      alerts.push(`Hạng mục "${b.categoryName}" đã vượt ngân sách (${b.spent.toLocaleString('vi-VN')} ₫ / ${b.limit.toLocaleString('vi-VN')} ₫).`);
    } else if (b.limit > 0 && b.spent >= b.limit * 0.85) {
      alerts.push(`Hạng mục "${b.categoryName}" sắp chạm ngưỡng ngân sách (đã tiêu ${(b.spent / b.limit * 100).toFixed(0)}%).`);
    }
  });

  if (alerts.length === 0) {
    alerts.push('Các chỉ số chi tiêu trong tháng đang được kiểm soát rất tốt trong giới hạn cho phép.');
  }

  const topCategory = categoriesBreakdown[0];
  const savingsTips = [
    {
      title: 'Tối ưu danh mục chi tiêu lớn nhất',
      detail: topCategory
        ? `Hạng mục "${topCategory.name}" chiếm ${topCategory.percentage?.toFixed?.(1) || 0}% tổng chi tiêu (${topCategory.amount?.toLocaleString('vi-VN')} ₫). Hãy thử lên kế hoạch trước để giảm khoảng 10-15%.`
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
    summary: `Tháng ${month}, tổng thu nhập của bạn là ${income.toLocaleString('vi-VN')} ₫ và đã chi tiêu ${expense.toLocaleString('vi-VN')} ₫ (tỷ lệ tiết kiệm ${savingsRate.toFixed(1)}%). ${
      net >= 0 ? 'Dòng tiền tháng đang dương và duy trì ổn định.' : 'Cần thắt chặt các khoản chi tiêu linh hoạt để cân bằng dòng tiền.'
    }`,
    alerts,
    savingsTips,
    projection: net >= 0
      ? `Với tốc độ hiện tại, dự kiến cuối tháng bạn sẽ tích lũy thêm khoảng ${net.toLocaleString('vi-VN')} ₫ vào các ví tiết kiệm.`
      : `Dự báo cuối tháng có thể bị âm dòng tiền khoảng ${Math.abs(net).toLocaleString('vi-VN')} ₫ nếu không điều chỉnh các khoản chi tùy ý.`,
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Smart Receipt / Transfer Screenshot OCR
app.post('/api/gemini/parse-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', categories = [], wallets = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Hình ảnh hóa đơn không được để trống' });
    }

    const categoryListStr = categories.map((c: any) => `${c.id}: ${c.name}`).join(', ');
    const walletListStr = wallets.map((w: any) => `${w.id}: ${w.name}`).join(', ');

    const prompt = `Bạn là chuyên gia phân tích hóa đơn và biên lai chuyển khoản ngân hàng Việt Nam.
Hãy phân tích hình ảnh đính kèm (hóa đơn siêu thị, nhà hàng, cây xăng, hoặc ảnh chụp màn hình chuyển khoản ngân hàng/ví điện tử Vietcombank, Techcombank, MB, Momo, ZaloPay, v.v.).

Danh mục hiện có trong ứng dụng: [${categoryListStr}]
Ví thanh toán hiện có trong ứng dụng: [${walletListStr}]

Quy tắc:
1. Xác định số tiền giao dịch chính xác (amount tính theo VNĐ, là số nguyên dương).
2. Xác định loại: 'expense' (chi tiêu - mặc định khi mua sắm, ăn uống, trả tiền) hoặc 'income' (tiền vào/nhận tiền).
3. Đọc ngày giờ giao dịch nếu có trên hóa đơn/biên lai (định dạng date YYYY-MM-DD, time HH:mm). Nếu không rõ ngày, trả về ngày hôm nay: ${new Date().toISOString().split('T')[0]}.
4. Ghi chú (note): Tên cửa hàng/người nhận/nội dung giao dịch ngắn gọn (ví dụ: "WinMart Vincom", "Highlands Coffee", "Chuyển tiền ăn trưa").
5. Chọn categoryId phù hợp nhất từ danh sách danh mục trên. Nếu không có danh mục khớp, để trống hoặc chọn danh mục "Khác".
6. Chọn walletId phù hợp nhất từ danh sách ví trên nếu ảnh là màn hình ngân hàng/ví điện tử (ví dụ Momo, MB Bank, Tiền mặt).
7. Liệt kê các món hàng (items) nếu là hóa đơn mua sắm chi tiết.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await callGeminiWithFallback({
      primaryModel: 'gemini-3.8-flash',
      fallbackModel: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'Số tiền giao dịch (VNĐ)' },
            type: { type: Type.STRING, description: "Loại: 'expense' hoặc 'income'" },
            date: { type: Type.STRING, description: 'Ngày giao dịch định dạng YYYY-MM-DD' },
            time: { type: Type.STRING, description: 'Giờ giao dịch định dạng HH:mm' },
            note: { type: Type.STRING, description: 'Tên đối tác hoặc mô tả chi tiêu' },
            categoryId: { type: Type.STRING, description: 'ID danh mục phù hợp nhất từ danh sách' },
            categoryName: { type: Type.STRING, description: 'Tên danh mục đề xuất' },
            walletId: { type: Type.STRING, description: 'ID ví thanh toán nếu nhận diện được ngân hàng/ví' },
            confidence: { type: Type.NUMBER, description: 'Độ tin cậy từ 0 đến 1' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                },
              },
              description: 'Danh sách các mặt hàng nếu có',
            },
          },
          required: ['amount', 'type', 'date', 'note'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Error parsing receipt with Gemini:', error);
    const isOverloaded = error?.status === 503 || error?.code === 503 || String(error?.message).includes('503');
    return res.status(isOverloaded ? 503 : 500).json({
      error: isOverloaded
        ? 'Dịch vụ AI đang quá tải tạm thời (503). Vui lòng thử lại sau vài giây hoặc nhập thủ công.'
        : (error.message || 'Không thể nhận diện hóa đơn'),
    });
  }
});

// 2. Natural Language / Voice Text Transaction Parser
app.post('/api/gemini/parse-text', async (req, res) => {
  const { text, categories = [], wallets = [] } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Nội dung văn bản không được để trống' });
  }

  try {
    const categoryListStr = categories.map((c: any) => `${c.id}: ${c.name}`).join(', ');
    const walletListStr = wallets.map((w: any) => `${w.id}: ${w.name}`).join(', ');
    const today = new Date().toISOString().split('T')[0];

    const prompt = `Bạn là trợ lý ghi chép tài chính thông minh cho ứng dụng Sổ Chi Tiêu.
Người dùng vừa nói hoặc nhập câu: "${text}".

Danh mục khả dụng: [${categoryListStr}]
Ví khả dụng: [${walletListStr}]
Hôm nay là: ${today}

Quy tắc:
1. Bóc tách số tiền (amount): Ví dụ 40k = 40000, 1 củ / 1 triệu = 1000000, 50 nghìn = 50000, 2 lít = 200000, 3 xị = 300000.
2. Xác định loại (type): 'expense' (chi tiêu - mua, ăn, trả, đổ xăng, shopping), 'income' (thu nhập - nhận lương, thưởng, bán đồ, được lì xì), hoặc 'transfer' (chuyển tiền giữa các ví).
3. Tìm categoryId và walletId khớp nhất dựa theo câu nói.
4. Ghi chú (note): Mô tả ngắn gọn nội dung chi tiêu.
5. Ngày (date): Định dạng YYYY-MM-DD. Nếu nói "hôm qua" thì lùi 1 ngày so với ${today}, mặc định là ${today}.`;

    const response = await callGeminiWithFallback({
      primaryModel: 'gemini-3.8-flash',
      fallbackModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: 'Số tiền bằng số' },
            type: { type: Type.STRING, description: "'expense', 'income' hoặc 'transfer'" },
            categoryId: { type: Type.STRING, description: 'ID danh mục khớp nhất' },
            walletId: { type: Type.STRING, description: 'ID ví thanh toán khớp nhất' },
            date: { type: Type.STRING, description: 'Ngày YYYY-MM-DD' },
            note: { type: Type.STRING, description: 'Ghi chú mô tả' },
          },
          required: ['amount', 'type', 'date', 'note'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.warn('Gemini parse text failed, activating deterministic Vietnamese fallback parser:', error?.message || error);
    // Graceful offline/fallback parser: ensures user's voice and text transactions succeed even during 503 high demand
    try {
      const fallbackResult = fallbackParseVietnameseText(text, categories, wallets);
      return res.json({
        success: true,
        data: fallbackResult,
        isFallback: true,
      });
    } catch (fallbackErr: any) {
      console.error('Fallback parser error:', fallbackErr);
      return res.status(500).json({
        error: error?.message || 'Không thể bóc tách nội dung giao dịch',
      });
    }
  }
});

// 3. AI Financial Advisor & Smart Spending Analysis
app.post('/api/gemini/financial-advisor', async (req, res) => {
  const {
    month,
    income = 0,
    expense = 0,
    balance = 0,
    categoriesBreakdown = [],
    budgets = [],
    topTransactions = [],
  } = req.body;

  try {
    const prompt = `Bạn là Chuyên gia Tư vấn Tài chính Cá nhân thông minh cho ứng dụng Sổ Chi Tiêu Android.
Hãy phân tích bức tranh tài chính tháng ${month} của người dùng dựa trên số liệu thực tế sau:

- Tổng thu nhập tháng: ${income.toLocaleString('vi-VN')} VNĐ
- Tổng chi tiêu tháng: ${expense.toLocaleString('vi-VN')} VNĐ
- Dư nợ ròng tháng (Thu - Chi): ${(income - expense).toLocaleString('vi-VN')} VNĐ
- Tổng số dư tích lũy hiện có trong các ví: ${balance.toLocaleString('vi-VN')} VNĐ

Chi tiêu chi tiết theo từng danh mục:
${JSON.stringify(categoriesBreakdown, null, 2)}

Ngân sách đã thiết lập:
${JSON.stringify(budgets, null, 2)}

Các giao dịch lớn đáng chú ý:
${JSON.stringify(topTransactions.slice(0, 10), null, 2)}

Yêu cầu đầu ra:
1. Đánh giá tổng quan sức khỏe tài chính tháng (overallRating: 'excellent' | 'good' | 'warning' | 'critical').
2. Tóm tắt ngắn gọn tình hình (summary): 2-3 câu đánh giá khách quan, văn phong thân thiện, khích lệ.
3. Cảnh báo các khoản chi tiêu bất thường hoặc sát/vượt ngân sách (alerts): Danh sách các điểm cần lưu ý.
4. Gợi ý tiết kiệm thực tế (savingsTips): 3 đến 4 mẹo cụ thể, gắn liền với các khoản chi thực tế của người dùng để giảm chi phí mà không làm giảm chất lượng cuộc sống.
5. Dự báo kết quả cuối tháng (projection): Nhận định nếu tiếp tục tốc độ chi tiêu này thì cuối tháng sẽ dư hay thiếu bao nhiêu.`;

    const response = await callGeminiWithFallback({
      primaryModel: 'gemini-3.8-flash',
      fallbackModel: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRating: {
              type: Type.STRING,
              description: "'excellent', 'good', 'warning', hoặc 'critical'",
            },
            healthScore: {
              type: Type.NUMBER,
              description: 'Điểm sức khỏe tài chính từ 0 đến 100',
            },
            summary: {
              type: Type.STRING,
              description: 'Đánh giá tổng quát 2-3 câu',
            },
            alerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Các điểm chi tiêu bất thường hoặc vượt hạn mức',
            },
            savingsTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Tiêu đề mẹo tiết kiệm' },
                  detail: { type: Type.STRING, description: 'Chi tiết hành động cụ thể' },
                  potentialSavings: { type: Type.STRING, description: 'Ước tính số tiền có thể tiết kiệm' },
                },
                required: ['title', 'detail'],
              },
            },
            projection: {
              type: Type.STRING,
              description: 'Dự báo tài chính cuối tháng',
            },
          },
          required: ['overallRating', 'healthScore', 'summary', 'alerts', 'savingsTips', 'projection'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.warn('Gemini financial advisor failed, using algorithmic fallback:', error?.message || error);
    // Algorithmic fallback ensures the user always gets a financial health report
    const fallbackData = fallbackFinancialAdvisor({
      month,
      income,
      expense,
      balance,
      categoriesBreakdown,
      budgets,
    });
    return res.json({ success: true, data: fallbackData, isFallback: true });
  }
});

// Vite Middleware for Development / Static serving for Production
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Expense Server running on http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error('Failed to start server:', err);
});
