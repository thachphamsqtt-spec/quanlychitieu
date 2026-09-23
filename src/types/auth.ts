export interface AppUser {
  id: string;
  username: string; // unique username/email
  displayName: string;
  passwordHash: string;
  avatar: string; // emoji or avatar identifier
  color: string; // avatar badge background color
  createdAt: number;
  lastLoginAt: number;
}

export interface RegisterDto {
  username: string;
  displayName: string;
  password: string;
  avatar?: string;
  color?: string;
}

export interface LoginDto {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthSession {
  userId: string;
  loggedInAt: number;
}
