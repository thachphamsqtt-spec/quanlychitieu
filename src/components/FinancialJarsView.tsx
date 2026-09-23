import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  PieChart as PieChartIcon,
  RotateCcw,
  Sliders,
  Check,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Percent
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmModal } from './ConfirmModal';

export const FinancialJarsView: React.FC = () => {
  const {
    financialJars,
    updateFinancialJar,
    resetFinancialJars,
    formatMoney,
    monthIncome,
    transactions,
    selectedMonth,
    categories,
  } = useExpense();

  // Custom monthly income input for allocation calculation
  const [customIncomeStr, setCustomIncomeStr] = useState<string>(
    monthIncome > 0 ? monthIncome.toString() : '20000000'
  );
  const [isEditingPercentages, setIsEditingPercentages] = useState(false);
  const [tempPercentages, setTempPercentages] = useState<{ [id: string]: number }>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const parsedIncome = Math.max(0, parseFloat(customIncomeStr) || 0);

  // Calculate actual spending in each jar for the selected month
  const jarSpending = useMemo(() => {
    const spendingMap: { [jarId: string]: number } = {};
    financialJars.forEach(jar => {
      spendingMap[jar.id] = 0;
    });

    const monthExpenses = transactions.filter(
      t => t.type === 'expense' && t.date.startsWith(selectedMonth)
    );

    monthExpenses.forEach(tx => {
      const matchedJar = financialJars.find(jar =>
        jar.categoryIds.includes(tx.categoryId)
      );
      if (matchedJar) {
        spendingMap[matchedJar.id] = (spendingMap[matchedJar.id] || 0) + tx.amount;
      } else {
        // Default unassigned goes to NEC (Chi tiêu thiết yếu)
        const nec = financialJars.find(j => j.id === 'jar_nec');
        if (nec) {
          spendingMap[nec.id] = (spendingMap[nec.id] || 0) + tx.amount;
        }
      }
    });

    return spendingMap;
  }, [financialJars, transactions, selectedMonth]);

  // Start editing percentages
  const handleStartEdit = () => {
    const current: { [id: string]: number } = {};
    financialJars.forEach(j => {
      current[j.id] = j.percentage;
    });
    setTempPercentages(current);
    setIsEditingPercentages(true);
    triggerHaptic('light');
  };

  const handlePercentageChange = (id: string, val: number) => {
    setTempPercentages(prev => ({
      ...prev,
      [id]: Math.max(0, Math.min(100, val)),
    }));
  };

  const totalPercentage: number = Object.values(
    isEditingPercentages
      ? tempPercentages
      : financialJars.reduce<Record<string, number>>((acc, j) => ({ ...acc, [j.id]: j.percentage }), {})
  ).reduce<number>((sum, p) => sum + (Number(p) || 0), 0);

  const handleSavePercentages = () => {
    if (totalPercentage !== 100) {
      alert(`Tổng tỷ lệ phải bằng đúng 100% (Hiện tại: ${totalPercentage}%)`);
      return;
    }
    Object.entries(tempPercentages).forEach(([id, p]) => {
      updateFinancialJar(id, p);
    });
    setIsEditingPercentages(false);
    triggerHaptic('success');
  };

  return (
    <div className="space-y-4">
      {/* Intro Banner & Income Calculator Input */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-700/60 border border-teal-500/30 text-teal-200">
                <PieChartIcon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight">Quy tắc 6 Chiếc Hũ</h2>
                <p className="text-xs text-teal-200/80">Phương pháp quản lý tài chính kinh điển của T. Harv Eker</p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowExplanation(!showExplanation);
              }}
              className="px-2.5 py-1 text-xs rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-teal-100 flex items-center gap-1 transition"
            >
              <Info className="w-3.5 h-3.5" />
              {showExplanation ? 'Ẩn hướng dẫn' : 'Ý nghĩa 6 hũ'}
            </button>
          </div>

          {showExplanation && (
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-teal-100 space-y-1.5 animate-fade-in">
              <p className="font-semibold text-white">Cách phân bổ thu nhập thông minh:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-teal-100/90 leading-relaxed">
                <li><strong className="text-white">NEC (55%):</strong> Chi tiêu sinh hoạt thiết yếu (Ăn uống, thuê nhà, xăng xe, hóa đơn).</li>
                <li><strong className="text-white">FFA (10%):</strong> Tự do tài chính (Đầu tư, sinh lời, tạo dòng tiền thụ động).</li>
                <li><strong className="text-white">LTSS (10%):</strong> Tiết kiệm dài hạn (Mua nhà, xe, quỹ phòng hộ khẩn cấp).</li>
                <li><strong className="text-white">EDU (10%):</strong> Giáo dục & Tri thức (Khóa học, sách vở, kỹ năng mới).</li>
                <li><strong className="text-white">PLAY (10%):</strong> Thưởng cho bản thân & Giải trí (Du lịch, liên hoan, sở thích).</li>
                <li><strong className="text-white">GIVE (5%):</strong> Cho đi & Thiện nguyện (Giúp đỡ người thân, từ thiện, quà tặng).</li>
              </ul>
            </div>
          )}

          {/* Income Calculator Bar */}
          <div className="pt-2 border-t border-teal-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="text-xs font-semibold text-teal-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                Mức thu nhập phân bổ tháng này:
              </label>
              {monthIncome > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCustomIncomeStr(monthIncome.toString());
                  }}
                  className="text-[11px] font-bold text-teal-300 hover:text-white underline underline-offset-2 flex items-center gap-1 self-start sm:self-auto"
                >
                  Lấy từ Thu nhập tháng ({formatMoney(monthIncome)})
                </button>
              )}
            </div>

            <div className="mt-2 relative">
              <input
                type="number"
                min="0"
                step="500000"
                value={customIncomeStr}
                onChange={e => setCustomIncomeStr(e.target.value)}
                placeholder="Nhập số tiền thu nhập..."
                className="w-full px-4 py-2.5 bg-black/25 border border-teal-500/40 rounded-2xl text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-teal-400/50"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-teal-300">VNĐ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chi tiết 6 Hũ tài chính
          </span>
          {isEditingPercentages && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                totalPercentage === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800 animate-pulse'
              }`}
            >
              Tổng: {totalPercentage}% {totalPercentage === 100 ? '✓' : '(chưa chuẩn 100%)'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditingPercentages ? (
            <>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsEditingPercentages(false);
                }}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePercentages}
                className="px-3 py-1 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition shadow-sm flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Lưu tỷ lệ
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStartEdit}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition flex items-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Đổi tỷ lệ %
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                title="Khôi phục mặc định"
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Jars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {financialJars.map(jar => {
          const currentPercent = isEditingPercentages
            ? tempPercentages[jar.id] ?? jar.percentage
            : jar.percentage;

          const allocatedAmount = Math.round((parsedIncome * currentPercent) / 100);
          const actualSpent = jarSpending[jar.id] || 0;
          const remainingInJar = allocatedAmount - actualSpent;
          const isOverBudget = actualSpent > allocatedAmount && allocatedAmount > 0;
          const spendPercent = allocatedAmount > 0 ? Math.min(100, Math.round((actualSpent / allocatedAmount) * 100)) : 0;

          return (
            <div
              key={jar.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all space-y-3"
            >
              {/* Jar Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: jar.color }}
                  >
                    <CategoryIcon name={jar.icon} size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-800">{jar.name}</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {jar.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{jar.description}</p>
                  </div>
                </div>

                {/* Percentage Badge / Slider input */}
                {isEditingPercentages ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentPercent}
                      onChange={e => handlePercentageChange(jar.id, parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1 text-xs font-bold text-center border border-teal-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                ) : (
                  <span
                    className="text-xs font-black px-2.5 py-1 rounded-xl text-white shadow-xs"
                    style={{ backgroundColor: jar.color }}
                  >
                    {jar.percentage}%
                  </span>
                )}
              </div>

              {/* Allocated vs Spent Numbers */}
              <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-500 font-medium">Được phân bổ:</span>
                  <span className="font-extrabold text-slate-800 text-sm">{formatMoney(allocatedAmount)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-500 font-medium">Thực tế đã chi:</span>
                  <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatMoney(actualSpent)}
                  </span>
                </div>

                {/* Progress bar of jar consumption */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-rose-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${Math.min(100, (actualSpent / (allocatedAmount || 1)) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] font-semibold pt-0.5">
                  <span className="text-slate-400">Đã dùng {spendPercent}% hạn mức</span>
                  {isOverBudget ? (
                    <span className="text-rose-600 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      Vượt {formatMoney(actualSpent - allocatedAmount)}
                    </span>
                  ) : (
                    <span className="text-teal-700 font-bold">
                      Còn lại {formatMoney(remainingInJar)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Reset 6 Jars Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Khôi phục quy tắc 6 Chiếc Hũ"
        message="Bạn có chắc muốn khôi phục tỷ lệ phân bổ của 6 chiếc hũ tài chính về chuẩn mặc định của T. Harv Eker (55% Thiết yếu, 10% Tự do tài chính, 10% Tiết kiệm dài hạn, 10% Giáo dục, 10% Hưởng thụ, 5% Cho đi)?"
        confirmText="Khôi phục chuẩn"
        type="warning"
        onConfirm={() => {
          resetFinancialJars();
          setShowResetConfirm(false);
          triggerHaptic('success');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
