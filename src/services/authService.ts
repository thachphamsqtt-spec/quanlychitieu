import { AppUser, RegisterDto, LoginDto } from '../types/auth';

const STORAGE_USERS_KEY = 'expense_app_users_v2';
const STORAGE_SESSION_KEY = 'expense_auth_session_v2';

// Simple client-side password hash helper
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(encodeURIComponent(str)).slice(0, 16);
}

export const authService = {
  getAllUsers(): AppUser[] {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
      return [];
    }
  },

  saveAllUsers(users: AppUser[]): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  },

  getUserById(id: string): AppUser | null {
    const users = this.getAllUsers();
    return users.find(u => u.id === id) || null;
  },

  getUserByUsername(username: string): AppUser | null {
    const clean = username.trim().toLowerCase();
    const users = this.getAllUsers();
    return users.find(u => u.username.toLowerCase() === clean) || null;
  },

  register(dto: RegisterDto): { success: boolean; user?: AppUser; error?: string } {
    const cleanUsername = dto.username.trim().toLowerCase();
    const cleanDisplayName = dto.displayName.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
    }

    if (!cleanDisplayName) {
      return { success: false, error: 'Vui lòng nhập tên hiển thị của bạn.' };
    }

    if (!dto.password || dto.password.length < 6) {
      return { success: false, error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' };
    }

    const existing = this.getUserByUsername(cleanUsername);
    if (existing) {
      return { success: false, error: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' };
    }

    const newUser: AppUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: cleanUsername,
      displayName: cleanDisplayName,
      passwordHash: simpleHash(dto.password),
      avatar: dto.avatar || '👤',
      color: dto.color || '#0d9488',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    const users = this.getAllUsers();
    users.push(newUser);
    this.saveAllUsers(users);
    this.setActiveSession(newUser.id);

    return { success: true, user: newUser };
  },

  login(dto: LoginDto): { success: boolean; user?: AppUser; error?: string } {
    const cleanUsername = dto.username.trim().toLowerCase();
    if (!cleanUsername || !dto.password) {
      return { success: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' };
    }

    const user = this.getUserByUsername(cleanUsername);
    if (!user) {
      return { success: false, error: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc Đăng ký.' };
    }

    const expectedHash = simpleHash(dto.password);
    const isLegacyAdminMatch = user.id === 'usr_default_admin' && (user.passwordHash === 'h_123456_MTIzNDU2' && dto.password === '123456');
    if (user.passwordHash !== expectedHash && !isLegacyAdminMatch) {
      return { success: false, error: 'Mật khẩu không chính xác. Vui lòng thử lại.' };
    }

    // Update last login and ensure updated hash
    user.passwordHash = expectedHash;
    user.lastLoginAt = Date.now();
    const users = this.getAllUsers().map(u => (u.id === user.id ? user : u));
    this.saveAllUsers(users);

    this.setActiveSession(user.id);
    return { success: true, user };
  },

  getActiveSession(): AppUser | null {
    try {
      const activeUserId = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!activeUserId) return null;
      return this.getUserById(activeUserId);
    } catch {
      return null;
    }
  },

  setActiveSession(userId: string): void {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, userId);
    } catch (e) {
      console.error('Failed to set active session', e);
    }
  },

  clearActiveSession(): void {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear active session', e);
    }
  },

  deleteUser(userId: string): void {
    const users = this.getAllUsers().filter(u => u.id !== userId);
    this.saveAllUsers(users);
    if (localStorage.getItem(STORAGE_SESSION_KEY) === userId) {
      this.clearActiveSession();
    }
  }
};
