import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  PiggyBank,
  HeartPulse,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { getFinancialAdviceAI, FinancialAdviceResult } from '../services/aiService';
import { triggerHaptic } from '../utils/formatters';

interface AIFinancialAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIFinancialAdvisorModal: React.FC<AIFinancialAdvisorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    selectedMonth,
    monthIncome,
    monthExpense,
    totalBalance,
    transactions,
    categories,
    budgets,
    getCategoryById,
    formatMoney,
  } = useExpense();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<FinancialAdviceResult | null>(null);

  // Compute category breakdown for the selected month
  const categoryBreakdown = React.useMemo(() => {
    const map: Record<string, number> = {};
    let totalExp = 0;

    transactions.forEach(t => {
      if (t.date.startsWith(selectedMonth) && t.type === 'expense') {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
        totalExp += t.amount;
      }
    });

    return Object.entries(map).map(([catId, amount]) => ({
      name: getCategoryById(catId)?.name || 'Khác',
      amount,
      percentage: totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0,
    }));
  }, [transactions, selectedMonth, getCategoryById]);

  // Compute budget comparison
  const budgetList = React.useMemo(() => {
    return budgets
      .filter(b => b.month === selectedMonth)
      .map(b => {
        const spent = transactions
          .filter(t => t.date.startsWith(selectedMonth) && t.categoryId === b.categoryId && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          categoryName: getCategoryById(b.categoryId)?.name || 'Khác',
          spent,
          limit: b.monthlyLimit,
        };
      });
  }, [budgets, transactions, selectedMonth, getCategoryById]);

  const topMonthTransactions = React.useMemo(() => {
    return transactions
      .filter(t => t.date.startsWith(selectedMonth))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
      .map(t => ({
        note: t.note || '',
        amount: t.amount,
        type: t.type,
        categoryName: getCategoryById(t.categoryId)?.name || 'Khác',
      }));
  }, [transactions, selectedMonth, getCategoryById]);

  const fetchAdvice = async () => {
    setIsLoading(true);
    setError(null);
    triggerHaptic('light');

    try {
      const res = await getFinancialAdviceAI({
        month: selectedMonth,
        income: monthIncome,
        expense: monthExpense,
        balance: totalBalance,
        categoriesBreakdown: categoryBreakdown,
        budgets: budgetList,
        topTransactions: topMonthTransactions,
      });
      setAdvice(res);
      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Không thể tạo phân tích tài chính lúc này.');
      triggerHaptic('warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !advice) {
      fetchAdvice();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const [yearStr, monthStr] = selectedMonth.split('-');

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';
    if (score >= 60) return 'text-teal-400 bg-teal-950/80 border-teal-500/40';
    if (score >= 40) return 'text-amber-400 bg-amber-950/80 border-amber-500/40';
    return 'text-rose-400 bg-rose-950/80 border-rose-500/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Cố Vấn Tài Chính AI
                <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Tháng {monthStr}/{yearStr}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">Phân tích chi tiêu & Gợi ý tiết kiệm thông minh</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchAdvice}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
              title="Phân tích lại"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && !advice ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200 animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Gemini đang phân tích chi tiêu...</h4>
              <p className="text-xs text-slate-500 max-w-[260px]">
                Đang đối chiếu ngân sách, danh mục và dòng tiền tháng {monthStr} để xây dựng lời khuyên tối ưu.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
              <h4 className="text-sm font-bold text-rose-800">Không thể tải phân tích</h4>
              <p className="text-xs text-rose-600">{error}</p>
              <button
                onClick={fetchAdvice}
                className="mt-2 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl"
              >
                Thử lại
              </button>
            </div>
          ) : advice ? (
            <div className="space-y-4">
              {/* Score & Summary Hero Card */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-slate-300">Điểm sức khỏe tài chính</span>
                  </div>
                  <div
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${getScoreBadgeColor(
                      advice.healthScore
                    )}`}
                  >
                    {advice.healthScore} / 100
                  </div>
                </div>

                {/* Summary text */}
                <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  {advice.summary}
                </p>

                {/* Projection */}
                <div className="flex items-start gap-2 pt-1 border-t border-slate-700/80 text-[11px] text-teal-300">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dự báo cuối tháng:</strong> {advice.projection}
                  </span>
                </div>
              </div>

              {/* Alerts & Warnings */}
              {advice.alerts && advice.alerts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Điểm cần lưu ý & Cảnh báo
                  </span>
                  <div className="space-y-1.5">
                    {advice.alerts.map((al, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span className="leading-snug">{al}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Saving Tips */}
              {advice.savingsTips && advice.savingsTips.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-teal-600" />
                    Gợi ý tiết kiệm thực tế
                  </span>
                  <div className="space-y-2">
                    {advice.savingsTips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                            <PiggyBank className="w-3.5 h-3.5 text-teal-600" />
                            {tip.title}
                          </h5>
                          {tip.potentialSavings && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                              {tip.potentialSavings}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                          {tip.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
