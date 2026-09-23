import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck, KeyRound } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';

export const AppLockScreen: React.FC = () => {
  const { settings, verifyPin } = useExpense();
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  // If no PIN is configured or app is not locked, don't render lock screen
  if (!settings.pinCode || !settings.isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    triggerHaptic('light');
    const newPin = pin + digit;
    setPin(newPin);
    setHasError(false);

    if (newPin.length === 4) {
      const isCorrect = verifyPin(newPin);
      if (!isCorrect) {
        setHasError(true);
        triggerHaptic('warning');
        setTimeout(() => {
          setPin('');
          setHasError(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic('light');
    setPin(prev => prev.slice(0, -1));
    setHasError(false);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-xs flex flex-col items-center justify-between py-10 h-full max-h-[580px]">
        {/* Top Logo / Lock Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Khóa Ứng Dụng</h2>
            <p className="text-xs text-slate-400 mt-1">
              Nhập mã PIN 4 số để truy cập Sổ Thu Chi
            </p>
          </div>

          {/* PIN Dots */}
          <div className={`flex items-center gap-4 pt-4 ${hasError ? 'animate-shake' : ''}`}>
            {[0, 1, 2, 3].map(index => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    hasError
                      ? 'bg-rose-500 scale-110'
                      : isFilled
                      ? 'bg-teal-400 scale-110 shadow-sm shadow-teal-400'
                      : 'border-2 border-slate-600 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {hasError && (
            <p className="text-xs text-rose-400 font-medium animate-pulse">
              Mã PIN không đúng, vui lòng thử lại!
            </p>
          )}
        </div>

        {/* Android Material Keypad */}
        <div className="w-full grid grid-cols-3 gap-3.5 px-4 select-none">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-teal-600 text-xl font-bold text-slate-100 flex items-center justify-center transition active:scale-95 border border-slate-700/50 shadow-xs"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: Empty, 0, Backspace */}
          <div className="flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-slate-600" />
          </div>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-teal-600 text-xl font-bold text-slate-100 flex items-center justify-center transition active:scale-95 border border-slate-700/50 shadow-xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/60 active:bg-rose-600/50 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95 border border-slate-700/30"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          Dữ liệu mã hóa và bảo mật cục bộ
        </div>
      </div>
    </div>
  );
};
