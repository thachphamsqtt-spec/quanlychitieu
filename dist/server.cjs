"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "25mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "25mb" }));
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in process.env");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function callGeminiWithFallback(params) {
  const ai = getGenAI();
  const models = [
    params.primaryModel || "gemini-3.8-flash",
    params.fallbackModel || "gemini-3.1-flash-lite"
  ];
  let lastError = null;
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config
        });
        return response;
      } catch (err) {
        lastError = err;
        const errMessage = err?.message || String(err);
        const isUnavailable = err?.status === 503 || err?.code === 503 || errMessage.includes("503") || errMessage.includes("high demand") || errMessage.includes("UNAVAILABLE") || errMessage.includes("429") || errMessage.includes("RESOURCE_EXHAUSTED");
        console.warn(`[Gemini API] Model ${model} attempt ${attempt} failed:`, errMessage);
        if (isUnavailable && attempt < 2) {
          await wait(700 * attempt);
          continue;
        }
        if (isUnavailable) {
          break;
        }
        throw err;
      }
    }
  }
  throw lastError;
}
function fallbackParseVietnameseText(text, categories = [], wallets = []) {
  const rawText = text.trim();
  const lower = rawText.toLowerCase();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let amount = 0;
  const millionMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|củ|m\b)/);
  const hundredKMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:lít|lit|xị|xi)/);
  const thousandMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:k\b|nghìn|ngàn|ng)/);
  const plainNumberMatch = lower.match(/\b(\d{4,12})\b/);
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(",", "."));
    amount = Math.round(num * 1e6);
  } else if (hundredKMatch) {
    const num = parseFloat(hundredKMatch[1].replace(",", "."));
    amount = Math.round(num * 1e5);
  } else if (thousandMatch) {
    const num = parseFloat(thousandMatch[1].replace(",", "."));
    amount = Math.round(num * 1e3);
  } else if (plainNumberMatch) {
    amount = parseInt(plainNumberMatch[1], 10);
  }
  let type = "expense";
  const isIncome = /lương|thưởng|nhận tiền|được cho|được lì xì|bán|thu tiền|tiền vào|hoàn tiền|cộng tiền/.test(lower);
  const isTransfer = /chuyển khoản|chuyển tiền|chuyển qua|nạp vào|rút tiền/.test(lower);
  if (isIncome) {
    type = "income";
  } else if (isTransfer) {
    type = "transfer";
  }
  let categoryId = categories[0]?.id;
  for (const cat of categories) {
    const catLower = cat.name.toLowerCase();
    if (lower.includes(catLower) || catLower.includes("\u0103n") && /ăn|cơm|bún|phở|bánh|sáng|trưa|tối|nhậu|trà|cafe|cà phê/.test(lower) || catLower.includes("u\u1ED1ng") && /cafe|cà phê|trà|nước|sinh tố|bia/.test(lower) || catLower.includes("xe") && /xăng|xe|rửa xe|gửi xe|sửa xe|grab|taxi/.test(lower) || catLower.includes("mua") && /mua|siêu thị|chợ|shopee|quần áo|đồ/.test(lower) || catLower.includes("nh\xE0") && /tiền nhà|điện|nước|internet|phòng/.test(lower) || catLower.includes("l\u01B0\u01A1ng") && /lương|thưởng|thu nhập/.test(lower)) {
      categoryId = cat.id;
      break;
    }
  }
  let walletId = wallets[0]?.id;
  for (const w of wallets) {
    const wLower = w.name.toLowerCase();
    if (lower.includes(wLower) || wLower.includes("ti\u1EC1n m\u1EB7t") && /tiền mặt|tiền ví|ví|túi/.test(lower) || wLower.includes("mb") && /mb|mbbank|quân đội/.test(lower) || wLower.includes("techcom") && /tcb|techcom/.test(lower) || wLower.includes("vietcom") && /vcb|vietcom/.test(lower) || wLower.includes("momo") && /momo/.test(lower) || wLower.includes("th\u1EBB") && /thẻ|visa|master/.test(lower)) {
      walletId = w.id;
      break;
    }
  }
  let note = rawText.replace(/(?:vào|bằng|từ|qua)?\s*(?:mb|tcb|vcb|momo|tiền mặt|vietcombank|techcombank|thẻ)\b/gi, "").replace(/\b(?:\d+(?:[.,]\d+)?\s*(?:k|nghìn|ngàn|triệu|tr|củ|m|lít|xị)|\d{4,12})\b/gi, "").replace(/\s+/g, " ").trim();
  if (!note) {
    note = type === "income" ? "Kho\u1EA3n thu" : "Chi ti\xEAu";
  }
  return {
    amount: amount || 0,
    type,
    date: today,
    note,
    categoryId,
    walletId
  };
}
function fallbackFinancialAdvisor(data) {
  const { month, income = 0, expense = 0, balance = 0, categoriesBreakdown = [], budgets = [] } = data;
  const net = income - expense;
  const savingsRate = income > 0 ? net / income * 100 : 0;
  let overallRating = "good";
  let healthScore = 75;
  if (savingsRate >= 30) {
    overallRating = "excellent";
    healthScore = 92;
  } else if (savingsRate >= 15) {
    overallRating = "good";
    healthScore = 78;
  } else if (savingsRate >= 0) {
    overallRating = "warning";
    healthScore = 58;
  } else {
    overallRating = "critical";
    healthScore = 38;
  }
  const alerts = [];
  if (net < 0) {
    alerts.push(`Chi ti\xEAu \u0111ang v\u01B0\u1EE3t thu nh\u1EADp ${Math.abs(net).toLocaleString("vi-VN")} \u20AB trong th\xE1ng n\xE0y.`);
  }
  budgets.forEach((b) => {
    if (b.limit > 0 && b.spent >= b.limit) {
      alerts.push(`H\u1EA1ng m\u1EE5c "${b.categoryName}" \u0111\xE3 v\u01B0\u1EE3t ng\xE2n s\xE1ch (${b.spent.toLocaleString("vi-VN")} \u20AB / ${b.limit.toLocaleString("vi-VN")} \u20AB).`);
    } else if (b.limit > 0 && b.spent >= b.limit * 0.85) {
      alerts.push(`H\u1EA1ng m\u1EE5c "${b.categoryName}" s\u1EAFp ch\u1EA1m ng\u01B0\u1EE1ng ng\xE2n s\xE1ch (\u0111\xE3 ti\xEAu ${(b.spent / b.limit * 100).toFixed(0)}%).`);
    }
  });
  if (alerts.length === 0) {
    alerts.push("C\xE1c ch\u1EC9 s\u1ED1 chi ti\xEAu trong th\xE1ng \u0111ang \u0111\u01B0\u1EE3c ki\u1EC3m so\xE1t r\u1EA5t t\u1ED1t trong gi\u1EDBi h\u1EA1n cho ph\xE9p.");
  }
  const topCategory = categoriesBreakdown[0];
  const savingsTips = [
    {
      title: "T\u1ED1i \u01B0u danh m\u1EE5c chi ti\xEAu l\u1EDBn nh\u1EA5t",
      detail: topCategory ? `H\u1EA1ng m\u1EE5c "${topCategory.name}" chi\u1EBFm ${topCategory.percentage?.toFixed?.(1) || 0}% t\u1ED5ng chi ti\xEAu (${topCategory.amount?.toLocaleString("vi-VN")} \u20AB). H\xE3y th\u1EED l\xEAn k\u1EBF ho\u1EA1ch tr\u01B0\u1EDBc \u0111\u1EC3 gi\u1EA3m kho\u1EA3ng 10-15%.` : "Theo d\xF5i chi ti\u1EBFt c\xE1c kho\u1EA3n chi th\u01B0\u1EDDng nh\u1EADt \u0111\u1EC3 ph\xE1t hi\u1EC7n c\xE1c kho\u1EA3n ti\u1EC1n l\u1EAFt nh\u1EAFt kh\xF4ng c\u1EA7n thi\u1EBFt.",
      potentialSavings: "Kho\u1EA3ng 200.000 \u20AB - 500.000 \u20AB / th\xE1ng"
    },
    {
      title: "\xC1p d\u1EE5ng quy t\u1EAFc chi ti\xEAu 50/30/20",
      detail: "D\xE0nh 50% cho nhu c\u1EA7u thi\u1EBFt y\u1EBFu, 30% cho s\u1EDF th\xEDch linh ho\u1EA1t v\xE0 \xEDt nh\u1EA5t 20% cho ti\u1EBFt ki\u1EC7m t\xEDch l\u0169y ho\u1EB7c qu\u1EF9 d\u1EF1 ph\xF2ng kh\u1EA9n c\u1EA5p.",
      potentialSavings: "Gia t\u0103ng t\u1EF7 l\u1EC7 t\xEDch l\u0169y t\xE0i s\u1EA3n \u0111\u1EC1u \u0111\u1EB7n"
    },
    {
      title: "H\u1EA1n ch\u1EBF chi ti\xEAu c\u1EA3m x\xFAc b\u1EB1ng nguy\xEAn t\u1EAFc 24h",
      detail: "Tr\u01B0\u1EDBc c\xE1c quy\u1EBFt \u0111\u1ECBnh mua s\u1EAFm \u0111\u1ED3 d\xF9ng ngo\xE0i k\u1EBF ho\u1EA1ch, h\xE3y tr\xEC ho\xE3n 24 gi\u1EDD \u0111\u1EC3 t\u1EF1 h\u1ECFi li\u1EC7u m\xECnh c\xF3 th\u1EF1c s\u1EF1 c\u1EA7n m\xF3n \u0111\u1ED3 \u0111\xF3 hay kh\xF4ng.",
      potentialSavings: "Tr\xE1nh c\xE1c kho\u1EA3n chi b\u1ED9c ph\xE1t"
    }
  ];
  return {
    overallRating,
    healthScore,
    summary: `Th\xE1ng ${month}, t\u1ED5ng thu nh\u1EADp c\u1EE7a b\u1EA1n l\xE0 ${income.toLocaleString("vi-VN")} \u20AB v\xE0 \u0111\xE3 chi ti\xEAu ${expense.toLocaleString("vi-VN")} \u20AB (t\u1EF7 l\u1EC7 ti\u1EBFt ki\u1EC7m ${savingsRate.toFixed(1)}%). ${net >= 0 ? "D\xF2ng ti\u1EC1n th\xE1ng \u0111ang d\u01B0\u01A1ng v\xE0 duy tr\xEC \u1ED5n \u0111\u1ECBnh." : "C\u1EA7n th\u1EAFt ch\u1EB7t c\xE1c kho\u1EA3n chi ti\xEAu linh ho\u1EA1t \u0111\u1EC3 c\xE2n b\u1EB1ng d\xF2ng ti\u1EC1n."}`,
    alerts,
    savingsTips,
    projection: net >= 0 ? `V\u1EDBi t\u1ED1c \u0111\u1ED9 hi\u1EC7n t\u1EA1i, d\u1EF1 ki\u1EBFn cu\u1ED1i th\xE1ng b\u1EA1n s\u1EBD t\xEDch l\u0169y th\xEAm kho\u1EA3ng ${net.toLocaleString("vi-VN")} \u20AB v\xE0o c\xE1c v\xED ti\u1EBFt ki\u1EC7m.` : `D\u1EF1 b\xE1o cu\u1ED1i th\xE1ng c\xF3 th\u1EC3 b\u1ECB \xE2m d\xF2ng ti\u1EC1n kho\u1EA3ng ${Math.abs(net).toLocaleString("vi-VN")} \u20AB n\u1EBFu kh\xF4ng \u0111i\u1EC1u ch\u1EC9nh c\xE1c kho\u1EA3n chi t\xF9y \xFD.`
  };
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/gemini/parse-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", categories = [], wallets = [] } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "H\xECnh \u1EA3nh h\xF3a \u0111\u01A1n kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng" });
    }
    const categoryListStr = categories.map((c) => `${c.id}: ${c.name}`).join(", ");
    const walletListStr = wallets.map((w) => `${w.id}: ${w.name}`).join(", ");
    const prompt = `B\u1EA1n l\xE0 chuy\xEAn gia ph\xE2n t\xEDch h\xF3a \u0111\u01A1n v\xE0 bi\xEAn lai chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng Vi\u1EC7t Nam.
H\xE3y ph\xE2n t\xEDch h\xECnh \u1EA3nh \u0111\xEDnh k\xE8m (h\xF3a \u0111\u01A1n si\xEAu th\u1ECB, nh\xE0 h\xE0ng, c\xE2y x\u0103ng, ho\u1EB7c \u1EA3nh ch\u1EE5p m\xE0n h\xECnh chuy\u1EC3n kho\u1EA3n ng\xE2n h\xE0ng/v\xED \u0111i\u1EC7n t\u1EED Vietcombank, Techcombank, MB, Momo, ZaloPay, v.v.).

Danh m\u1EE5c hi\u1EC7n c\xF3 trong \u1EE9ng d\u1EE5ng: [${categoryListStr}]
V\xED thanh to\xE1n hi\u1EC7n c\xF3 trong \u1EE9ng d\u1EE5ng: [${walletListStr}]

Quy t\u1EAFc:
1. X\xE1c \u0111\u1ECBnh s\u1ED1 ti\u1EC1n giao d\u1ECBch ch\xEDnh x\xE1c (amount t\xEDnh theo VN\u0110, l\xE0 s\u1ED1 nguy\xEAn d\u01B0\u01A1ng).
2. X\xE1c \u0111\u1ECBnh lo\u1EA1i: 'expense' (chi ti\xEAu - m\u1EB7c \u0111\u1ECBnh khi mua s\u1EAFm, \u0103n u\u1ED1ng, tr\u1EA3 ti\u1EC1n) ho\u1EB7c 'income' (ti\u1EC1n v\xE0o/nh\u1EADn ti\u1EC1n).
3. \u0110\u1ECDc ng\xE0y gi\u1EDD giao d\u1ECBch n\u1EBFu c\xF3 tr\xEAn h\xF3a \u0111\u01A1n/bi\xEAn lai (\u0111\u1ECBnh d\u1EA1ng date YYYY-MM-DD, time HH:mm). N\u1EBFu kh\xF4ng r\xF5 ng\xE0y, tr\u1EA3 v\u1EC1 ng\xE0y h\xF4m nay: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.
4. Ghi ch\xFA (note): T\xEAn c\u1EEDa h\xE0ng/ng\u01B0\u1EDDi nh\u1EADn/n\u1ED9i dung giao d\u1ECBch ng\u1EAFn g\u1ECDn (v\xED d\u1EE5: "WinMart Vincom", "Highlands Coffee", "Chuy\u1EC3n ti\u1EC1n \u0103n tr\u01B0a").
5. Ch\u1ECDn categoryId ph\xF9 h\u1EE3p nh\u1EA5t t\u1EEB danh s\xE1ch danh m\u1EE5c tr\xEAn. N\u1EBFu kh\xF4ng c\xF3 danh m\u1EE5c kh\u1EDBp, \u0111\u1EC3 tr\u1ED1ng ho\u1EB7c ch\u1ECDn danh m\u1EE5c "Kh\xE1c".
6. Ch\u1ECDn walletId ph\xF9 h\u1EE3p nh\u1EA5t t\u1EEB danh s\xE1ch v\xED tr\xEAn n\u1EBFu \u1EA3nh l\xE0 m\xE0n h\xECnh ng\xE2n h\xE0ng/v\xED \u0111i\u1EC7n t\u1EED (v\xED d\u1EE5 Momo, MB Bank, Ti\u1EC1n m\u1EB7t).
7. Li\u1EC7t k\xEA c\xE1c m\xF3n h\xE0ng (items) n\u1EBFu l\xE0 h\xF3a \u0111\u01A1n mua s\u1EAFm chi ti\u1EBFt.`;
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const response = await callGeminiWithFallback({
      primaryModel: "gemini-3.8-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            amount: { type: import_genai.Type.NUMBER, description: "S\u1ED1 ti\u1EC1n giao d\u1ECBch (VN\u0110)" },
            type: { type: import_genai.Type.STRING, description: "Lo\u1EA1i: 'expense' ho\u1EB7c 'income'" },
            date: { type: import_genai.Type.STRING, description: "Ng\xE0y giao d\u1ECBch \u0111\u1ECBnh d\u1EA1ng YYYY-MM-DD" },
            time: { type: import_genai.Type.STRING, description: "Gi\u1EDD giao d\u1ECBch \u0111\u1ECBnh d\u1EA1ng HH:mm" },
            note: { type: import_genai.Type.STRING, description: "T\xEAn \u0111\u1ED1i t\xE1c ho\u1EB7c m\xF4 t\u1EA3 chi ti\xEAu" },
            categoryId: { type: import_genai.Type.STRING, description: "ID danh m\u1EE5c ph\xF9 h\u1EE3p nh\u1EA5t t\u1EEB danh s\xE1ch" },
            categoryName: { type: import_genai.Type.STRING, description: "T\xEAn danh m\u1EE5c \u0111\u1EC1 xu\u1EA5t" },
            walletId: { type: import_genai.Type.STRING, description: "ID v\xED thanh to\xE1n n\u1EBFu nh\u1EADn di\u1EC7n \u0111\u01B0\u1EE3c ng\xE2n h\xE0ng/v\xED" },
            confidence: { type: import_genai.Type.NUMBER, description: "\u0110\u1ED9 tin c\u1EADy t\u1EEB 0 \u0111\u1EBFn 1" },
            items: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  name: { type: import_genai.Type.STRING },
                  price: { type: import_genai.Type.NUMBER }
                }
              },
              description: "Danh s\xE1ch c\xE1c m\u1EB7t h\xE0ng n\u1EBFu c\xF3"
            }
          },
          required: ["amount", "type", "date", "note"]
        }
      }
    });
    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedJson });
  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    const isOverloaded = error?.status === 503 || error?.code === 503 || String(error?.message).includes("503");
    return res.status(isOverloaded ? 503 : 500).json({
      error: isOverloaded ? "D\u1ECBch v\u1EE5 AI \u0111ang qu\xE1 t\u1EA3i t\u1EA1m th\u1EDDi (503). Vui l\xF2ng th\u1EED l\u1EA1i sau v\xE0i gi\xE2y ho\u1EB7c nh\u1EADp th\u1EE7 c\xF4ng." : error.message || "Kh\xF4ng th\u1EC3 nh\u1EADn di\u1EC7n h\xF3a \u0111\u01A1n"
    });
  }
});
app.post("/api/gemini/parse-text", async (req, res) => {
  const { text, categories = [], wallets = [] } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "N\u1ED9i dung v\u0103n b\u1EA3n kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng" });
  }
  try {
    const categoryListStr = categories.map((c) => `${c.id}: ${c.name}`).join(", ");
    const walletListStr = wallets.map((w) => `${w.id}: ${w.name}`).join(", ");
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const prompt = `B\u1EA1n l\xE0 tr\u1EE3 l\xFD ghi ch\xE9p t\xE0i ch\xEDnh th\xF4ng minh cho \u1EE9ng d\u1EE5ng S\u1ED5 Chi Ti\xEAu.
Ng\u01B0\u1EDDi d\xF9ng v\u1EEBa n\xF3i ho\u1EB7c nh\u1EADp c\xE2u: "${text}".

Danh m\u1EE5c kh\u1EA3 d\u1EE5ng: [${categoryListStr}]
V\xED kh\u1EA3 d\u1EE5ng: [${walletListStr}]
H\xF4m nay l\xE0: ${today}

Quy t\u1EAFc:
1. B\xF3c t\xE1ch s\u1ED1 ti\u1EC1n (amount): V\xED d\u1EE5 40k = 40000, 1 c\u1EE7 / 1 tri\u1EC7u = 1000000, 50 ngh\xECn = 50000, 2 l\xEDt = 200000, 3 x\u1ECB = 300000.
2. X\xE1c \u0111\u1ECBnh lo\u1EA1i (type): 'expense' (chi ti\xEAu - mua, \u0103n, tr\u1EA3, \u0111\u1ED5 x\u0103ng, shopping), 'income' (thu nh\u1EADp - nh\u1EADn l\u01B0\u01A1ng, th\u01B0\u1EDFng, b\xE1n \u0111\u1ED3, \u0111\u01B0\u1EE3c l\xEC x\xEC), ho\u1EB7c 'transfer' (chuy\u1EC3n ti\u1EC1n gi\u1EEFa c\xE1c v\xED).
3. T\xECm categoryId v\xE0 walletId kh\u1EDBp nh\u1EA5t d\u1EF1a theo c\xE2u n\xF3i.
4. Ghi ch\xFA (note): M\xF4 t\u1EA3 ng\u1EAFn g\u1ECDn n\u1ED9i dung chi ti\xEAu.
5. Ng\xE0y (date): \u0110\u1ECBnh d\u1EA1ng YYYY-MM-DD. N\u1EBFu n\xF3i "h\xF4m qua" th\xEC l\xF9i 1 ng\xE0y so v\u1EDBi ${today}, m\u1EB7c \u0111\u1ECBnh l\xE0 ${today}.`;
    const response = await callGeminiWithFallback({
      primaryModel: "gemini-3.8-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            amount: { type: import_genai.Type.NUMBER, description: "S\u1ED1 ti\u1EC1n b\u1EB1ng s\u1ED1" },
            type: { type: import_genai.Type.STRING, description: "'expense', 'income' ho\u1EB7c 'transfer'" },
            categoryId: { type: import_genai.Type.STRING, description: "ID danh m\u1EE5c kh\u1EDBp nh\u1EA5t" },
            walletId: { type: import_genai.Type.STRING, description: "ID v\xED thanh to\xE1n kh\u1EDBp nh\u1EA5t" },
            date: { type: import_genai.Type.STRING, description: "Ng\xE0y YYYY-MM-DD" },
            note: { type: import_genai.Type.STRING, description: "Ghi ch\xFA m\xF4 t\u1EA3" }
          },
          required: ["amount", "type", "date", "note"]
        }
      }
    });
    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedJson });
  } catch (error) {
    console.warn("Gemini parse text failed, activating deterministic Vietnamese fallback parser:", error?.message || error);
    try {
      const fallbackResult = fallbackParseVietnameseText(text, categories, wallets);
      return res.json({
        success: true,
        data: fallbackResult,
        isFallback: true
      });
    } catch (fallbackErr) {
      console.error("Fallback parser error:", fallbackErr);
      return res.status(500).json({
        error: error?.message || "Kh\xF4ng th\u1EC3 b\xF3c t\xE1ch n\u1ED9i dung giao d\u1ECBch"
      });
    }
  }
});
app.post("/api/gemini/financial-advisor", async (req, res) => {
  const {
    month,
    income = 0,
    expense = 0,
    balance = 0,
    categoriesBreakdown = [],
    budgets = [],
    topTransactions = []
  } = req.body;
  try {
    const prompt = `B\u1EA1n l\xE0 Chuy\xEAn gia T\u01B0 v\u1EA5n T\xE0i ch\xEDnh C\xE1 nh\xE2n th\xF4ng minh cho \u1EE9ng d\u1EE5ng S\u1ED5 Chi Ti\xEAu Android.
H\xE3y ph\xE2n t\xEDch b\u1EE9c tranh t\xE0i ch\xEDnh th\xE1ng ${month} c\u1EE7a ng\u01B0\u1EDDi d\xF9ng d\u1EF1a tr\xEAn s\u1ED1 li\u1EC7u th\u1EF1c t\u1EBF sau:

- T\u1ED5ng thu nh\u1EADp th\xE1ng: ${income.toLocaleString("vi-VN")} VN\u0110
- T\u1ED5ng chi ti\xEAu th\xE1ng: ${expense.toLocaleString("vi-VN")} VN\u0110
- D\u01B0 n\u1EE3 r\xF2ng th\xE1ng (Thu - Chi): ${(income - expense).toLocaleString("vi-VN")} VN\u0110
- T\u1ED5ng s\u1ED1 d\u01B0 t\xEDch l\u0169y hi\u1EC7n c\xF3 trong c\xE1c v\xED: ${balance.toLocaleString("vi-VN")} VN\u0110

Chi ti\xEAu chi ti\u1EBFt theo t\u1EEBng danh m\u1EE5c:
${JSON.stringify(categoriesBreakdown, null, 2)}

Ng\xE2n s\xE1ch \u0111\xE3 thi\u1EBFt l\u1EADp:
${JSON.stringify(budgets, null, 2)}

C\xE1c giao d\u1ECBch l\u1EDBn \u0111\xE1ng ch\xFA \xFD:
${JSON.stringify(topTransactions.slice(0, 10), null, 2)}

Y\xEAu c\u1EA7u \u0111\u1EA7u ra:
1. \u0110\xE1nh gi\xE1 t\u1ED5ng quan s\u1EE9c kh\u1ECFe t\xE0i ch\xEDnh th\xE1ng (overallRating: 'excellent' | 'good' | 'warning' | 'critical').
2. T\xF3m t\u1EAFt ng\u1EAFn g\u1ECDn t\xECnh h\xECnh (summary): 2-3 c\xE2u \u0111\xE1nh gi\xE1 kh\xE1ch quan, v\u0103n phong th\xE2n thi\u1EC7n, kh\xEDch l\u1EC7.
3. C\u1EA3nh b\xE1o c\xE1c kho\u1EA3n chi ti\xEAu b\u1EA5t th\u01B0\u1EDDng ho\u1EB7c s\xE1t/v\u01B0\u1EE3t ng\xE2n s\xE1ch (alerts): Danh s\xE1ch c\xE1c \u0111i\u1EC3m c\u1EA7n l\u01B0u \xFD.
4. G\u1EE3i \xFD ti\u1EBFt ki\u1EC7m th\u1EF1c t\u1EBF (savingsTips): 3 \u0111\u1EBFn 4 m\u1EB9o c\u1EE5 th\u1EC3, g\u1EAFn li\u1EC1n v\u1EDBi c\xE1c kho\u1EA3n chi th\u1EF1c t\u1EBF c\u1EE7a ng\u01B0\u1EDDi d\xF9ng \u0111\u1EC3 gi\u1EA3m chi ph\xED m\xE0 kh\xF4ng l\xE0m gi\u1EA3m ch\u1EA5t l\u01B0\u1EE3ng cu\u1ED9c s\u1ED1ng.
5. D\u1EF1 b\xE1o k\u1EBFt qu\u1EA3 cu\u1ED1i th\xE1ng (projection): Nh\u1EADn \u0111\u1ECBnh n\u1EBFu ti\u1EBFp t\u1EE5c t\u1ED1c \u0111\u1ED9 chi ti\xEAu n\xE0y th\xEC cu\u1ED1i th\xE1ng s\u1EBD d\u01B0 hay thi\u1EBFu bao nhi\xEAu.`;
    const response = await callGeminiWithFallback({
      primaryModel: "gemini-3.8-flash",
      fallbackModel: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            overallRating: {
              type: import_genai.Type.STRING,
              description: "'excellent', 'good', 'warning', ho\u1EB7c 'critical'"
            },
            healthScore: {
              type: import_genai.Type.NUMBER,
              description: "\u0110i\u1EC3m s\u1EE9c kh\u1ECFe t\xE0i ch\xEDnh t\u1EEB 0 \u0111\u1EBFn 100"
            },
            summary: {
              type: import_genai.Type.STRING,
              description: "\u0110\xE1nh gi\xE1 t\u1ED5ng qu\xE1t 2-3 c\xE2u"
            },
            alerts: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING },
              description: "C\xE1c \u0111i\u1EC3m chi ti\xEAu b\u1EA5t th\u01B0\u1EDDng ho\u1EB7c v\u01B0\u1EE3t h\u1EA1n m\u1EE9c"
            },
            savingsTips: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  title: { type: import_genai.Type.STRING, description: "Ti\xEAu \u0111\u1EC1 m\u1EB9o ti\u1EBFt ki\u1EC7m" },
                  detail: { type: import_genai.Type.STRING, description: "Chi ti\u1EBFt h\xE0nh \u0111\u1ED9ng c\u1EE5 th\u1EC3" },
                  potentialSavings: { type: import_genai.Type.STRING, description: "\u01AF\u1EDBc t\xEDnh s\u1ED1 ti\u1EC1n c\xF3 th\u1EC3 ti\u1EBFt ki\u1EC7m" }
                },
                required: ["title", "detail"]
              }
            },
            projection: {
              type: import_genai.Type.STRING,
              description: "D\u1EF1 b\xE1o t\xE0i ch\xEDnh cu\u1ED1i th\xE1ng"
            }
          },
          required: ["overallRating", "healthScore", "summary", "alerts", "savingsTips", "projection"]
        }
      }
    });
    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedJson });
  } catch (error) {
    console.warn("Gemini financial advisor failed, using algorithmic fallback:", error?.message || error);
    const fallbackData = fallbackFinancialAdvisor({
      month,
      income,
      expense,
      balance,
      categoriesBreakdown,
      budgets
    });
    return res.json({ success: true, data: fallbackData, isFallback: true });
  }
});
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Expense Server running on http://0.0.0.0:${PORT}`);
  });
}
initServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
