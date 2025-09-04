/* eslint-disable prefer-const */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import instance from "@/lib/axios-instance";
import {
  User,
  LoginResponse,
  AuthContextType,
  LoginResult,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 센터 로그인 함수
  const centerLogin = async (
    username: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      const response = await instance.post("/auth/login", {
        username,
        password,
      });

      if (response.status === 200) {
        const data: LoginResponse = response.data;

        // 토큰을 로컬 스토리지에 저장
        Cookies.set("access_token", data.access_token);
        Cookies.set("refresh_token", data.refresh_token);

        // 사용자 정보 가져오기
        try {
          await setUserFromToken();
          return { success: true, message: "로그인에 성공했습니다!" };
        } catch (error) {
          console.error("사용자 정보 가져오기 실패:", error);
          return {
            success: false,
            message: "사용자 정보를 가져오는데 실패했습니다.",
          };
        }
      } else {
        return { success: false, message: "로그인에 실패했습니다." };
      }
    } catch (error: unknown) {
      console.error("센터 로그인 에러:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        if (axiosError.response?.status === 401) {
          return {
            success: false,
            message: "아이디 또는 비밀번호가 올바르지 않습니다.",
          };
        } else if (axiosError.response?.data?.message) {
          return { success: false, message: axiosError.response.data.message };
        }
      }
      return { success: false, message: "로그인 중 오류가 발생했습니다." };
    }
  };

  // 세션 토큰으로 사용자 정보 가져오기 - iOS Safari 호환성 개선
  const fetchCurrentUser = async () => {
    try {
      // 쿠키와 로컬 스토리지 모두에서 토큰 확인 (사파리 호환성)
      let accessToken =
        Cookies.get("access_token") || localStorage.getItem("access_token");
      if (accessToken) {
        instance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${accessToken}`;
      }

      const response = await instance.get("/auth/me");

      if (response.status === 200) {
        const data = response.data;
        console.log("fetchCurrentUser - API 응답 데이터:", data);

        // user 객체가 있으면 그것을 사용, 없으면 응답 데이터 자체를 사용
        const userData = data.user || data;
        console.log("fetchCurrentUser - 처리할 사용자 데이터:", userData);

        if (userData && (userData.username || userData.email || userData.id)) {
          // User 인터페이스에 맞게 데이터 변환
          const user: User = {
            id: userData.id || userData.username,
            email: userData.email || "이메일 정보 없음",
            name: userData.name || userData.nickname || "이름 정보 없음",
            nickname: userData.nickname || "닉네임 정보 없음",
            userType: userData.user_type || userData.userType || "일반사용자",
            // 기타 필드는 기본값으로 설정
            phoneNumber: userData.phone_number || userData.phoneNumber,
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
        // 토큰 제거 (쿠키와 로컬스토리지 모두)
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        delete instance.defaults.headers.common["Authorization"];
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
      // 토큰 제거 (쿠키와 로컬스토리지 모두)
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      delete instance.defaults.headers.common["Authorization"];
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

        // 토큰 제거 (쿠키와 로컬스토리지 모두)
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        delete instance.defaults.headers.common["Authorization"];

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
      console.log("setUserFromToken - API 호출 시작");
      const response = await instance.get("/auth/me");

      if (response.status === 200) {
        const data = response.data;
        console.log("setUserFromToken 성공:", data.user);

        // user 객체가 있으면 그것을 사용, 없으면 응답 데이터 자체를 사용
        const userData = data.user || data;

        if (userData && (userData.username || userData.email || userData.id)) {
          // User 인터페이스에 맞게 데이터 변환
          const user: User = {
            id: userData.id || userData.username,
            email: userData.email || "이메일 정보 없음",
            name: userData.name || userData.nickname || "이름 정보 없음",
            nickname: userData.nickname || "닉네임 정보 없음",
            userType: userData.user_type || userData.userType || "일반사용자",
            // 기타 필드는 기본값으로 설정
            phoneNumber: userData.phone_number || userData.phoneNumber,
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

        setIsLoading(false);
        setIsLoggingIn(false); // 토큰으로 사용자 정보 가져오기 완료
      } else if (response.status === 401) {
        // 인증되지 않은 상태 (정상)
        console.log("setUserFromToken - 인증되지 않은 사용자");
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setIsLoggingIn(false);
        // 토큰 제거 (쿠키와 로컬스토리지 모두)
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        delete instance.defaults.headers.common["Authorization"];
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
    centerLogin,
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
