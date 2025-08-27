export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  phoneNumber?: string;
  image?: string;
  userType: string;
  // 센터 정보 (센터관리자인 경우)
  centers?: {
    id: string;
    name: string;
    centerNumber: string | null;
    description: string | null;
    location: string | null;
    region: string | null;
    phoneNumber: string | null;
    verified: boolean;
    isPublic: boolean;
    adoptionPrice: number;
    imageUrl: string | null;
    isSubscriber: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  // 매칭 세션 정보
  matchingSession?: {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  accounts?: {
    providerId: string;
  } | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  status: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setUserFromToken: () => Promise<void>;
  setLoggingIn: (status: boolean) => void;
  centerLogin: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
}

export interface LoginResult {
  success: boolean;
  message: string;
}
