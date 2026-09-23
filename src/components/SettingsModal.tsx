import React, { useRef, useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Lock,
  Unlock,
  Bell,
  Globe,
  Coins,
  Sun,
  Moon,
  FolderKanban,
  Repeat,
  ChevronRight,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { triggerHaptic } from '../utils/formatters';
import { CurrencyCode, AppLanguage, AppTheme } from '../types/expense';
import { CategoryManagerModal } from './CategoryManagerModal';
import { RecurringManagerModal } from './RecurringManagerModal';
import { ConfirmModal } from './ConfirmModal';
import { InstallAppModal } from './InstallAppModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    googleUser,
    savedUsers,
    switchUser,
    logout,
    deleteAccount,
    isSyncing,
    lastSyncedAt,
    loginWithGoogle,
    logoutGoogle,
    syncNow,
    pullFromCloud,
    exportToCSV,
    exportToJSON,
    importFromJSON,
    resetToDefaultData,
    clearAllData,
    settings,
    updateSettings,
    setPinCode,
    lockApp,
    t,
    language,
  } = useExpense();

  const [message, setMessage] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // PIN code setup states
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');

  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const askConfirmation = (config: {
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    onConfirm: () => void;
  }) => {
    setConfirmConfig({
      isOpen: true,
      title: config.title,
      message: config.message,
      type: config.type || 'warning',
      confirmText: config.confirmText || 'Xác nhận',
      onConfirm: () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        config.onConfirm();
      },
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importFromJSON(content);
      if (success) {
        setMessage('Đã khôi phục dữ liệu sao lưu thành công!');
        triggerHaptic('success');
      } else {
        setMessage('File sao lưu JSON không đúng định dạng!');
      }
      setTimeout(() => setMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setMessage('Vui lòng nhập đúng 4 chữ số cho mã PIN!');
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setPinCode(newPinInput);
    setIsChangingPin(false);
    setNewPinInput('');
    setMessage('Đã thiết lập mã PIN khóa ứng dụng thành công!');
    setTimeout(() => setMessage(null), 3500);
  };

  const handleRemovePin = () => {
    askConfirmation({
      title: 'Hủy mã PIN bảo vệ',
      message: 'Bạn có chắc muốn gỡ bỏ mã PIN bảo vệ khóa ứng dụng không?',
      confirmText: 'Gỡ mã PIN',
      type: 'warning',
      onConfirm: () => {
        setPinCode(null);
        setMessage('Đã gỡ bỏ mã PIN bảo vệ.');
        setTimeout(() => setMessage(null), 3000);
      },
    });
  };

  const handleTestNotification = async () => {
    triggerHaptic('light');
    if (!('Notification' in window)) {
      alert('Trình duyệt này không hỗ trợ Web Notification API.');
      return;
    }

    try {
      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        new Notification('Sổ Thu Chi Android 📱', {
          body: 'Đã đến giờ kiểm tra và ghi chép chi tiêu hôm nay rồi bạn nhé!',
          icon: '/favicon.ico',
        });
        setMessage('Đã gửi thông báo nhắc nhở thành công!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        alert('Quyền thông báo chưa được cấp phép trong trình duyệt.');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kích hoạt thông báo trên môi trường này.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('settings')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          {/* Section: Install PWA on Phone */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setShowInstallModal(true);
            }}
            className="w-full p-3.5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white rounded-2xl shadow-md hover:shadow-lg active:scale-98 transition flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  {language === 'vi' ? 'Cài đặt vào điện thoại Android' : 'Install on Android Phone'}
                  <span className="px-1.5 py-0.5 text-[9px] bg-emerald-400 text-slate-950 font-black rounded-md">
                    PWA
                  </span>
                </h4>
                <p className="text-[10px] text-teal-100">
                  {language === 'vi' ? 'Dùng toàn màn hình, mượt mà & không cần mạng' : 'Full-screen app, offline ready'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-teal-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Section: User Account Management */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Tài khoản người dùng
            </span>

            {currentUser ? (
              <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-sm space-y-3">
                {/* Profile info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{ backgroundColor: currentUser.color || '#0d9488' }}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md shrink-0"
                    >
                      {currentUser.avatar || '👤'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {currentUser.displayName}
                      </h4>
                      <p className="text-[10px] text-teal-400 font-mono truncate">@{currentUser.username}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span className="text-[9px] text-emerald-300 font-medium">Không gian dữ liệu riêng</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      askConfirmation({
                        title: 'Đăng xuất tài khoản',
                        message: `Bạn có chắc muốn đăng xuất khỏi tài khoản "${currentUser.displayName}" không?`,
                        confirmText: 'Đăng xuất',
                        type: 'warning',
                        onConfirm: () => {
                          onClose();
                          logout();
                        },
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/60 transition"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Account Actions */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-bold rounded-xl transition border border-slate-700"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Đổi tài khoản</span>
                  </button>

                  <button
                    onClick={() => {
                      askConfirmation({
                        title: 'Xóa tài khoản khỏi thiết bị',
                        message: `Bạn có chắc muốn xóa tài khoản "${currentUser.displayName}" (@${currentUser.username}) cùng toàn bộ dữ liệu chi tiêu trên máy này không?`,
                        confirmText: 'Xác nhận xóa',
                        type: 'danger',
                        onConfirm: () => {
                          deleteAccount(currentUser.id);
                          setMessage('Đã xóa tài khoản thành công.');
                          setTimeout(() => setMessage(null), 3000);
                        },
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-300 text-[11px] font-bold rounded-xl transition border border-rose-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Xóa tài khoản này</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Section: Google Cloud Sync */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'vi' ? 'Đồng bộ Đám mây Google' : 'Google Cloud Sync'}
              </span>
              {googleUser && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {language === 'vi' ? 'Tự động' : 'Live Sync'}
                </span>
              )}
            </div>

            {googleUser ? (
              <div className="p-3.5 bg-gradient-to-br from-teal-900/40 via-slate-900 to-slate-800 border border-teal-500/30 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {googleUser.photoURL ? (
                      <img
                        src={googleUser.photoURL}
                        alt="Google avatar"
                        className="w-9 h-9 rounded-full border border-teal-400/40 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/40">
                        <Cloud className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {googleUser.displayName || 'Google User'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-md font-bold">
                          Cloud
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 truncate font-mono">
                        {googleUser.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      askConfirmation({
                        title: language === 'vi' ? 'Ngắt kết nối Google' : 'Disconnect Google',
                        message: language === 'vi'
                          ? 'Dữ liệu trên máy của bạn sẽ được giữ nguyên, nhưng sẽ dừng đồng bộ tự động với Google Cloud cho đến khi đăng nhập lại.'
                          : 'Your local data remains intact, but auto-syncing to Google Cloud will pause until you sign in again.',
                        confirmText: language === 'vi' ? 'Ngắt kết nối' : 'Disconnect',
                        type: 'warning',
                        onConfirm: async () => {
                          await logoutGoogle();
                          setMessage(language === 'vi' ? 'Đã ngắt kết nối Google Cloud' : 'Disconnected from Google Cloud');
                          setTimeout(() => setMessage(null), 3000);
                        },
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition shrink-0"
                    title={language === 'vi' ? 'Đăng xuất Google' : 'Sign out Google'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <span>{language === 'vi' ? 'Đồng bộ gần nhất:' : 'Last synced:'}</span>
                  <span className="font-mono text-teal-300">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : (language === 'vi' ? 'Vừa mới đây' : 'Just now')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isSyncing}
                    onClick={async () => {
                      triggerHaptic('medium');
                      try {
                        await syncNow();
                        setMessage(language === 'vi' ? 'Đã đẩy dữ liệu lên Google Cloud thành công!' : 'Pushed data to Google Cloud!');
                        setTimeout(() => setMessage(null), 3000);
                      } catch (e: any) {
                        setMessage(`Lỗi: ${e?.message || 'Không thể đồng bộ'}`);
                        setTimeout(() => setMessage(null), 4000);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-[11px] font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? (language === 'vi' ? 'Đang gửi...' : 'Syncing...') : (language === 'vi' ? 'Đẩy lên mây' : 'Push to Cloud')}</span>
                  </button>

                  <button
                    disabled={isSyncing}
                    onClick={() => {
                      askConfirmation({
                        title: language === 'vi' ? 'Tải lại từ Đám mây' : 'Pull from Cloud',
                        message: language === 'vi'
                          ? 'Dữ liệu trên máy sẽ được cập nhật đồng bộ hoàn toàn theo bản mới nhất được lưu trên Google Cloud. Bạn có muốn tiếp tục?'
                          : 'Your local data will be replaced by the latest copy stored on Google Cloud. Proceed?',
                        confirmText: language === 'vi' ? 'Tải về' : 'Pull data',
                        type: 'info',
                        onConfirm: async () => {
                          try {
                            await pullFromCloud();
                            setMessage(language === 'vi' ? 'Đã tải dữ liệu từ Google Cloud thành công!' : 'Pulled data from Google Cloud!');
                            setTimeout(() => setMessage(null), 3000);
                          } catch (e: any) {
                            setMessage(`Lỗi: ${e?.message || 'Không thể tải'}`);
                            setTimeout(() => setMessage(null), 4000);
                          }
                        },
                      });
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-bold rounded-xl transition border border-slate-700 disabled:opacity-50"
                  >
                    <CloudDownload className="w-3.5 h-3.5 text-teal-400" />
                    <span>{language === 'vi' ? 'Tải từ mây' : 'Pull from Cloud'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {language === 'vi' ? 'Đồng bộ đa thiết bị tự động' : 'Automatic Multi-Device Sync'}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'vi'
                        ? 'Đăng nhập Google để đồng bộ tự động giữa Điện thoại & Máy tính'
                        : 'Sign in with Google to auto-sync across Mobile and Desktop'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    triggerHaptic('medium');
                    try {
                      await loginWithGoogle();
                      setMessage(language === 'vi' ? 'Đã kết nối Google Cloud thành công!' : 'Connected Google Cloud successfully!');
                      setTimeout(() => setMessage(null), 3000);
                    } catch (err: any) {
                      setMessage(`Lỗi: ${err?.message || 'Không thể đăng nhập Google'}`);
                      setTimeout(() => setMessage(null), 4000);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs active:scale-98 transition"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{language === 'vi' ? 'Kết nối Google Cloud' : 'Connect Google Cloud'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Section: General Preferences */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {t('general')}
            </span>

            {/* Currency */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Coins className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{t('currency')}</span>
                  <span className="text-[10px] text-slate-400">{t('currencyFormat')}</span>
                </div>
              </div>

              <select
                value={settings.currency}
                onChange={e => updateSettings({ currency: e.target.value as CurrencyCode })}
                className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-hidden"
              >
                <option value="VND">VNĐ (₫)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            {/* Language */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{t('language')}</span>
                  <span className="text-[10px] text-slate-400">
                    {settings.language === 'vi' ? 'Tiếng Việt' : 'English'}
                  </span>
                </div>
              </div>

              <div className="flex items-center bg-slate-200 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-300/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updateSettings({ language: 'vi' });
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    settings.language === 'vi'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updateSettings({ language: 'en' });
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    settings.language === 'en'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  {settings.theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{t('theme')}</span>
                  <span className="text-[10px] text-slate-400">
                    {settings.theme === 'dark' ? t('themeDark') : settings.theme === 'light' ? t('themeLight') : t('themeSystem')}
                  </span>
                </div>
              </div>

              <div className="flex items-center bg-slate-200 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-300/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updateSettings({ theme: 'light' });
                  }}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                    settings.theme === 'light'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={t('themeLight')}
                >
                  <Sun className="w-3 h-3" />
                  <span>{t('themeLight')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updateSettings({ theme: 'dark' });
                  }}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                    settings.theme === 'dark'
                      ? 'bg-slate-800 dark:bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={t('themeDark')}
                >
                  <Moon className="w-3 h-3" />
                  <span>{t('themeDark')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    updateSettings({ theme: 'system' });
                  }}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                    settings.theme === 'system'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={t('themeSystem')}
                >
                  <span>{t('themeSystem')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: App Security / PIN Lock */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {t('pinLock')}
            </span>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    {settings.pinCode ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{t('pinLock')}</span>
                    <span className="text-[10px] text-slate-400">
                      {settings.pinCode ? (language === 'vi' ? 'Đang bật (Mã 4 số)' : 'Enabled (4 digits)') : (language === 'vi' ? 'Chưa thiết lập' : 'Not set')}
                    </span>
                  </div>
                </div>

                {settings.pinCode ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        lockApp();
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-purple-600 text-white text-[11px] font-bold rounded-lg shadow-xs hover:bg-purple-500"
                    >
                      {language === 'vi' ? 'Khóa ngay' : 'Lock now'}
                    </button>
                    <button
                      onClick={handleRemovePin}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline ml-1"
                    >
                      {language === 'vi' ? 'Gỡ PIN' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsChangingPin(true)}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
                  >
                    {language === 'vi' ? 'Bật mã PIN' : 'Set PIN'}
                  </button>
                )}
              </div>

              {isChangingPin && (
                <form onSubmit={handleSavePin} className="pt-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Nhập 4 chữ số"
                    value={newPinInput}
                    onChange={e => setNewPinInput(e.target.value)}
                    className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono tracking-widest text-center text-slate-900 dark:text-slate-100"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
                  >
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPin(false);
                      setNewPinInput('');
                    }}
                    className="px-2 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs rounded-xl"
                  >
                    {t('cancel')}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Section: Daily Reminders */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {t('notifications')}
            </span>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{t('notifications')}</span>
                    <span className="text-[10px] text-slate-400">{t('reminderTime')}: {settings.reminderTime}</span>
                  </div>
                </div>

                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={e => updateSettings({ reminderTime: e.target.value })}
                  className="text-xs font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1"
                />
              </div>

              <button
                type="button"
                onClick={handleTestNotification}
                className="w-full py-1.5 text-center text-xs font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-xl transition"
              >
                🔔 {t('testNotification')}
              </button>
            </div>
          </div>

          {/* Section: Quick Tools */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Công cụ quản lý' : 'Management Tools'}
            </span>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-left transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('categoryManager')}</h4>
                  <p className="text-[10px] text-slate-400">{language === 'vi' ? 'Tạo, sửa hoặc xóa danh mục thu chi' : 'Create, edit, or delete categories'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setShowRecurringModal(true)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-left transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('recurringManager')}</h4>
                  <p className="text-[10px] text-slate-400">{language === 'vi' ? 'Tiền nhà, Netflix, tiền mạng...' : 'Rent, Netflix, internet bills...'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Section: Backup & Export */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Sao lưu & Xuất file' : 'Backup & Export'}
            </span>

            <button
              onClick={() => {
                exportToCSV();
                triggerHaptic('success');
                setMessage(language === 'vi' ? 'Đã xuất file CSV tiếng Việt cho Excel!' : 'Exported CSV file for Excel!');
                setTimeout(() => setMessage(null), 3000);
              }}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3 text-left transition"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('exportCSV')}</h4>
                <p className="text-[10px] text-slate-400">{language === 'vi' ? 'Định dạng UTF-8 hiển thị chuẩn tiếng Việt' : 'UTF-8 format with Excel support'}</p>
              </div>
            </button>

            <button
              onClick={() => {
                exportToJSON();
                triggerHaptic('success');
                setMessage(language === 'vi' ? 'Đã tải xuống file sao lưu JSON!' : 'Downloaded JSON backup file!');
                setTimeout(() => setMessage(null), 3000);
              }}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3 text-left transition"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('exportJSON')}</h4>
                <p className="text-[10px] text-slate-400">{language === 'vi' ? 'Bao gồm toàn bộ giao dịch, ví, ngân sách' : 'Includes all transactions, wallets, budgets'}</p>
              </div>
            </button>

            {/* Hidden file input for import */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3 text-left transition"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{t('importJSON')}</h4>
                <p className="text-[10px] text-slate-400">{language === 'vi' ? 'Nhập dữ liệu từ file JSON đã lưu' : 'Import data from JSON backup'}</p>
              </div>
            </button>
          </div>

          {/* Section: Reset data */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Dữ liệu & Khôi phục' : 'Data & Reset'}
            </span>

            <button
              onClick={() => {
                askConfirmation({
                  title: t('resetDefault'),
                  message: language === 'vi' ? 'Toàn bộ danh mục, giao dịch, ngân sách, nợ, mục tiêu tiết kiệm và chia tiền sẽ được khôi phục về dữ liệu mẫu mới nhất. Bạn có muốn tiếp tục?' : 'All categories, transactions, budgets, debts, and savings will be reset to sample data. Proceed?',
                  confirmText: t('resetDefault'),
                  type: 'warning',
                  onConfirm: () => {
                    resetToDefaultData();
                    setMessage(language === 'vi' ? 'Đã nạp lại dữ liệu mẫu thành công!' : 'Reset to default data successfully!');
                    setTimeout(() => setMessage(null), 3500);
                  },
                });
              }}
              className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {t('resetDefault')}
            </button>

            <button
              onClick={() => {
                askConfirmation({
                  title: t('clearAllData'),
                  message: language === 'vi' ? 'CẢNH BÁO: Toàn bộ giao dịch, ngân sách, nợ, mục tiêu tiết kiệm, nhóm chia tiền sẽ bị xóa và số dư ví đặt về 0đ. Bạn có chắc chắn?' : 'WARNING: All transactions, budgets, debts, and savings will be cleared. Are you sure?',
                  confirmText: t('clearAllData'),
                  type: 'danger',
                  onConfirm: () => {
                    clearAllData();
                    setMessage(language === 'vi' ? 'Đã xóa sạch toàn bộ dữ liệu.' : 'Cleared all data successfully.');
                    setTimeout(() => setMessage(null), 3500);
                  },
                });
              }}
              className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('clearAllData')}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            {t('close')}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} />

      {/* Recurring Manager Modal */}
      <RecurringManagerModal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} />

      {/* Install App Modal */}
      <InstallAppModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </div>
  );
};
