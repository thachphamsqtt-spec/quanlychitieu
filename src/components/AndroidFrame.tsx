import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Sparkles, Smartphone, Monitor, ShieldCheck, Clock } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const { deviceMode, setDeviceMode, t } = useExpense();
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 transition-all duration-300 select-none">
      {/* Top Desktop Controls Bar (only visible on tablet/desktop) */}
      <aside aria-label="Device Preview Toolbar" className="w-full max-w-lg mb-3 px-3 hidden sm:flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-slate-200">Android Material You</span>
          <span className="text-[10px] bg-slate-800 text-teal-400 px-2 py-0.5 rounded-full border border-slate-700">
            Android 15
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setDeviceMode('phone')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition text-xs font-medium ${
              deviceMode === 'phone' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Khung Điện Thoại
          </button>
          <button
            onClick={() => setDeviceMode('full')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition text-xs font-medium ${
              deviceMode === 'full' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Mở rộng
          </button>
        </div>
      </aside>

      {/* Main Container: Android Phone Frame OR Full-width Container */}
      <div
        className={`w-full transition-all duration-300 relative bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col shadow-2xl overflow-hidden ${
          deviceMode === 'phone'
            ? 'max-w-[428px] h-[100dvh] sm:h-[860px] sm:max-h-[92vh] sm:rounded-[44px] sm:border-[10px] sm:border-slate-800 sm:ring-1 sm:ring-slate-700'
            : 'max-w-3xl min-h-[100dvh] sm:min-h-[860px] sm:rounded-3xl sm:border border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Android Status Bar */}
        <div className="w-full bg-slate-900 text-white px-6 pt-3 pb-2 flex items-center justify-between z-30 select-none shrink-0 border-b border-slate-800/40">
          {/* Time */}
          <span className="text-xs font-semibold tracking-tight text-slate-200">
            {currentTime}
          </span>

          {/* Camera Punch Hole (in phone frame mode) */}
          {deviceMode === 'phone' && (
            <div className="w-4 h-4 rounded-full bg-black/90 border border-slate-700/50 flex items-center justify-center -mt-1 shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>
          )}

          {/* Status Icons: 5G, Wifi, Battery */}
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[10px] font-bold tracking-wider text-slate-400">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-slate-300">92%</span>
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Inner Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          {children}
        </div>

        {/* Android System Navigation Gesture Bar at bottom */}
        <div className="w-full bg-slate-100 dark:bg-slate-950 py-1.5 flex items-center justify-center shrink-0 border-t border-slate-200/50 dark:border-slate-900">
          <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
};
