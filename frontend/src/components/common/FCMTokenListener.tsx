"use client";

import { useEffect } from "react";

/**
 * FCM 토큰 디버깅용 전역 리스너 컴포넌트.
 * 앱 시작 시점에 fcmToken 이벤트를 수신하여 localStorage에 저장한다.
 * UI를 렌더링하지 않는다.
 */
export default function FCMTokenListener() {
  useEffect(() => {
    const windowWithFlag = window as Window & {
      __fcmTokenListenerAdded?: boolean;
    };

    if (windowWithFlag.__fcmTokenListenerAdded) {
      return;
    }

    const handleFCMToken = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const token = customEvent.detail;
        console.log("=== FCM 토큰 수신 (전역) ===");
        console.log("토큰:", token);
        console.log("이벤트 타입:", event.type);
        console.log("===================");
        // 토큰을 localStorage에 저장 (디버깅용)
        if (token && typeof token === "string") {
          localStorage.setItem("fcm_token_debug", token);
          console.log("FCM 토큰을 localStorage에 저장했습니다");
        } else {
          console.warn("토큰이 유효하지 않습니다:", token);
        }
      } catch (error) {
        console.error("FCM 토큰 이벤트 처리 오류:", error);
      }
    };

    window.addEventListener("fcmToken", handleFCMToken);
    windowWithFlag.__fcmTokenListenerAdded = true;
    console.log("전역 FCM 토큰 리스너 등록 완료");

    // 이미 저장된 토큰 확인
    const savedToken = localStorage.getItem("fcm_token_debug");
    if (savedToken) {
      console.log(
        "이미 저장된 FCM 토큰 발견:",
        savedToken.substring(0, 30) + "..."
      );
    }

    return () => {
      window.removeEventListener("fcmToken", handleFCMToken);
      windowWithFlag.__fcmTokenListenerAdded = false;
    };
  }, []);

  return null;
}
