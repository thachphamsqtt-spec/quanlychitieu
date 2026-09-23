import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
  Users,
  Plus,
  Check,
  ShieldCheck,
  ChevronDown,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderBarProps {
  onOpenSettings: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenSettings }) => {
  const {
    selectedMonth,
    setSelectedMonth,
    currentUser,
    savedUsers,
    switchUser,
    logout,
    googleUser,
    isSyncing,
    syncNow,
    loginWithGoogle,
    t,
    language,
  } = useExpense();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handlePrevMonth = () => {
    triggerHaptic('light');
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const [yearStr, monthStr] = selectedMonth.split('-');
  const displayMonth = language === 'en' ? `${monthStr}/${yearStr}` : `T${monthStr}/${yearStr}`;

  return (
    <header className="shrink-0 sticky top-0 z-30 bg-slate-900 text-white px-3 sm:px-4 py-2.5 shadow-md flex items-center justify-between select-none gap-2">
      {/* App Logo & Title */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shrink-0">
          <span className="text-white font-bold text-sm">₫</span>
        </div>
        <div className="min-w-0 hidden xs:block sm:block">
          <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1 leading-tight">
            <span>{t('appShortName')}</span>
          </h1>
          <p className="text-[10px] text-teal-300/80 leading-none mt-0.5 truncate">
            {currentUser?.displayName || 'Cá nhân'}
          </p>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center bg-slate-800/90 rounded-full px-1 py-0.5 border border-slate-700 shrink-0">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-700 text-slate-300 rounded-full active:scale-95 transition"
          title="Tháng trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] sm:text-xs font-semibold px-1.5 text-slate-200 min-w-[70px] text-center font-mono">
          {displayMonth}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-700 text-slate-300 rounded-full active:scale-95 transition"
          title="Tháng sau"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Controls: User Profile Menu & Settings */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative" ref={menuRef}>
        {/* User Account Button */}
        {currentUser && (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsUserMenuOpen(!isUserMenuOpen)}
            }
            className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 transition active:scale-95 text-left"
            title="Tài khoản người dùng"
          >
            <div
              style={{ backgroundColor: currentUser.color || '#0d9488' }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs shrink-0"
            >
              {currentUser.avatar || '👤'}
            </div>
            <span className="text-xs font-bold text-slate-200 max-w-[85px] sm:max-w-[120px] truncate">
              {currentUser.displayName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenSettings();
          }}
          className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition active:scale-95"
          title={t('settings')}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Account Popover Dropdown */}
        <AnimatePresence>
          {isUserMenuOpen && currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-3xl shadow-2xl p-4 z-50 text-slate-100 flex flex-col gap-3"
            >
              {/* Active User Card */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div
                  style={{ backgroundColor: currentUser.color || '#0d9488' }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0"
                >
                  {currentUser.avatar || '👤'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate leading-tight">
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-teal-400 font-mono truncate">@{currentUser.username}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Dữ liệu cá nhân riêng biệt</span>
                  </div>
                </div>
              </div>

              {/* Google Cloud Sync Status */}
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                    googleUser ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Cloud className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate">
                      {googleUser ? 'Đám mây Google' : 'Chưa kết nối Cloud'}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate">
                      {googleUser ? (googleUser.email || 'Đã kết nối') : 'Dữ liệu lưu cục bộ'}
                    </p>
                  </div>
                </div>

                {googleUser ? (
                  <button
                    onClick={async () => {
                      try {
                        await syncNow();
                      } catch (e) {
                        // handled
                      }
                    }}
                    disabled={isSyncing}
                    className="px-2 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 transition active:scale-95"
                    title="Đồng bộ ngay"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang lưu...' : 'Đồng bộ'}</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      try {
                        await loginWithGoogle();
                      } catch (e) {
                        // handled
                      }
                    }}
                    disabled={isSyncing}
                    className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-teal-600 text-teal-300 hover:text-white text-[10px] font-bold flex items-center gap-1 shrink-0 transition active:scale-95"
                  >
                    <span>Kết nối</span>
                  </button>
                )}
              </div>

              {/* Saved Accounts on Device */}
              {savedUsers.length > 1 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5 px-1">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>Tài khoản khác trên máy</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {savedUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (u.id !== currentUser.id) {
                            logout();
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition text-xs ${
                          u.id === currentUser.id
                            ? 'bg-teal-900/40 border border-teal-500/40 text-teal-200'
                            : 'bg-slate-950/40 hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            style={{ backgroundColor: u.color || '#0d9488' }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                          >
                            {u.avatar || '👤'}
                          </div>
                          <span className="truncate font-medium">{u.displayName}</span>
                        </div>
                        {u.id === currentUser.id ? (
                          <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] text-slate-500">Đăng nhập</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 border-t border-slate-800 space-y-1.5">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full py-2 px-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Cài đặt tài khoản & ví</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition text-xs font-bold flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
