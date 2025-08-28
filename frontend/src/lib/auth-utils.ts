import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react"; // Added missing import for React.createElement

// 클라이언트 사이드에서 세션 토큰 가져오기
export function getClientSessionToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  const sessionCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("better-auth.session_token=")
  );

  return sessionCookie ? sessionCookie.split("=")[1] : null;
}

// 서버 사이드에서 세션 토큰 가져오기
export async function getServerSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("better-auth.session_token")?.value || null;
  } catch {
    return null;
  }
}

// 로그인 상태 확인 (클라이언트)
export function isClientAuthenticated(): boolean {
  return !!getClientSessionToken();
}

// 로그인 상태 확인 (서버)
export async function isServerAuthenticated(): Promise<boolean> {
  return !!(await getServerSessionToken());
}

// 세션 토큰 유효성 검증
export async function validateSession(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    console.error("세션 검증 중 오류:", error);
    return false;
  }
}

// 세션 만료 시간 확인
export function isSessionExpired(token: string): boolean {
  try {
    // JWT 토큰의 payload 부분 디코딩
    const payload = token.split(".")[1];
    if (!payload) return true;

    const decoded = JSON.parse(atob(payload));
    const currentTime = Math.floor(Date.now() / 1000);

    return decoded.exp < currentTime;
  } catch (error) {
    console.error("토큰 만료 시간 확인 중 오류:", error);
    return true;
  }
}

// 자동 로그아웃 (세션 만료 시)
export function setupAutoLogout(): void {
  if (typeof window === "undefined") return;

  const checkSession = () => {
    const token = getClientSessionToken();
    if (token && isSessionExpired(token)) {
      // 세션이 만료되었으면 자동 로그아웃
      document.cookie =
        "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login?expired=true";
    }
  };

  // 1분마다 세션 상태 확인
  setInterval(checkSession, 60000);

  // 페이지 포커스 시에도 확인
  window.addEventListener("focus", checkSession);
}

// 보호된 라우트를 위한 HOC (JSX 제거)
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      redirect("/login");
      return null;
    }
    // React.createElement를 사용하여 컴포넌트 렌더링
    return React.createElement(Component, props);
  };
}

// 권한 기반 접근 제어
export function hasPermission(
  userType: string,
  requiredType: string | string[]
): boolean {
  const permissionLevels = {
    일반사용자: 1,
    센터관리자: 2,
    훈련사: 3,
    센터최고관리자: 4,
  };

  const userLevel =
    permissionLevels[userType as keyof typeof permissionLevels] || 0;
  const requiredLevels = Array.isArray(requiredType)
    ? requiredType.map(
        (t) => permissionLevels[t as keyof typeof permissionLevels] || 0
      )
    : [permissionLevels[requiredType as keyof typeof permissionLevels] || 0];

  return requiredLevels.some((level) => userLevel >= level);
}

// 세션 새로고침
export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      // 새로운 토큰을 쿠키에 설정
      document.cookie = `better-auth.session_token=${data.token}; path=/; max-age=3600; secure; samesite=strict`;
      return true;
    }
    return false;
  } catch (error) {
    console.error("세션 새로고침 중 오류:", error);
    return false;
  }
}
