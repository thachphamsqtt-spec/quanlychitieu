import { BankAccountInfo, SplitBill, SplitBillMember } from '../types/expense';

export interface Bank {
  code: string;
  bin: string;
  shortName: string;
  name: string;
  color: string;
  lookupCode: string;
}

export const VIETNAM_BANKS: Bank[] = [
  { code: 'VCB', bin: '970436', shortName: 'Vietcombank', name: 'TMCP Ngoại Thương Việt Nam', color: '#005b41', lookupCode: 'vietcombank' },
  { code: 'MB', bin: '970422', shortName: 'MBBank', name: 'TMCP Quân Đội', color: '#0033a0', lookupCode: 'mbbank' },
  { code: 'TCB', bin: '970407', shortName: 'Techcombank', name: 'TMCP Kỹ Thương Việt Nam', color: '#e31837', lookupCode: 'techcombank' },
  { code: 'ACB', bin: '970416', shortName: 'ACB', name: 'TMCP Á Châu', color: '#004f9e', lookupCode: 'acb' },
  { code: 'VPB', bin: '970432', shortName: 'VPBank', name: 'TMCP Việt Nam Thịnh Vượng', color: '#008542', lookupCode: 'vpbank' },
  { code: 'BIDV', bin: '970418', shortName: 'BIDV', name: 'TMCP Đầu tư và Phát triển VN', color: '#006633', lookupCode: 'bidv' },
  { code: 'VBA', bin: '970405', shortName: 'Agribank', name: 'Nông nghiệp và Phát triển Nông thôn', color: '#8c111c', lookupCode: 'agribank' },
  { code: 'TPB', bin: '970423', shortName: 'TPBank', name: 'TMCP Tiên Phong', color: '#56257e', lookupCode: 'tpbank' },
  { code: 'STB', bin: '970403', shortName: 'Sacombank', name: 'TMCP Sài Gòn Thương Tín', color: '#004b87', lookupCode: 'sacombank' },
  { code: 'HDB', bin: '970437', shortName: 'HDBank', name: 'TMCP Phát triển TP.HCM', color: '#ed1c24', lookupCode: 'hdbank' },
  { code: 'VIB', bin: '970441', shortName: 'VIB', name: 'TMCP Quốc tế Việt Nam', color: '#004f9e', lookupCode: 'vib' },
  { code: 'OCB', bin: '970448', shortName: 'OCB', name: 'TMCP Phương Đông', color: '#008853', lookupCode: 'ocb' },
  { code: 'MSB', bin: '970426', shortName: 'MSB', name: 'TMCP Hàng Hải Việt Nam', color: '#ea5404', lookupCode: 'msb' },
  { code: 'SHB', bin: '970443', shortName: 'SHB', name: 'TMCP Sài Gòn - Hà Nội', color: '#005b82', lookupCode: 'shb' },
  { code: 'TIMO', bin: '963388', shortName: 'Timo', name: 'Ngân hàng số Timo (BVBank)', color: '#7030a0', lookupCode: 'timo' },
  { code: 'CAKE', bin: '546034', shortName: 'Cake by VPBank', name: 'Ngân hàng số Cake', color: '#e83e8c', lookupCode: 'cake' },
];

export const MEMBER_AVATAR_COLORS = [
  '#0f766e', // teal
  '#0284c7', // sky
  '#7c3aed', // violet
  '#db2777', // pink
  '#d97706', // amber
  '#16a34a', // emerald
  '#ea580c', // orange
  '#4f46e5', // indigo
  '#059669', // green
  '#e11d48', // rose
];

/**
 * Generate VietQR Quick Image URL based on standard VietQR.io service
 * Templates available:
 * - compact2: modern with bank logo in header/center
 * - compact: clean compact
 * - qr_only: just the raw QR code
 */
export function generateVietQRUrl(options: {
  bankCode: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo?: string;
  template?: 'compact2' | 'compact' | 'qr_only';
}): string {
  const { bankCode, accountNo, accountName, amount, addInfo = '', template = 'compact2' } = options;

  // Clean account number (no spaces or hyphens)
  const cleanAccountNo = accountNo.replace(/\s+/g, '').replace(/-/g, '');
  const cleanBankCode = bankCode.toUpperCase();
  const cleanAmount = Math.max(0, Math.round(amount));

  const queryParams = new URLSearchParams();
  if (cleanAmount > 0) {
    queryParams.set('amount', cleanAmount.toString());
  }
  if (addInfo) {
    queryParams.set('addInfo', addInfo.trim());
  }
  if (accountName) {
    queryParams.set('accountName', accountName.trim().toUpperCase());
  }

  const queryString = queryParams.toString();
  return `https://img.vietqr.io/image/${cleanBankCode}-${cleanAccountNo}-${template}.png${
    queryString ? `?${queryString}` : ''
  }`;
}

/**
 * Format standard note for split bill transfer (e.g. "Nguyen Van A ck bill Lau nuong")
 */
export function generateTransferNote(billTitle: string, memberName: string): string {
  // Strip special accents or keep simple readable Vietnamese
  const cleanTitle = billTitle.substring(0, 20).replace(/[^\p{L}\p{N}\s]/gu, '');
  const cleanName = memberName.substring(0, 15).replace(/[^\p{L}\p{N}\s]/gu, '');
  return `${cleanName} ck ${cleanTitle}`.trim();
}

/**
 * Format a rich text summary of the Split Bill for sharing to Zalo, Messenger, SMS
 */
export function formatSplitBillShareText(bill: SplitBill, formatMoney: (val: number) => string): string {
  const total = bill.totalAmount + (bill.tipAmount || 0) + (bill.totalAmount * (bill.taxPercent || 0)) / 100 - (bill.discountAmount || 0);

  let text = `🧾 BẢNG CHIA TIỀN: ${bill.title.toUpperCase()}\n`;
  text += `📅 Ngày: ${bill.date}\n`;
  text += `💰 Tổng bill: ${formatMoney(total)}\n`;

  if (bill.taxPercent) {
    text += `• VAT: ${bill.taxPercent}%\n`;
  }
  if (bill.tipAmount) {
    text += `• Phụ thu/Tip: ${formatMoney(bill.tipAmount)}\n`;
  }
  if (bill.discountAmount) {
    text += `• Giảm giá: -${formatMoney(bill.discountAmount)}\n`;
  }

  text += `\n👥 DANH SÁCH THÀNH VIÊN:\n`;
  bill.members.forEach((m, idx) => {
    const status = m.isPaid ? '✅ Đã chuyển' : '⏳ Chưa chuyển';
    const payerTag = m.isPayer ? ' (Người chi trả)' : '';
    text += `${idx + 1}. ${m.name}: ${formatMoney(m.amount)} [${status}]${payerTag}\n`;
  });

  if (bill.bankInfo && bill.bankInfo.accountNo) {
    const bank = VIETNAM_BANKS.find(b => b.code === bill.bankInfo?.bankCode);
    const bankDisplay = bank ? bank.shortName : bill.bankInfo.bankCode;

    text += `\n💳 THÔNG TIN CHUYỂN KHOẢN (VietQR):\n`;
    text += `• Ngân hàng: ${bankDisplay}\n`;
    text += `• Số tài khoản: ${bill.bankInfo.accountNo}\n`;
    text += `• Chủ tài khoản: ${bill.bankInfo.accountName.toUpperCase()}\n`;
    text += `• Nội dung: [Tên bạn] ck ${bill.title}\n`;
  }

  text += `\n✨ Tạo bởi Quản Lý Chi Tiêu Android`;
  return text;
}

const defaultFormatVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

export function generateBillShareText(bill: SplitBill): string {
  return formatSplitBillShareText(bill, defaultFormatVND);
}

export function generateDebtReminderMessage(bill: SplitBill, member: SplitBillMember): string {
  let text = `👋 Chào ${member.name},\n`;
  text += `Bạn có khoản chia tiền cho cuộc hẹn "${bill.title}" ngày ${bill.date} là: ${defaultFormatVND(member.amount)}.\n`;
  if (bill.bankInfo && bill.bankInfo.accountNo) {
    const bank = VIETNAM_BANKS.find(b => b.code === bill.bankInfo?.bankCode);
    const bankDisplay = bank ? bank.shortName : bill.bankInfo.bankCode;
    text += `\n💳 Chuyển khoản giúp mình qua:\n`;
    text += `• Ngân hàng: ${bankDisplay}\n`;
    text += `• STK: ${bill.bankInfo.accountNo}\n`;
    text += `• Chủ TK: ${bill.bankInfo.accountName.toUpperCase()}\n`;
    text += `• Nội dung: ${member.name} ck ${bill.title}\n`;
  }
  text += `\nCảm ơn bạn nhé! ✨`;
  return text;
}

