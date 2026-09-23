import { Wallet, Transaction } from '../types/expense';

export interface CreditCycleInfo {
  statementDate: number;
  paymentDueDate: number;
  gracePeriodDays: number;
  currentCycleStart: string; // YYYY-MM-DD
  currentCycleEnd: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  daysUntilStatement: number;
  daysUntilDue: number;
  isOverdue: boolean;
  statusPhase: 'in_cycle' | 'statement_issued' | 'payment_due_soon' | 'overdue';
  statusText: string;
  goldenTimeTip: string;
}

export interface CreditUtilizationInfo {
  creditLimit: number;
  usedAmount: number;
  availableLimit: number;
  utilizationRate: number; // percentage 0 - 100
  rating: 'excellent' | 'good' | 'warning' | 'danger';
  ratingLabel: string;
  ratingDescription: string;
  ratingColor: string;
}

/**
 * Calculates current cycle dates and countdowns for a credit card
 */
export function getCreditCardCycleInfo(card: Wallet): CreditCycleInfo {
  const statementDay = card.statementDate || 20;
  const dueDay = card.paymentDueDate || 5;
  const graceDays = card.gracePeriodDays || 45;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();

  // Determine cycle start & end
  let cycleStartYear = currentYear;
  let cycleStartMonth = currentMonth;
  let cycleEndYear = currentYear;
  let cycleEndMonth = currentMonth;

  if (currentDay > statementDay) {
    // Current day is after this month's statement date -> We are in the cycle ending next month
    cycleStartYear = currentYear;
    cycleStartMonth = currentMonth;
    if (currentMonth === 11) {
      cycleEndYear = currentYear + 1;
      cycleEndMonth = 0;
    } else {
      cycleEndMonth = currentMonth + 1;
    }
  } else {
    // Current day is before or on this month's statement date -> We are in the cycle ending this month
    if (currentMonth === 0) {
      cycleStartYear = currentYear - 1;
      cycleStartMonth = 11;
    } else {
      cycleStartMonth = currentMonth - 1;
    }
    cycleEndYear = currentYear;
    cycleEndMonth = currentMonth;
  }

  // Next Statement Date
  const nextStatementDateObj = new Date(cycleEndYear, cycleEndMonth, statementDay);
  const diffTimeToStatement = nextStatementDateObj.getTime() - now.getTime();
  const daysUntilStatement = Math.max(0, Math.ceil(diffTimeToStatement / (1000 * 60 * 60 * 24)));

  // Next Due Date (Usually dueDay of the month following statement)
  let dueMonth = cycleEndMonth + 1;
  let dueYear = cycleEndYear;
  if (dueMonth > 11) {
    dueYear += 1;
    dueMonth = 0;
  }
  const nextDueDateObj = new Date(dueYear, dueMonth, dueDay);
  const diffTimeToDue = nextDueDateObj.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(diffTimeToDue / (1000 * 60 * 60 * 24));

  const isOverdue = daysUntilDue < 0 && Math.abs(card.balance) > 0;

  // Status Phase
  let statusPhase: CreditCycleInfo['statusPhase'] = 'in_cycle';
  let statusText = 'Đang trong chu kỳ miễn lãi';

  if (isOverdue) {
    statusPhase = 'overdue';
    statusText = `Đã quá hạn ${Math.abs(daysUntilDue)} ngày!`;
  } else if (daysUntilDue <= 3 && Math.abs(card.balance) > 0) {
    statusPhase = 'payment_due_soon';
    statusText = `Sắp đến hạn thanh toán (còn ${daysUntilDue} ngày)`;
  } else if (currentDay > statementDay) {
    statusPhase = 'statement_issued';
    statusText = `Đã chốt sao kê, hạn trả ngày ${dueDay}/${dueMonth + 1}`;
  }

  // Golden Tip for smart card swiping (Tận dụng miễn lãi tối đa 45-55 ngày)
  let goldenTimeTip = '';
  if (daysUntilStatement <= 2) {
    goldenTimeTip = `⚠️ Sắp chốt sao kê (còn ${daysUntilStatement} ngày). Nếu có khoản chi lớn, hãy đợi sau ngày ${statementDay} để được hưởng miễn lãi trọn vẹn ${graceDays} ngày kỳ sau!`;
  } else if (currentDay >= statementDay && currentDay <= statementDay + 5) {
    goldenTimeTip = `✨ Thời điểm VÀNG! Quẹt thẻ hôm nay để tận hưởng tối đa ${graceDays} ngày miễn lãi từ ngân hàng!`;
  } else {
    goldenTimeTip = `💡 Hạn mức chu kỳ còn lại ${daysUntilStatement} ngày. Thanh toán đầy đủ trước ngày ${dueDay}/${dueMonth + 1} để không bị tính lãi suất.`;
  }

  const formatIsoDate = (d: Date) => d.toISOString().split('T')[0];

  return {
    statementDate: statementDay,
    paymentDueDate: dueDay,
    gracePeriodDays: graceDays,
    currentCycleStart: formatIsoDate(new Date(cycleStartYear, cycleStartMonth, statementDay + 1)),
    currentCycleEnd: formatIsoDate(nextStatementDateObj),
    nextDueDate: formatIsoDate(nextDueDateObj),
    daysUntilStatement,
    daysUntilDue,
    isOverdue,
    statusPhase,
    statusText,
    goldenTimeTip,
  };
}

/**
 * Calculates credit utilization rate and financial health score
 */
export function getCreditUtilization(card: Wallet): CreditUtilizationInfo {
  const limit = card.creditLimit || 0;
  const used = Math.abs(card.balance < 0 ? card.balance : 0);
  const available = Math.max(0, limit - used);
  const rate = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  let rating: CreditUtilizationInfo['rating'] = 'excellent';
  let ratingLabel = 'Rất Tốt (< 30%)';
  let ratingDescription = 'Tỷ lệ vàng tối ưu điểm tín dụng CIC và tăng hạn mức.';
  let ratingColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';

  if (rate >= 80) {
    rating = 'danger';
    ratingLabel = 'Nguy Hiểm (> 80%)';
    ratingDescription = 'Dư nợ sắp kịch trần. Nguy cơ bị giảm điểm tín dụng và phạt phí vượt hạn mức.';
    ratingColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
  } else if (rate >= 50) {
    rating = 'warning';
    ratingLabel = 'Cần Lưu Ý (50 - 80%)';
    ratingDescription = 'Đã dùng quá nửa hạn mức. Nên cân nhắc thanh toán bớt dư nợ.';
    ratingColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
  } else if (rate >= 30) {
    rating = 'good';
    ratingLabel = 'Khá An Toàn (30 - 50%)';
    ratingDescription = 'Mức sử dụng hạn mức chấp nhận được, duy trì thanh toán đúng hạn.';
    ratingColor = 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800';
  }

  return {
    creditLimit: limit,
    usedAmount: used,
    availableLimit: available,
    utilizationRate: Math.round(rate * 10) / 10,
    rating,
    ratingLabel,
    ratingDescription,
    ratingColor,
  };
}

/**
 * Calculates minimum due amount
 */
export function calculateMinimumDue(card: Wallet): number {
  const used = Math.abs(card.balance < 0 ? card.balance : 0);
  if (used <= 0) return 0;
  const percent = (card.minimumPaymentPercent || 5) / 100;
  const minAmount = Math.max(50000, Math.round(used * percent));
  return Math.min(used, minAmount);
}

/**
 * Filter transactions made by this credit card
 */
export function getCardTransactions(transactions: Transaction[], cardId: string): Transaction[] {
  return transactions.filter(t => t.walletId === cardId || t.toWalletId === cardId);
}

/**
 * Simulate interest fee if paying minimum vs paying in full
 */
export function simulateCreditCardInterest({
  balance,
  annualInterestRate,
  months = 3,
  minimumPaymentPercent = 5,
}: {
  balance: number;
  annualInterestRate: number;
  months?: number;
  minimumPaymentPercent?: number;
}) {
  const dailyRate = annualInterestRate / 100 / 365;
  let remaining = balance;
  let totalInterest = 0;
  const monthBreakdowns: {
    month: number;
    startBalance: number;
    payment: number;
    interest: number;
    endBalance: number;
  }[] = [];

  for (let m = 1; m <= months; m++) {
    if (remaining <= 0) break;
    const interest = Math.round(remaining * dailyRate * 30);
    totalInterest += interest;
    const payment = Math.max(50000, Math.round((remaining + interest) * (minimumPaymentPercent / 100)));
    const end = Math.max(0, remaining + interest - payment);

    monthBreakdowns.push({
      month: m,
      startBalance: remaining,
      payment,
      interest,
      endBalance: end,
    });
    remaining = end;
  }

  return {
    totalInterestIfMinimum: totalInterest,
    interestIfFull: 0, // 0 interest if paid in full before due date!
    savedMoney: totalInterest,
    monthBreakdowns,
  };
}
