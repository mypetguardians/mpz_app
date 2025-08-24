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
      console.log("fetchCurrentUser 시작");
      const response = await instance.get("/auth/me");

      console.log("API 응답 상태:", response.status);
      console.log(
        "API 응답 헤더:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.status === 200) {
        const data = response.data;
        setUser(data.user);
        setIsAuthenticated(true); // API 호출 성공 시 인증 상태 true
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
    // 세션 쿠키가 있을 때만 사용자 정보 확인
    const sessionToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("better-auth.session_token="));

    if (sessionToken) {
      console.log("세션 토큰 발견, 사용자 정보 확인");
      fetchCurrentUser();
    } else {
      console.log("세션 토큰 없음, 로그인 필요");
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  // 로그인 처리
  const login = (userData: User) => {
    console.log(" login 호출됨:", userData);
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
    setIsLoggingIn(false); // 로그인 완료
  };

  // 로그인 상태 설정
  const setLoggingIn = (status: boolean) => {
    console.log(" setLoggingIn:", status);
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
