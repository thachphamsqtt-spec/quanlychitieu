import React, { useState } from 'react';
import { X, Sparkles, TrendingDown, Calendar, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Wallet } from '../types/expense';
import { useExpense } from '../context/ExpenseContext';
import { simulateCreditCardInterest, getCreditCardCycleInfo } from '../utils/creditCard';

interface CreditCardSimulatorModalProps {
  card: Wallet;
  isOpen: boolean;
  onClose: () => void;
}

export const CreditCardSimulatorModal: React.FC<CreditCardSimulatorModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const { formatMoney } = useExpense();

  const currentDebt = Math.abs(card.balance < 0 ? card.balance : 0) || 5000000;
  const [balanceInput, setBalanceInput] = useState<number>(currentDebt);
  const [annualRate, setAnnualRate] = useState<number>(card.interestRateAnnual || 32);
  const [months, setMonths] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<'interest' | 'cycle_strategy'>('interest');

  if (!isOpen) return null;

  const cycleInfo = getCreditCardCycleInfo(card);
  const simulation = simulateCreditCardInterest({
    balance: balanceInput,
    annualInterestRate: annualRate,
    months,
    minimumPaymentPercent: card.minimumPaymentPercent || 5,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mô Phỏng Tài Chính Thẻ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {card.name} • Tối ưu hóa chu kỳ & lãi suất
              </p>
            </div>
          </div>
          <button
            id="close-sim-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 flex items-center justify-center transition hover:bg-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('interest')}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'interest'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            So sánh Lãi Suất (Trả Đủ vs Tối Thiểu)
          </button>
          <button
            onClick={() => setActiveTab('cycle_strategy')}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'cycle_strategy'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Chiến Lược Quẹt Thẻ Miễn Lãi {card.gracePeriodDays || 45} Ngày
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'interest' ? (
            <div className="space-y-4">
              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Dư nợ mô phỏng (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={balanceInput || ''}
                    onChange={e => setBalanceInput(Number(e.target.value) || 0)}
                    step="500000"
                    min="100000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Lãi suất quá hạn (%/năm)
                  </label>
                  <input
                    type="number"
                    value={annualRate || ''}
                    onChange={e => setAnnualRate(Number(e.target.value) || 0)}
                    step="1"
                    min="10"
                    max="50"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Big Comparison Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Trả toàn bộ (Full)</span>
                  </div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                    0 ₫ LÃI
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                    Hưởng trọn vẹn 100% thời gian miễn lãi. Tăng điểm tín dụng CIC uy tín.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>Chỉ trả tối thiểu ({months} tháng)</span>
                  </div>
                  <div className="text-xl font-black text-rose-700 dark:text-rose-400">
                    +{formatMoney(simulation.totalInterestIfMinimum)}
                  </div>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
                    Ngân hàng tính lãi kép trên toàn bộ số dư gốc từ ngày quẹt thẻ!
                  </p>
                </div>
              </div>

              {/* Saved Badge */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Tiền lãi tiết kiệm khi thanh toán đúng hạn:
                  </span>
                </div>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                  {formatMoney(simulation.savedMoney)}
                </span>
              </div>

              {/* Monthly Breakdown Table */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Chi tiết nếu chỉ trả tối thiểu 5%/tháng</span>
                  <div className="flex gap-1">
                    {[3, 6].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMonths(m)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          months === m
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {m} tháng
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {simulation.monthBreakdowns.map(row => (
                    <div
                      key={row.month}
                      className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-800/50"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Tháng {row.month}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Gốc đầu kỳ: {formatMoney(row.startBalance)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-rose-600 font-bold">
                          Lãi: +{formatMoney(row.interest)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Trả tối thiểu: {formatMoney(row.payment)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Golden Rule Explainer */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Quy Tắc "Ngày Vàng" Của Thẻ Tín Dụng</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {cycleInfo.goldenTimeTip}
                </p>
              </div>

              {/* Visual Timeline Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Lộ trình chu kỳ sao kê thẻ này
                </span>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900">
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Ngày bắt đầu chu kỳ mới (Ngày {card.statementDate ? (card.statementDate % 31) + 1 : 21})
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Quẹt thẻ vào ngày này được hưởng trọn vẹn <b>{card.gracePeriodDays || 45} ngày</b> miễn lãi!
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Ngày chốt sao kê (Ngày {card.statementDate || 20} hàng tháng)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Ngân hàng tổng hợp tất cả chi tiêu trong tháng và gửi thông báo sao kê về email/SMS.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Hạn chót thanh toán (Ngày {card.paymentDueDate || 5} tháng sau)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Cần thanh toán đầy đủ 100% trước 17:00 ngày này để không bị phạt phí trả chậm và tính lãi.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Smart Rules */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  3 nguyên tắc vàng để quẹt thẻ thông minh:
                </h5>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <p><b>1. Không chi tiêu vượt quá 30% hạn mức:</b> Giúp nâng cao điểm tín dụng cá nhân trên hệ thống CIC Việt Nam.</p>
                  <p><b>2. Cài đặt thanh toán tự động (Auto-debit):</b> Luôn đảm bảo tài khoản thanh toán đủ tiền để trừ nợ tự động vào ngày đến hạn.</p>
                  <p><b>3. Tận dụng ưu đãi hoàn tiền (Cashback):</b> {card.cashbackNote || 'Sử dụng thẻ đúng danh mục được hoàn tiền cao nhất để tiết kiệm hàng triệu đồng mỗi năm.'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
