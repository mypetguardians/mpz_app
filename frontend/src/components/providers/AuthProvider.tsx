"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import instance from "@/lib/axios-instance";

interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  phoneNumber?: string;
  image?: string;
  userType: "일반사용자" | "센터관리자" | "훈련사" | "최고관리자";
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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setUserFromToken: () => Promise<void>;
  setLoggingIn: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 세션 토큰으로 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    try {
      const response = await instance.get("/auth/me");

      if (response.status === 200) {
        const data = response.data;

        // user 객체가 있으면 그것을 사용, 없으면 응답 데이터 자체를 사용
        const userData = data.user || data;

        if (userData && (userData.username || userData.email || userData.id)) {
          // User 인터페이스에 맞게 데이터 변환
          const user: User = {
            id: userData.id || userData.username,
            email: userData.email || `${userData.username}@kakao.com`,
            name: userData.name || userData.username,
            nickname: userData.nickname || userData.username,
            userType: userData.userType || "일반사용자",
            // 기타 필드는 기본값으로 설정
            phoneNumber: userData.phoneNumber,
            image: userData.image,
            centers: userData.centers,
            matchingSession: userData.matchingSession,
            accounts: userData.accounts,
          };

          setUser(user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else if (response.status === 401) {
        // 인증되지 않은 상태 (정상적인 상황)
        console.log("401 에러 - 인증되지 않은 사용자");
        setUser(null);
        setIsAuthenticated(false);
      } else {
        // 기타 서버 오류
        console.log("에러 응답 내용:", response.data);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("fetchCurrentUser 에러:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 정보 확인
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // 로그인 처리
  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
    setIsLoggingIn(false); // 로그인 완료
  };

  // 로그인 상태 설정
  const setLoggingIn = (status: boolean) => {
    setIsLoggingIn(status);
  };

  // 로그아웃 처리
  const logout = async () => {
    try {
      const response = await instance.delete("/auth/logout");

      if (response.status === 200) {
        // 클라이언트 쿠키도 삭제
        document.cookie =
          "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // 사용자 상태 초기화
        setUser(null);
        setIsAuthenticated(false);

        // 홈페이지로 리다이렉트
        router.push("/");
      } else {
        console.error("로그아웃 실패:", response.statusText);
        // 에러가 발생해도 클라이언트 상태는 초기화
        setUser(null);
        setIsAuthenticated(false);
        router.push("/");
      }
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
      // 에러가 발생해도 클라이언트 상태는 초기화
      setUser(null);
      setIsAuthenticated(false);
      router.push("/");
    }
  };

  // 사용자 정보 업데이트
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // 토큰에서 사용자 정보 가져오기
  const setUserFromToken = async () => {
    try {
      const response = await instance.get("/auth/me");

      if (response.status === 200) {
        const data = response.data;
        console.log("setUserFromToken 성공:", data.user);
        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        setIsLoggingIn(false); // 토큰으로 사용자 정보 가져오기 완료
      } else if (response.status === 401) {
        // 인증되지 않은 상태 (정상)
        console.log("setUserFromToken - 인증되지 않은 사용자");
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setIsLoggingIn(false);
      } else {
        console.log("setUserFromToken 실패:", response.statusText);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setIsLoggingIn(false);
        throw new Error(`setUserFromToken 실패: ${response.statusText}`);
      }
    } catch (error) {
      console.error("토큰에서 사용자 정보 가져오기 실패:", error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setIsLoggingIn(false);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isLoggingIn,
    login,
    logout,
    updateUser,
    setUserFromToken,
    setLoggingIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 커스텀 훅
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
