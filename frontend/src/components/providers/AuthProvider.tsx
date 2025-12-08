"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import type { AxiosError, AxiosResponse } from "axios";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { User, AuthContextType, LoginResult } from "@/types/auth";
import { useWebPushNotification } from "@/hooks/mutation/usePushToken";

// AxiosError 타입 가드 함수
const isAxiosError = (error: unknown): error is AxiosError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in (error as Record<string, unknown>)
  );
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requestPermissionAndRegisterToken } = useWebPushNotification();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const pushTokenRegisteringRef = useRef(false);
  const pushTokenRegisteredRef = useRef(false);

  // Axios 에러 메시지 추출
  const extractAxiosErrorMessage = (error: unknown): string | null => {
    try {
      const response = isAxiosError(error) ? error.response : undefined;
      const data: unknown = response?.data;

      if (typeof data === "string" && data.trim()) return data.trim();

      const candidates: string[] = [];
      const obj =
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : null;
      const pushIfString = (val: unknown) => {
        if (typeof val === "string" && val.trim()) candidates.push(val.trim());
      };
      if (obj) {
        pushIfString(obj.message);
        pushIfString(obj.detail);
        pushIfString(obj.error);
      }

      if (obj && Array.isArray((obj as { errors?: unknown[] }).errors)) {
        const texts = (obj.errors as unknown[]).filter(
          (v): v is string => typeof v === "string"
        );
        if (texts.length) candidates.push(texts.join("\n"));
      }

      if (
        obj &&
        typeof obj.errors === "object" &&
        obj.errors !== null &&
        !Array.isArray(obj.errors)
      ) {
        const errorsObj = obj.errors as Record<string, unknown>;
        const collected: string[] = [];
        for (const key of Object.keys(errorsObj)) {
          const val = errorsObj[key];
          if (Array.isArray(val)) {
            collected.push(`${key}: ${val.join(", ")}`);
          } else if (typeof val === "string") {
            collected.push(`${key}: ${val}`);
          }
        }
        if (collected.length) candidates.push(collected.join("\n"));
      }

      if (
        obj &&
        Array.isArray(
          (obj as { non_field_errors?: unknown[] }).non_field_errors
        )
      ) {
        const texts = (obj.non_field_errors as unknown[]).filter(
          (v): v is string => typeof v === "string"
        );
        if (texts.length) candidates.push(texts.join("\n"));
      }

      if (response?.statusText) candidates.push(response.statusText);

      const found = candidates.find((c) => c.trim());
      if (found) return found.trim();

      if (typeof (error as { message?: unknown })?.message === "string") {
        return (error as { message: string }).message;
      }
    } catch {}
    return null;
  };

  // 현재 유저 가져오기
  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      setIsLoading(true);

      const response: AxiosResponse = await instance.get("/auth/me", {
        withCredentials: true,
      });

      if (response.status === 200) {
        const data = response.data;
        const userData = data.user || data;

        if (userData && (userData.username || userData.email || userData.id)) {
          const user: User = {
            id: userData.id || userData.username,
            email: userData.email || "이메일 정보 없음",
            name: userData.name || userData.nickname || "이름 정보 없음",
            nickname: userData.nickname || "닉네임 정보 없음",
            userType: userData.user_type || "일반사용자",
            phoneNumber: userData.phone_number,
            image: userData.image,
            centers: userData.centers,
            matchingSession: userData.matchingSession,
            accounts: userData.accounts,
          };

          setUser(user);
          setIsAuthenticated(true);
          return user;
        } else {
          setUser(null);
          setIsAuthenticated(false);
          return null;
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } catch (error: unknown) {
      // 401 에러인 경우 명시적으로 로그아웃 처리
      if (isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const centerLogin = async (
    username: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      setIsLoggingIn(true);
      const response: AxiosResponse = await instance.post(
        "/auth/login",
        { username, password },
        { withCredentials: true } // 쿠키 자동 저장
      );

      if (response.status === 200) {
        try {
          // 즉시 사용자 정보 갱신
          const updatedUser = await fetchCurrentUser();
          if (updatedUser) {
            // 로그인 성공 시 푸시 알림 초기화 (비동기로 실행, 실패해도 로그인은 성공)
            // 중복 등록 방지
            if (
              !pushTokenRegisteringRef.current &&
              !pushTokenRegisteredRef.current
            ) {
              pushTokenRegisteringRef.current = true;
              requestPermissionAndRegisterToken()
                .then(() => {
                  console.log("푸시 알림 등록 완료");
                  pushTokenRegisteredRef.current = true;
                  pushTokenRegisteringRef.current = false;
                })
                .catch((error) => {
                  console.warn("푸시 알림 등록 실패:", error);
                  pushTokenRegisteringRef.current = false; // 실패 시 다시 시도 가능하도록
                });
            }

            return { success: true, message: "로그인에 성공했습니다!" };
          } else {
            return {
              success: false,
              message:
                "로그인에는 성공했으나 사용자 정보를 가져오는데 실패했습니다.",
            };
          }
        } catch (error) {
          console.error("사용자 정보 가져오기 실패:", error);
          return {
            success: false,
            message: "사용자 정보를 가져오는데 실패했습니다.",
          };
        }
      }
      return { success: false, message: "로그인에 실패했습니다." };
    } catch (error: unknown) {
      const detailedMessage = extractAxiosErrorMessage(error);
      if (detailedMessage) return { success: false, message: detailedMessage };
      return { success: false, message: "로그인 중 오류가 발생했습니다." };
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 초기 로드시 한 번만 사용자 정보 확인 및 푸시 알림 초기화
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let hasInitialized = false;

    const initializeAuth = async () => {
      // 이미 초기화되었으면 스킵
      if (hasInitialized) {
        return;
      }

      const currentUser = await fetchCurrentUser();
      // 이미 로그인된 사용자인 경우 푸시 알림 초기화
      if (
        currentUser &&
        isMounted &&
        !pushTokenRegisteringRef.current &&
        !pushTokenRegisteredRef.current &&
        !hasInitialized
      ) {
        hasInitialized = true;
        pushTokenRegisteringRef.current = true;
        // 약간의 지연 후 푸시 알림 초기화 (서비스 워커 등록 시간 확보)
        timeoutId = setTimeout(() => {
          if (isMounted && pushTokenRegisteringRef.current) {
            requestPermissionAndRegisterToken()
              .then(() => {
                if (isMounted) {
                  console.log("푸시 알림 등록 완료");
                  pushTokenRegisteredRef.current = true;
                  pushTokenRegisteringRef.current = false;
                }
              })
              .catch((error) => {
                console.warn("푸시 알림 등록 실패:", error);
                if (isMounted) {
                  pushTokenRegisteringRef.current = false; // 실패 시 다시 시도 가능하도록
                  hasInitialized = false; // 실패 시 재시도 가능하도록
                }
              });
          }
        }, 2000); // 지연 시간 증가
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // requestPermissionAndRegisterToken은 안정적인 함수이므로 의존성에서 제외

  // 로그아웃 - 쿼리 캐시 무효화 포함
  const logout = async () => {
    const disconnectKakaoSession = async () => {
      if (typeof window === "undefined") return;
      const kakaoAuth = window.Kakao?.Auth;
      if (!kakaoAuth || typeof kakaoAuth.logout !== "function") return;

      await new Promise<void>((resolve) => {
        try {
          kakaoAuth.logout(() => {
            kakaoAuth.setAccessToken?.(null);
            resolve();
          });
        } catch (error) {
          console.warn("카카오 SDK 로그아웃 실패:", error);
          resolve();
        }
        setTimeout(resolve, 2000);
      });
    };

    try {
      await disconnectKakaoSession();
      await instance.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("로그아웃 요청 실패:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      pushTokenRegisteredRef.current = false; // 로그아웃 시 플래그 리셋
      pushTokenRegisteringRef.current = false;

      queryClient.invalidateQueries({
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          return (
            firstKey != null &&
            typeof firstKey === "string" &&
            (firstKey.includes("user") ||
              firstKey.includes("adoptions") ||
              firstKey.includes("my"))
          );
        },
      });

      router.push("/");
      router.refresh();
    }
  };

  // 토큰 기반으로 유저 세팅
  const setUserFromToken = async (): Promise<User | null> => {
    return await fetchCurrentUser();
  };

  // 수동으로 사용자 정보 갱신 (필요시)
  const refreshUser = async (): Promise<User | null> => {
    return await fetchCurrentUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isLoggingIn,
    login: (u: User) => {
      setUser(u);
      setIsAuthenticated(true);
      setIsLoading(false);
      setIsLoggingIn(false);
    },
    logout,
    updateUser: (userData: Partial<User>) => {
      if (user) setUser({ ...user, ...userData });
    },
    setUserFromToken,
    setLoggingIn: setIsLoggingIn,
    centerLogin,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
