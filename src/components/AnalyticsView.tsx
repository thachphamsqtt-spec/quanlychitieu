import React, { useState, useMemo } from 'react';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Wallet as WalletIcon,
  Filter,
  Sparkles,
  Bot
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { AIFinancialAdvisorModal } from './AIFinancialAdvisorModal';

export const AnalyticsView: React.FC = () => {
  const {
    transactions,
    selectedMonth,
    categories,
    wallets,
    monthIncome,
    monthExpense,
    monthNet,
    getCategoryById,
    formatMoney,
    formatShortMoney,
  } = useExpense();

  const [activeAnalysisType, setActiveAnalysisType] = useState<'expense' | 'income'>('expense');
  const [periodPreset, setPeriodPreset] = useState<'month' | 'last_month' | '7days' | 'today'>('month');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'donut' | 'trend'>('donut');
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  // Compute Last Month (YYYY-MM)
  const lastMonthStr = useMemo(() => {
    const curYear = parseInt(selectedMonth.split('-')[0]);
    const curMonth = parseInt(selectedMonth.split('-')[1]);
    let lastM = curMonth - 1;
    let lastY = curYear;
    if (lastM === 0) {
      lastM = 12;
      lastY -= 1;
    }
    return `${lastY}-${String(lastM).padStart(2, '0')}`;
  }, [selectedMonth]);

  // Last Month Expenses & Income for comparison
  const lastMonthStats = useMemo(() => {
    let exp = 0;
    let inc = 0;
    transactions.forEach(t => {
      if (t.date.startsWith(lastMonthStr)) {
        if (t.type === 'expense') exp += t.amount;
        if (t.type === 'income') inc += t.amount;
      }
    });
    return { exp, inc, net: inc - exp };
  }, [transactions, lastMonthStr]);

  // Month-over-month comparison metrics
  const momComparison = useMemo(() => {
    const diffExp = monthExpense - lastMonthStats.exp;
    const percentExpChange = lastMonthStats.exp > 0 ? (diffExp / lastMonthStats.exp) * 100 : 0;

    const diffInc = monthIncome - lastMonthStats.inc;
    const percentIncChange = lastMonthStats.inc > 0 ? (diffInc / lastMonthStats.inc) * 100 : 0;

    return {
      diffExp,
      percentExpChange,
      diffInc,
      percentIncChange,
    };
  }, [monthExpense, monthIncome, lastMonthStats]);

  // Filter transactions for period & selected analysis type
  const relevantTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const d7Str = d7.toISOString().split('T')[0];

    return transactions.filter(t => {
      if (t.type !== activeAnalysisType) return false;
      if (filterWallet !== 'all' && t.walletId !== filterWallet && t.toWalletId !== filterWallet) return false;

      if (periodPreset === 'month') {
        return t.date.startsWith(selectedMonth);
      } else if (periodPreset === 'last_month') {
        return t.date.startsWith(lastMonthStr);
      } else if (periodPreset === '7days') {
        return t.date >= d7Str && t.date <= todayStr;
      } else if (periodPreset === 'today') {
        return t.date === todayStr;
      }
      return true;
    });
  }, [transactions, activeAnalysisType, filterWallet, periodPreset, selectedMonth, lastMonthStr]);

  const totalAmount = useMemo(() => {
    return relevantTransactions.reduce((s, t) => s + t.amount, 0);
  }, [relevantTransactions]);

  // Aggregate by category
  const categoryStats = useMemo(() => {
    const map: { [catId: string]: number } = {};
    relevantTransactions.forEach(t => {
      const id = t.categoryId || 'cat_other_expense';
      map[id] = (map[id] || 0) + t.amount;
    });

    const list = Object.entries(map).map(([catId, amount]) => {
      const cat = getCategoryById(catId);
      const percent = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
      return {
        catId,
        cat,
        amount,
        percent,
      };
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [relevantTransactions, totalAmount, getCategoryById]);

  // Savings rate calculation for selected month
  const savingsRate = useMemo(() => {
    if (monthIncome <= 0) return 0;
    const rate = Math.round((monthNet / monthIncome) * 100);
    return Math.max(0, rate);
  }, [monthIncome, monthNet]);

  // SVG Donut Chart Calculation
  const donutSegments = useMemo(() => {
    let accumulatedAngle = 0;
    const radius = 65;
    const circumference = 2 * Math.PI * radius;

    return categoryStats.map(stat => {
      const strokeDasharray = `${(stat.percent / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * (circumference / 360);
      accumulatedAngle += (stat.percent / 100) * 360;

      return {
        ...stat,
        strokeDasharray,
        strokeDashoffset,
        color: stat.cat?.color || '#94a3b8',
      };
    });
  }, [categoryStats]);

  // Trend Bar Chart Data (Past 6 months)
  const monthlyTrendData = useMemo(() => {
    const result = [];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    for (let i = 4; i >= 0; i--) {
      let m = curMonth - i;
      let y = curYear;
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      const mStr = `${y}-${String(m).padStart(2, '0')}`;
      const label = `T${m}`;

      let inc = 0;
      let exp = 0;
      transactions.forEach(t => {
        if (t.date.startsWith(mStr)) {
          if (filterWallet === 'all' || t.walletId === filterWallet) {
            if (t.type === 'income') inc += t.amount;
            if (t.type === 'expense') exp += t.amount;
          }
        }
      });

      result.push({ month: mStr, label, income: inc, expense: exp });
    }

    const maxVal = Math.max(...result.map(r => Math.max(r.income, r.expense)), 1000000);
    return { data: result, maxVal };
  }, [transactions, filterWallet]);

  return (
    <div className="flex-1 pb-10 space-y-4 px-4 pt-3">
      {/* AI Financial Advisor Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-3.5 text-white shadow-sm border border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              Cố Vấn Tài Chính AI
              <span className="text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                Gemini 3.8
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">Phân tích thói quen & gợi ý tiết kiệm thông minh</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsAdvisorOpen(true);
          }}
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1 shrink-0"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Xem phân tích</span>
        </button>
      </div>

      {/* Type Toggle Pill (Chi tiêu / Thu nhập) */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveAnalysisType('expense');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeAnalysisType === 'expense'
              ? 'bg-white text-rose-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Cơ cấu Chi tiêu
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveAnalysisType('income');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeAnalysisType === 'income'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Nguồn Thu nhập
        </button>
      </div>

      {/* Period Selector & Wallet Filter Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1">
          {[
            { id: 'month', label: 'Tháng này' },
            { id: 'last_month', label: 'Tháng trước' },
            { id: '7days', label: '7 ngày' },
            { id: 'today', label: 'Hôm nay' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => {
                triggerHaptic('light');
                setPeriodPreset(p.id as any);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition ${
                periodPreset === p.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chart Mode Toggle */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl shrink-0">
          <button
            onClick={() => setActiveViewMode('donut')}
            className={`p-1.5 rounded-lg transition ${
              activeViewMode === 'donut' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
            title="Biểu đồ tròn tỷ trọng"
          >
            <PieChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveViewMode('trend')}
            className={`p-1.5 rounded-lg transition ${
              activeViewMode === 'trend' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
            }`}
            title="Biểu đồ cột xu hướng"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">
              {activeAnalysisType === 'expense' ? 'Tổng chi tiêu' : 'Tổng thu nhập'}
            </span>
            {activeAnalysisType === 'expense' ? (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="text-base font-bold font-mono text-slate-800 truncate">
            {formatMoney(totalAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {relevantTransactions.length} giao dịch ghi nhận
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Tỷ lệ tích lũy</span>
            <PiggyBank className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-base font-bold font-mono text-teal-700">
            {savingsRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {monthNet >= 0 ? `Dư: ${formatShortMoney(monthNet)}` : `Bội chi: ${formatShortMoney(monthNet)}`}
          </div>
        </div>
      </div>

      {/* Month-Over-Month Comparison Card */}
      <div className="bg-gradient-to-br from-slate-50 to-teal-50/50 rounded-2xl p-4 border border-teal-100 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
            So sánh với tháng trước
          </span>
          <span className="text-[10px] text-slate-400">
            vs {lastMonthStr}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Expense MoM */}
          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-500 block">Chi tiêu</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {momComparison.diffExp <= 0 ? (
                <div className="flex items-center text-emerald-600 text-xs font-bold">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{Math.abs(momComparison.percentExpChange).toFixed(1)}%</span>
                </div>
              ) : (
                <div className="flex items-center text-rose-600 text-xs font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{momComparison.percentExpChange.toFixed(1)}%</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {momComparison.diffExp <= 0 ? 'Giảm ' : 'Tăng '}
              {formatShortMoney(Math.abs(momComparison.diffExp))}
            </span>
          </div>

          {/* Income MoM */}
          <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-500 block">Thu nhập</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {momComparison.diffInc >= 0 ? (
                <div className="flex items-center text-emerald-600 text-xs font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{momComparison.percentIncChange.toFixed(1)}%</span>
                </div>
              ) : (
                <div className="flex items-center text-rose-600 text-xs font-bold">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{Math.abs(momComparison.percentIncChange).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              {momComparison.diffInc >= 0 ? 'Tăng ' : 'Giảm '}
              {formatShortMoney(Math.abs(momComparison.diffInc))}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {activeViewMode === 'donut' ? (
        /* Donut Chart Visualization */
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
            <span>Tỷ trọng theo danh mục</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {periodPreset === 'month' ? 'Tháng này' : periodPreset === 'last_month' ? 'Tháng trước' : 'Thời gian lọc'}
            </span>
          </h3>

          {categoryStats.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có số liệu {activeAnalysisType === 'expense' ? 'chi tiêu' : 'thu nhập'} trong khoảng thời gian này.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* SVG Donut */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="65"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="24"
                  />
                  {donutSegments.map(seg => (
                    <circle
                      key={seg.catId}
                      cx="80"
                      cy="80"
                      r="65"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="24"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-700 hover:opacity-80"
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Tổng
                  </span>
                  <span className="text-xs font-extrabold font-mono text-slate-800 mt-0.5">
                    {formatShortMoney(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Top 4 Legend preview */}
              <div className="space-y-2 flex-1 w-full">
                {categoryStats.slice(0, 4).map(item => (
                  <div key={item.catId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.cat?.color || '#94a3b8' }}
                      />
                      <span className="text-slate-700 font-medium truncate">
                        {item.cat?.name || 'Khác'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-slate-500 font-medium">{item.percent.toFixed(1)}%</span>
                      <span className="font-bold text-slate-800">{formatShortMoney(item.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Trend Bar Chart Visualization */
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Xu hướng thu & chi 5 tháng gần nhất
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Thu
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Chi
              </span>
            </div>
          </div>

          {/* Bar Chart Bars */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
            {monthlyTrendData.data.map((m, idx) => {
              const incPercent = Math.min(100, Math.round((m.income / monthlyTrendData.maxVal) * 100));
              const expPercent = Math.min(100, Math.round((m.expense / monthlyTrendData.maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Income bar */}
                    <div
                      style={{ height: `${Math.max(4, incPercent)}%` }}
                      className="w-3 sm:w-4 bg-emerald-500 rounded-t-lg transition-all duration-500 group-hover:bg-emerald-600 relative"
                    />
                    {/* Expense bar */}
                    <div
                      style={{ height: `${Math.max(4, expPercent)}%` }}
                      className="w-3 sm:w-4 bg-rose-500 rounded-t-lg transition-all duration-500 group-hover:bg-rose-600 relative"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 mt-2">{m.label}</span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Nhấn vào các cột để theo dõi chi tiết biến động thu và chi theo từng tháng
          </div>
        </div>
      )}

      {/* Detailed Category Breakdown Table */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Chi tiết từng danh mục
        </h3>

        <div className="space-y-3">
          {categoryStats.map(item => (
            <div key={item.catId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.cat?.color + '20', color: item.cat?.color }}
                  >
                    <CategoryIcon name={item.cat?.icon || 'Coins'} size={15} />
                  </div>
                  <span className="font-bold text-slate-800 truncate">
                    {item.cat?.name || 'Khác'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-slate-800">{formatMoney(item.amount)}</span>
                  <span className="text-slate-400 text-[11px] ml-1.5">
                    ({item.percent.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: item.cat?.color || '#0d9488',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Financial Advisor Modal */}
      <AIFinancialAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
      />
    </div>
  );
};
