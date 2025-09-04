// iOS Safari 호환성을 위한 스토리지 유틸리티 함수들

/**
 * iOS Safari에서 localStorage 접근이 제한될 수 있으므로
 * localStorage 우선, 실패 시 쿠키로 대체하는 안전한 저장 함수
 */
export const safeSetItem = (
  key: string,
  value: string,
  maxAge: number = 86400
): void => {
  try {
    localStorage.setItem(key, value);
    console.log(`localStorage에 ${key} 저장 완료`);
  } catch (error) {
    console.warn(`localStorage 저장 실패, 쿠키로 대체:`, error);
    // localStorage 실패 시 쿠키로 대체
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=None${secure}`;
    console.log(`쿠키에 ${key} 저장 완료`);
  }
};

/**
 * localStorage 우선, 실패 시 쿠키에서 값을 가져오는 안전한 조회 함수
 */
export const safeGetItem = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return value;
    }
  } catch (error) {
    console.warn(`localStorage 접근 실패, 쿠키에서 ${key} 확인:`, error);
  }

  // localStorage에서 값을 찾지 못했거나 접근 실패 시 쿠키에서 확인
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === key && value) {
      return value;
    }
  }

  return null;
};

/**
 * localStorage와 쿠키 모두에서 값을 제거하는 안전한 삭제 함수
 */
export const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`localStorage 접근 실패:`, error);
  }

  // 쿠키에서도 제거
  document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  console.log(`${key} 제거 완료`);
};

/**
 * iOS Safari에서 안전하게 쿠키를 설정하는 함수
 */
export const setSafeCookie = (
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    sameSite?: "None" | "Lax" | "Strict";
    secure?: boolean;
  } = {}
): void => {
  const {
    maxAge = 86400,
    path = "/",
    sameSite = "None",
    secure = window.location.protocol === "https:",
  } = options;

  let cookieString = `${name}=${value}; path=${path}; max-age=${maxAge}; SameSite=${sameSite}`;

  if (secure) {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
  console.log(`쿠키 설정 완료: ${name}`);
};

/**
 * iOS Safari 감지 함수
 */
export const isIOSSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari =
    /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
  return isIOS && isSafari;
};

/**
 * Private 브라우징 모드 감지 함수
 */
export const isPrivateMode = async (): Promise<boolean> => {
  try {
    // localStorage에 테스트 값 저장 시도
    localStorage.setItem("__test__", "test");
    localStorage.removeItem("__test__");
    return false;
  } catch {
    return true;
  }
};
