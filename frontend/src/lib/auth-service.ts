import instance from "./axios-instance";
import Cookies from "js-cookie";

export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  phoneNumber?: string;
  image?: string;
  userType: "일반사용자" | "센터관리자" | "훈련사" | "센터최고관리자";
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

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private isAuthenticated: boolean = false;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // 센터 계정 로그인 (사용자명/비밀번호)
  async centerLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await instance.post("/auth/login", credentials);

      if (response.status === 200) {
        const { access_token, refresh_token } = response.data;

        if (access_token) {
          // access_token을 쿠키에 저장
          Cookies.set("accessToken", access_token, { expires: 7 }); // 7일간 유효

          // refresh_token을 로컬 스토리지에 저장
          if (refresh_token) {
            localStorage.setItem("refresh_token", refresh_token);
          }

          // 사용자 정보 가져오기
          const userResponse = await this.getCurrentUser();
          if (userResponse.success && userResponse.user) {
            this.currentUser = userResponse.user;
            this.isAuthenticated = true;
            return {
              success: true,
              user: userResponse.user,
              message: "로그인에 성공했습니다!",
            };
          } else {
            return {
              success: false,
              message: "사용자 정보를 가져올 수 없습니다.",
            };
          }
        } else {
          return {
            success: false,
            message: "로그인에 실패했습니다.",
          };
        }
      } else {
        return {
          success: false,
          message: "로그인에 실패했습니다.",
        };
      }
    } catch (error: unknown) {
      console.error("센터 로그인 실패:", error);

      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 401
      ) {
        return {
          success: false,
          message: "아이디 또는 비밀번호가 올바르지 않습니다.",
        };
      } else if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 400
      ) {
        return {
          success: false,
          message: "잘못된 요청 형식입니다.",
        };
      }

      return {
        success: false,
        message: "로그인 중 오류가 발생했습니다.",
      };
    }
  }

  // 카카오 로그인 시작
  async startKakaoLogin(): Promise<AuthResponse> {
    try {
      const response = await instance.get("/kakao/login");

      if (response.data.authUrl) {
        // 카카오 로그인 URL로 리다이렉트
        window.location.href = response.data.authUrl;
        return {
          success: true,
          message: "카카오 로그인 페이지로 이동합니다.",
        };
      } else {
        throw new Error("카카오 로그인 URL을 받지 못했습니다.");
      }
    } catch (error) {
      console.error("카카오 로그인 시작 실패:", error);
      return {
        success: false,
        message: "카카오 로그인을 시작할 수 없습니다.",
      };
    }
  }

  // 카카오 로그인 콜백 처리
  async handleKakaoCallback(code: string): Promise<AuthResponse> {
    try {
      const response = await instance.post("/kakao/login/callback", { code });

      if (response.status === 200) {
        const { access_token, refresh_token } = response.data;

        if (access_token) {
          // access_token을 쿠키에 저장
          Cookies.set("accessToken", access_token, { expires: 7 });

          // refresh_token을 로컬 스토리지에 저장
          if (refresh_token) {
            Cookies.set("refresh_token", refresh_token, { expires: 7 });
          }
        }

        const userResponse = await this.getCurrentUser();
        if (userResponse.success && userResponse.user) {
          this.currentUser = userResponse.user;
          this.isAuthenticated = true;
          return {
            success: true,
            user: userResponse.user,
            message: "카카오 로그인에 성공했습니다!",
          };
        }
      }

      return {
        success: false,
        message: "카카오 로그인에 실패했습니다.",
      };
    } catch (error) {
      console.error("카카오 로그인 콜백 처리 실패:", error);
      return {
        success: false,
        message: "카카오 로그인 처리 중 오류가 발생했습니다.",
      };
    }
  }

  // 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await instance.get("/auth/me");

      if (response.status === 200) {
        const data = response.data;
        const userData = data.user || data;

        if (userData && (userData.username || userData.email || userData.id)) {
          const user: User = {
            id: userData.id || userData.username,
            email: userData.email || `${userData.username}@kakao.com`,
            name: userData.name || userData.username,
            nickname: userData.nickname || userData.username,
            userType: userData.userType || "일반사용자",
            phoneNumber: userData.phoneNumber,
            image: userData.image,
            centers: userData.centers,
            matchingSession: userData.matchingSession,
            accounts: userData.accounts,
          };

          this.currentUser = user;
          this.isAuthenticated = true;

          return {
            success: true,
            user,
          };
        }
      } else if (response.status === 401) {
        this.currentUser = null;
        this.isAuthenticated = false;
        return {
          success: false,
          message: "인증되지 않은 사용자입니다.",
        };
      }

      return {
        success: false,
        message: "사용자 정보를 가져올 수 없습니다.",
      };
    } catch (error) {
      console.error("사용자 정보 가져오기 실패:", error);
      this.currentUser = null;
      this.isAuthenticated = false;
      return {
        success: false,
        message: "사용자 정보를 가져올 수 없습니다.",
      };
    }
  }

  // 로그아웃
  async logout(): Promise<AuthResponse> {
    try {
      const response = await instance.delete("/auth/logout");

      if (response.status === 200) {
        // 클라이언트 쿠키 삭제
        document.cookie =
          "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // accessToken 쿠키 삭제
        Cookies.remove("accessToken");

        // 로컬 상태 초기화
        this.currentUser = null;
        this.isAuthenticated = false;

        // 로컬 스토리지 정리
        localStorage.removeItem("refresh_token");

        return {
          success: true,
          message: "로그아웃되었습니다.",
        };
      }

      return {
        success: false,
        message: "로그아웃에 실패했습니다.",
      };
    } catch (error) {
      console.error("로그아웃 실패:", error);

      // 에러가 발생해도 클라이언트 상태는 초기화
      this.currentUser = null;
      this.isAuthenticated = false;
      Cookies.remove("accessToken");
      localStorage.removeItem("refresh_token");

      return {
        success: false,
        message: "로그아웃 중 오류가 발생했습니다.",
      };
    }
  }

  // 현재 상태 getter
  getCurrentUserState(): User | null {
    return this.currentUser;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // 사용자 정보 업데이트
  updateUser(userData: Partial<User>): void {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...userData };
    }
  }
}

export default AuthService;
