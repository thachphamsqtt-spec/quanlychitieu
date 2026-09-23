import React from 'react';
import { AlertTriangle, Info, Trash2, RotateCcw, X } from 'lucide-react';
import { triggerHaptic } from '../utils/formatters';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getTheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
          iconBg: 'bg-rose-100 dark:bg-rose-950/60',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      case 'info':
        return {
          icon: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
          iconBg: 'bg-blue-100 dark:bg-blue-950/60',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-100 dark:bg-amber-950/60',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
            {theme.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onCancel();
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(type === 'danger' ? 'medium' : 'success');
              onConfirm();
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition shadow-sm ${theme.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
