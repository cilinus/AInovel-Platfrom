export enum UserRole {
  USER = 'USER',
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
  GOOGLE = 'GOOGLE',
}

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  provider: AuthProvider;
  profileImage?: string;
  bio?: string;
  tokenBalance: number;
  isAuthor: boolean;
  createdAt: string;
}

export interface AuthorProfile {
  penName: string;
  genres: string[];
  introduction: string;
  tier: 'ROOKIE' | 'REGULAR' | 'PRO' | 'BEST' | 'HONOR';
  totalSettlement: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
