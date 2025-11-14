// 사용자 프로필 타입
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nickname?: string | null;
  phoneNumber?: string | null;
  userType?: "일반사용자" | "센터관리자" | "훈련사" | "최고관리자" | null;
  isPhoneVerified?: boolean | null;
  image?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  phoneNumber?: string;
  image?: string;
  userType: string;
  // 센터 정보 (센터관리자인 경우)
  centers?:
    | {
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
      }
    | Array<{
        id: string;
        name?: string;
      }>
    | null;
  center?: { id: string } | null;
  centerId?: string | null;
  owned_center?: { id: string } | null;
  ownedCenter?: { id: string } | null;
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

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setUserFromToken: () => Promise<User | null>; // 수정: 반환 타입 명시
  setLoggingIn: React.Dispatch<React.SetStateAction<boolean>>;
  centerLogin: (username: string, password: string) => Promise<LoginResult>;
  refreshUser: () => Promise<User | null>; // 추가: 반환 타입 명시
}

// 로그인 결과 타입
export interface LoginResult {
  success: boolean;
  message: string;
}
