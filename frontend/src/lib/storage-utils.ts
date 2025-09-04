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
    // iOS Safari에서 localStorage 접근 시도
    localStorage.setItem(key, value);
    console.log(`localStorage에 ${key} 저장 완료`);

    // iOS Safari의 경우 추가적으로 쿠키에도 저장 (이중 보안)
    if (isIOSSafari()) {
      setSafeCookieForSafari(key, value, maxAge);
    }
  } catch (error) {
    console.warn(`localStorage 저장 실패, 쿠키로 대체:`, error);
    // localStorage 실패 시 쿠키로 대체
    setSafeCookieForSafari(key, value, maxAge);
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
 * iOS Safari 전용 안전한 쿠키 설정 함수
 */
export const setSafeCookieForSafari = (
  key: string,
  value: string,
  maxAge: number = 86400
): void => {
  const isSecure = window.location.protocol === "https:";
  const isIOS = isIOSSafari();

  if (isIOS) {
    // iOS Safari에서는 SameSite=Lax를 사용하여 호환성 개선
    const cookieString = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${
      isSecure ? "; Secure" : ""
    }`;
    document.cookie = cookieString;
    console.log(`iOS Safari용 쿠키 설정 완료: ${key}`);
  } else {
    // 다른 브라우저에서는 기존 방식 사용
    const cookieString = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=None${
      isSecure ? "; Secure" : ""
    }`;
    document.cookie = cookieString;
    console.log(`일반 브라우저용 쿠키 설정 완료: ${key}`);
  }
};

/**
 * iOS Safari에서 안전하게 쿠키를 설정하는 함수 (기존 호환성 유지)
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

  const isIOS = isIOSSafari();

  // iOS Safari에서는 SameSite 정책을 더 엄격하게 적용
  const finalSameSite = isIOS && sameSite === "None" ? "Lax" : sameSite;

  let cookieString = `${name}=${value}; path=${path}; max-age=${maxAge}; SameSite=${finalSameSite}`;

  if (secure) {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
  console.log(`쿠키 설정 완료: ${name} (SameSite: ${finalSameSite})`);
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
 * 카카오톡 앱 설치 여부 감지 함수 (iOS Safari 환경)
 */
export const isKakaoTalkInstalled = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!isIOSSafari()) {
      resolve(false);
      return;
    }

    // iOS Safari에서 카카오톡 앱 스키마 체크
    const kakaoScheme = "kakaotalk://";
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = kakaoScheme;

    // eslint-disable-next-line prefer-const
    let timeout: NodeJS.Timeout | undefined;

    const cleanup = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      document.body.removeChild(iframe);
    };

    // 앱이 설치되어 있으면 페이지가 백그라운드로 이동
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
        resolve(true);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.body.appendChild(iframe);

    // 1초 후에도 페이지가 여전히 활성화되어 있으면 앱이 설치되지 않은 것으로 판단
    timeout = setTimeout(() => {
      cleanup();
      resolve(false);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, 1000);
  });
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
