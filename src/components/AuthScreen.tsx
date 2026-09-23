import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Trash2,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { AppUser } from '../types/auth';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils/formatters';

const AVATAR_OPTIONS = ['👤', '👨‍💼', '👩‍💼', '🧑‍💻', '🏠', '💼', '💰', '🚀', '🎯', '🌟'];
const COLOR_OPTIONS = [
  '#0d9488', // Teal
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
];

export const AuthScreen: React.FC = () => {
  const { login, register, savedUsers, deleteAccount, loginWithGoogle, isSyncing } = useExpense();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Register form state
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [selectedColor, setSelectedColor] = useState('#0d9488');

  // Focus password input when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setLoginUsername(selectedUser.username);
      setLoginPassword('');
      setErrorMsg(null);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 150);
    }
  }, [selectedUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const usernameToUse = selectedUser ? selectedUser.username : loginUsername.trim();

    if (!usernameToUse) {
      setErrorMsg('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Vui lòng nhập mật khẩu để đăng nhập.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({
        username: usernameToUse,
        password: loginPassword,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Đăng nhập thất bại.');
      }
    } catch {
      setErrorMsg('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regDisplayName.trim()) {
      setErrorMsg('Vui lòng nhập tên hiển thị.');
      return;
    }
    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setErrorMsg('Tên đăng nhập phải từ 3 ký tự trở lên.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        displayName: regDisplayName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        avatar: selectedAvatar,
        color: selectedColor,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Đăng ký không thành công.');
      } else {
        setSuccessMsg('Đăng ký thành công! Đang tải dữ liệu cá nhân...');
      }
    } catch {
      setErrorMsg('Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm delete account from device
  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteAccount(userToDelete.id);
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
        setLoginUsername('');
        setLoginPassword('');
      }
      setUserToDelete(null);
      triggerHaptic('medium');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-800/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col gap-5">
        {/* Logo & Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-500 via-teal-600 to-emerald-400 p-0.5 shadow-2xl shadow-teal-500/30 mb-3 transform hover:scale-105 transition duration-300">
            <div className="w-full h-full bg-slate-900/40 backdrop-blur-xs rounded-[22px] flex items-center justify-center">
              <span className="text-3xl font-black text-white drop-shadow">₫</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Quản Lý Chi Tiêu
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
            Hệ thống quản lý tài chính cá nhân độc lập và bảo mật riêng tư
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setSelectedUser(null);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký
            </button>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOGIN MODE */}
          {mode === 'login' ? (
            <div>
              {/* CASE A: A specific saved user is selected for password entry */}
              {selectedUser ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Selected Account Profile Header */}
                  <div className="p-3 bg-slate-950/70 border border-teal-500/40 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        style={{ backgroundColor: selectedUser.color || '#0d9488' }}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0"
                      >
                        {selectedUser.avatar || '👤'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {selectedUser.displayName}
                        </p>
                        <p className="text-xs text-teal-400 font-mono truncate">
                          @{selectedUser.username}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setLoginPassword('');
                        setErrorMsg(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                    >
                      Đổi tài khoản
                    </button>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Nhập mật khẩu để vào</span>
                      <span className="text-[11px] text-teal-400 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" />
                        Bảo mật riêng tư
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Nhập mật khẩu tài khoản..."
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Mở sổ chi tiêu</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* CASE B: General login form (Username + Password) */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={e => setLoginUsername(e.target.value)}
                        placeholder="Nhập tên đăng nhập..."
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 active:scale-[0.98] mt-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Đăng nhập vào ứng dụng</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  required
                  value={regDisplayName}
                  onChange={e => setRegDisplayName(e.target.value)}
                  placeholder="Ví dụ: Minh Tuấn, Quỹ Gia Đình..."
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên đăng nhập (viết liền, không dấu)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="ví dụ: minhtuan, user123..."
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Xác nhận lại
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2.2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {/* Avatar & Color Picker */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Biểu tượng & Màu tài khoản
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {AVATAR_OPTIONS.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition ${
                        selectedAvatar === av
                          ? 'bg-teal-600 ring-2 ring-teal-400 scale-110 shadow'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1.5">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full shrink-0 transition ${
                        selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Tạo tài khoản mới</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider: OR GOOGLE CLOUD SYNC */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/90" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900/90 px-3 text-slate-400 font-semibold tracking-wider rounded-full border border-slate-800">
                Hoặc đồng bộ đám mây
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            disabled={isLoading || isSyncing}
            onClick={async () => {
              setErrorMsg(null);
              try {
                await loginWithGoogle();
              } catch {
                // error handled in loginWithGoogle
              }
            }}
            className="w-full py-2.8 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2.5 active:scale-[0.98] border border-slate-200"
          >
            {isSyncing ? (
              <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            ) : (
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
            )}
            <span>Đăng nhập Google (Đồng bộ đa thiết bị)</span>
          </button>
        </div>

        {/* Saved Accounts on Device - WITH STRICT PASSWORD REQUIREMENT */}
        {savedUsers.length > 0 && (
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Users className="w-4 h-4 text-teal-400" />
                <span>Tài khoản trên máy ({savedUsers.length})</span>
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                Cần nhập mật khẩu
              </span>
            </div>

            <div className="space-y-2">
              {savedUsers.map(u => {
                const isCurrentSelected = selectedUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
                      isCurrentSelected
                        ? 'bg-teal-950/60 border-teal-500/60'
                        : 'bg-slate-950/80 hover:bg-slate-800/70 border-slate-800'
                    }`}
                  >
                    {/* Click Account to select for login */}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setSelectedUser(u);
                        triggerHaptic('light');
                      }}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <div
                        style={{ backgroundColor: u.color || '#0d9488' }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow shrink-0"
                      >
                        {u.avatar || '👤'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                          <span>{u.displayName}</span>
                          {isCurrentSelected && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-teal-500/30 text-teal-300 rounded-md font-normal">
                              Đang chọn
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">@{u.username}</p>
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white text-[11px] font-semibold transition shrink-0 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" />
                        <span>Đăng nhập</span>
                      </div>
                    </button>

                    {/* Delete Account From Device Button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setUserToDelete(u);
                        triggerHaptic('medium');
                      }}
                      className="p-2 ml-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition shrink-0"
                      title="Xóa tài khoản khỏi máy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security & Privacy Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Mỗi tài khoản được bảo vệ bằng mật khẩu và cách ly dữ liệu độc lập</span>
        </div>
      </div>

      {/* Confirmation Modal for Removing Account from Device */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Xóa tài khoản khỏi máy?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tài khoản <span className="text-white font-semibold">{userToDelete.displayName}</span> (@{userToDelete.username}) sẽ bị xóa khỏi thiết bị này.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-[11px] text-rose-300">
                Toàn bộ dữ liệu thu chi của tài khoản này trên máy sẽ bị xóa sạch để bảo mật.
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-lg shadow-rose-950/40"
                >
                  Xác nhận xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

