import { CurrencyCode, AppLanguage } from '../types/expense';

// Exchange rates relative to 1 VND (base)
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  VND: 1,
  USD: 1 / 25000,
  EUR: 1 / 27000,
  JPY: 1 / 165,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  VND: '₫',
  USD: '$',
  EUR: '€',
  JPY: '¥',
};

export const formatCurrency = (
  amountInVND: number,
  currency: CurrencyCode = 'VND',
  showSign: boolean = false
): string => {
  const isNegative = amountInVND < 0;
  const absVND = Math.abs(amountInVND);

  if (currency === 'VND') {
    const formatted = new Intl.NumberFormat('vi-VN').format(absVND);
    if (showSign) {
      if (amountInVND > 0) return `+${formatted} ₫`;
      if (amountInVND < 0) return `-${formatted} ₫`;
      return `${formatted} ₫`;
    }
    return `${isNegative ? '-' : ''}${formatted} ₫`;
  }

  const converted = absVND * EXCHANGE_RATES[currency];
  const digits = currency === 'JPY' ? 0 : 2;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(converted);

  const symbol = CURRENCY_SYMBOLS[currency];
  const sign = showSign && amountInVND > 0 ? '+' : isNegative ? '-' : '';

  if (currency === 'USD' || currency === 'EUR' || currency === 'JPY') {
    return `${sign}${symbol}${formatted}`;
  }
  return `${sign}${formatted} ${symbol}`;
};

// Legacy shorthand
export const formatVND = (amount: number, showSign: boolean = false): string => {
  return formatCurrency(amount, 'VND', showSign);
};

export const formatShortCurrency = (amountInVND: number, currency: CurrencyCode = 'VND'): string => {
  const abs = Math.abs(amountInVND);
  if (currency === 'VND') {
    if (abs >= 1_000_000_000) {
      return `${(amountInVND / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (abs >= 1_000_000) {
      return `${(amountInVND / 1_000_000).toFixed(1)} tr`;
    }
    if (abs >= 1_000) {
      return `${(amountInVND / 1_000).toFixed(0)}k`;
    }
    return `${amountInVND} ₫`;
  }

  const converted = amountInVND * EXCHANGE_RATES[currency];
  const absConverted = Math.abs(converted);
  const symbol = CURRENCY_SYMBOLS[currency];

  if (absConverted >= 1_000_000) {
    return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
  }
  if (absConverted >= 1_000) {
    return `${symbol}${(converted / 1_000).toFixed(1)}k`;
  }
  return `${symbol}${converted.toFixed(currency === 'JPY' ? 0 : 1)}`;
};

export const formatShortVND = (amount: number): string => {
  return formatShortCurrency(amount, 'VND');
};

export const formatDateVietnamese = (dateStr: string, lang: AppLanguage = 'vi'): string => {
  if (!dateStr) return '';
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dateStr === today) return lang === 'vi' ? 'Hôm nay' : 'Today';
  if (dateStr === yesterday) return lang === 'vi' ? 'Hôm qua' : 'Yesterday';

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (lang === 'vi') {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[date.getDay()];
        return `${dayName}, ${parts[2]}/${parts[1]}`;
      } else {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${days[date.getDay()]}, ${parts[1]}/${parts[2]}`;
      }
    }
  } catch {
    // fallback
  }
  return dateStr;
};

export const formatFullDateVN = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Calculate next date for recurrence
export const calculateNextDueDate = (
  fromDateStr: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
): string => {
  const d = new Date(fromDateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

  if (frequency === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  }

  return d.toISOString().split('T')[0];
};

// Android Haptic feedback emulation
export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'warning' = 'light') => {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(20);
      else if (type === 'success') navigator.vibrate([15, 30, 20]);
      else if (type === 'warning') navigator.vibrate([30, 50, 30]);
    } catch {
      // ignore
    }
  }
};
