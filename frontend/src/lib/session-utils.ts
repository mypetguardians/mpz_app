import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 클라이언트 사이드에서 세션 토큰 가져오기
export function getSessionToken(): string | null {
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

// 로그인 상태 확인
export function isAuthenticated(): boolean {
  return !!getSessionToken();
}

// 로그아웃
export async function signOut(): Promise<void> {
  try {
    const response = await fetch("/api/auth/sign-out", {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      // 쿠키 삭제
      document.cookie =
        "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/";
    }
  } catch (error) {
    console.error("로그아웃 중 오류:", error);
  }
}

// 인증이 필요한 페이지에서 사용
export function requireAuth() {
  if (!isAuthenticated()) {
    redirect("/login");
  }
}

// 이미 로그인된 사용자를 리다이렉트
export function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    redirect("/");
  }
}

// 세션 토큰으로 사용자 정보 가져오기
export async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    return null;
  } catch (error) {
    console.error("사용자 정보 조회 중 오류:", error);
    return null;
  }
}
