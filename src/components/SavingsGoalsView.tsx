import React, { useState, useMemo } from 'react';
import {
  Target,
  PiggyBank,
  Plus,
  Trophy,
  Calendar,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  PieChart as PieChartIcon,
  Sparkles,
  Filter,
  Search,
  ChevronRight
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { SavingsGoal } from '../types/expense';
import { triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { SavingsGoalModal } from './SavingsGoalModal';
import { GoalDepositWithdrawModal } from './GoalDepositWithdrawModal';
import { SavingsGoalDetailModal } from './SavingsGoalDetailModal';
import { FinancialJarsView } from './FinancialJarsView';

export const SavingsGoalsView: React.FC = () => {
  const { savingsGoals, formatMoney, totalSavingsCurrent, totalSavingsTarget } = useExpense();

  const [activeSubTab, setActiveSubTab] = useState<'goals' | 'jars'>('goals');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'achieved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);

  const [detailGoal, setDetailGoal] = useState<SavingsGoal | null>(null);

  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);
  const [depositDefaultAction, setDepositDefaultAction] = useState<'deposit' | 'withdraw'>('deposit');

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return savingsGoals.filter(goal => {
      // Filter status
      if (filterStatus === 'in_progress' && goal.status === 'achieved') return false;
      if (filterStatus === 'achieved' && goal.status !== 'achieved') return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return goal.name.toLowerCase().includes(q) || (goal.note && goal.note.toLowerCase().includes(q));
      }

      return true;
    });
  }, [savingsGoals, filterStatus, searchQuery]);

  const achievedCount = savingsGoals.filter(g => g.status === 'achieved').length;
  const inProgressCount = savingsGoals.length - achievedCount;
  const overallPercent = totalSavingsTarget > 0 ? Math.round((totalSavingsCurrent / totalSavingsTarget) * 100) : 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-teal-700" />
            Tích lũy & Mục tiêu
          </h1>
          <p className="text-xs text-slate-500">Heo đất tiết kiệm và quy tắc phân bổ 6 chiếc hũ</p>
        </div>

        {/* Subtabs switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab('goals');
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'goals'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Mục tiêu ({savingsGoals.length})
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab('jars');
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeSubTab === 'jars'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            6 Chiếc Hũ
          </button>
        </div>
      </div>

      {activeSubTab === 'jars' ? (
        <FinancialJarsView />
      ) : (
        <>
          {/* Overview KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Saved */}
            <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-teal-200/80 font-medium">Đã tích lũy</span>
                <span className="p-2 rounded-xl bg-teal-700/50 text-teal-200">
                  <PiggyBank className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black tracking-tight">{formatMoney(totalSavingsCurrent)}</p>
                <div className="flex items-center gap-1 text-[11px] text-teal-300 mt-1">
                  <span>Mục tiêu: {formatMoney(totalSavingsTarget)}</span>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Tiến độ chung</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-2xl font-black text-slate-800">{overallPercent}%</p>
                  <span className="text-xs text-slate-500 font-medium">
                    {savingsGoals.length} mục tiêu
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 rounded-full h-full transition-all duration-500"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Achievement Counts */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Trạng thái heo đất</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Trophy className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Đang nuôi</span>
                  <span className="text-base font-extrabold text-teal-700">{inProgressCount}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-600 block font-semibold uppercase">Đạt mốc</span>
                  <span className="text-base font-extrabold text-emerald-800">{achievedCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setFilterStatus('all');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  filterStatus === 'all'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tất cả ({savingsGoals.length})
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setFilterStatus('in_progress');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  filterStatus === 'in_progress'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Đang tích lũy ({inProgressCount})
              </button>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setFilterStatus('achieved');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                  filterStatus === 'achieved'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Đã đạt mốc ({achievedCount})
              </button>
            </div>

            {/* Create Goal Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setGoalToEdit(null);
                setIsGoalModalOpen(true);
              }}
              className="py-2 px-3.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-2xl shadow-sm shadow-teal-700/20 transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Mục tiêu mới
            </button>
          </div>

          {/* Goal Cards Grid */}
          {filteredGoals.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Chưa có mục tiêu nào phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bắt đầu đặt ra những kế hoạch tài chính cụ thể (mua sắm, du lịch, đầu tư, quỹ khẩn cấp) để tích lũy ngay hôm nay!
              </p>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setGoalToEdit(null);
                  setIsGoalModalOpen(true);
                }}
                className="py-2.5 px-4 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tạo mục tiêu đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredGoals.map(goal => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetDateObj = new Date(goal.targetDate);
                const diffTime = targetDateObj.getTime() - today.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isAchieved = goal.status === 'achieved' || goal.currentAmount >= goal.targetAmount;

                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: goal.color }}
                        >
                          <CategoryIcon name={goal.icon} size={22} className="text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-800 transition">
                              {goal.name}
                            </h3>
                            {isAchieved && (
                              <span className="p-0.5 rounded-full bg-amber-400 text-amber-950" title="Đã hoàn thành">
                                <Trophy className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {goal.targetDate}
                            <span>•</span>
                            <span className={daysLeft < 0 ? 'text-rose-500 font-semibold' : 'text-slate-600'}>
                              {daysLeft >= 0 ? `Còn ${daysLeft} ngày` : 'Quá hạn'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Percentage Badge */}
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-xl shadow-xs ${
                          isAchieved
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-extrabold text-slate-800 text-base">
                          {formatMoney(goal.currentAmount)}
                        </span>
                        <span className="text-slate-400 font-medium">
                          Mục tiêu: {formatMoney(goal.targetAmount)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: goal.color,
                            width: `${percent}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>
                          {goal.contributions?.length || 0} lần tích lũy
                        </span>
                        <span>
                          {remaining > 0 ? `Còn thiếu ${formatMoney(remaining)}` : '🎉 Đã đạt mục tiêu!'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setDepositModalGoal(goal);
                          setDepositDefaultAction('deposit');
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center justify-center gap-1 border border-teal-200/60"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5 text-teal-600" />
                        Nạp heo đất
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setDetailGoal(goal);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 border border-slate-200"
                      >
                        Chi tiết
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Goal Modal (Create / Edit) */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      {/* Goal Deposit / Withdraw Modal */}
      <GoalDepositWithdrawModal
        isOpen={!!depositModalGoal}
        onClose={() => setDepositModalGoal(null)}
        goal={depositModalGoal}
        defaultAction={depositDefaultAction}
      />

      {/* Goal Detail Modal */}
      <SavingsGoalDetailModal
        isOpen={!!detailGoal}
        onClose={() => setDetailGoal(null)}
        goal={detailGoal}
        onOpenDeposit={() => {
          if (detailGoal) {
            setDepositModalGoal(detailGoal);
            setDepositDefaultAction('deposit');
          }
        }}
        onOpenWithdraw={() => {
          if (detailGoal) {
            setDepositModalGoal(detailGoal);
            setDepositDefaultAction('withdraw');
          }
        }}
        onEdit={() => {
          if (detailGoal) {
            setGoalToEdit(detailGoal);
            setDetailGoal(null);
            setIsGoalModalOpen(true);
          }
        }}
      />
    </div>
  );
};
