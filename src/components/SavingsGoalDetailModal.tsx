import React from 'react';
import {
  X,
  Calendar,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  Sparkles,
  Trophy,
  TrendingUp,
  History,
  AlertCircle
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { SavingsGoal } from '../types/expense';
import { triggerHaptic } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmModal } from './ConfirmModal';

interface SavingsGoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onEdit: () => void;
}

export const SavingsGoalDetailModal: React.FC<SavingsGoalDetailModalProps> = ({
  isOpen,
  onClose,
  goal,
  onOpenDeposit,
  onOpenWithdraw,
  onEdit,
}) => {
  const { deleteSavingsGoal, formatMoney, getWalletById } = useExpense();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!isOpen || !goal) return null;

  const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  // Calculate days left
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDateObj = new Date(goal.targetDate);
  const diffTime = targetDateObj.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Smart pacing calculation
  const dailyNeeded = daysLeft > 0 && remaining > 0 ? Math.round(remaining / daysLeft) : 0;
  const monthlyNeeded = daysLeft > 0 && remaining > 0 ? Math.round((remaining / daysLeft) * 30) : 0;

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const isAchieved = goal.currentAmount >= goal.targetAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div
          className="p-5 text-white relative overflow-hidden flex flex-col justify-between"
          style={{ backgroundColor: goal.color }}
        >
          {/* Subtle background glow */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <CategoryIcon name={goal.icon} size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">{goal.name}</h2>
                  {isAchieved && (
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 rounded-full flex items-center gap-1 shadow-sm">
                      <Trophy className="w-3 h-3" />
                      Đạt mốc
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/80 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Hạn: {goal.targetDate}
                  </span>
                  <span>•</span>
                  <span>{daysLeft >= 0 ? `Còn ${daysLeft} ngày` : 'Đã quá hạn'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-black/15 text-white flex items-center justify-center hover:bg-black/25 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Large Numbers */}
          <div className="mt-5 relative z-10">
            <div className="flex justify-between items-baseline">
              <div>
                <p className="text-xs text-white/70">Đã tích lũy</p>
                <p className="text-2xl font-black tracking-tight">{formatMoney(goal.currentAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/70">Mục tiêu</p>
                <p className="text-base font-bold text-white/90">{formatMoney(goal.targetAmount)}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/20 rounded-full h-3 mt-3 overflow-hidden p-0.5">
              <div
                className="bg-white rounded-full h-full transition-all duration-500 shadow-sm"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1.5 text-white/90 font-semibold">
              <span>{percent}% hoàn thành</span>
              <span>{remaining > 0 ? `Còn thiếu ${formatMoney(remaining)}` : '🎉 Đã đạt 100%!'}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action Quick Bar */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenDeposit();
              }}
              className="py-2.5 px-3 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200/80 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-teal-100 transition shadow-sm"
            >
              <ArrowDownRight className="w-4 h-4 text-teal-600" />
              Nạp heo đất (+)
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenWithdraw();
              }}
              className="py-2.5 px-3 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 transition shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-600" />
              Rút tiền (-)
            </button>
          </div>

          {/* Smart Recommendation Card */}
          {remaining > 0 && daysLeft > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Gợi ý lộ trình để về đích đúng hạn:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                  <span className="text-[11px] text-amber-700 block">Cần tiết kiệm mỗi ngày:</span>
                  <span className="font-extrabold text-amber-950 text-sm">{formatMoney(dailyNeeded)}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                  <span className="text-[11px] text-amber-700 block">Cần tiết kiệm mỗi tháng:</span>
                  <span className="font-extrabold text-amber-950 text-sm">{formatMoney(monthlyNeeded)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Goal Note if present */}
          {goal.note && (
            <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-100">
              <span className="font-bold text-slate-700 block mb-0.5">Ghi chú mục tiêu:</span>
              {goal.note}
            </div>
          )}

          {/* Contribution History */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Lịch sử tích lũy ({goal.contributions?.length || 0})
              </h3>
            </div>

            {(!goal.contributions || goal.contributions.length === 0) ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                Chưa có giao dịch tích lũy nào. Hãy nạp tiền ngay!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {goal.contributions.map(contrib => {
                  const wallet = contrib.walletId ? getWalletById(contrib.walletId) : undefined;
                  const isDeposit = contrib.type === 'deposit';

                  return (
                    <div
                      key={contrib.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isDeposit ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isDeposit ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {isDeposit ? 'Nạp vào heo đất' : 'Rút ra từ heo đất'}
                            {contrib.note ? ` - ${contrib.note}` : ''}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {contrib.date} {wallet ? `• từ ${wallet.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-bold ${
                          isDeposit ? 'text-teal-700' : 'text-rose-700'
                        }`}
                      >
                        {isDeposit ? '+' : '-'}{formatMoney(contrib.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              onEdit();
            }}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Confirm Delete Savings Goal Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa mục tiêu tiết kiệm"
        message={`Bạn có chắc muốn xóa mục tiêu "${goal.name}" không?`}
        confirmText="Xóa mục tiêu"
        type="danger"
        onConfirm={() => {
          deleteSavingsGoal(goal.id);
          triggerHaptic('medium');
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
