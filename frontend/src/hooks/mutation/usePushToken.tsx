"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import instance from "@/lib/axios-instance";
import {
  PushTokenRequest,
  PushTokenResponse,
  DeletePushTokenRequest,
  Platform,
} from "@/types/notifications";

// Capacitor 타입 정의
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
  };
}

// FCM 토큰 이벤트 타입
interface FCMTokenEvent extends CustomEvent {
  detail: string;
}

// 푸시 토큰 등록/업데이트
export function useRegisterPushToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PushTokenRequest): Promise<PushTokenResponse> => {
      const response = await instance.post("/notifications/push-token", data);
      return response.data;
    },
    onSuccess: () => {
      // 알림 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("푸시 토큰 등록 실패:", error);
    },
  });
}

// 푸시 토큰 삭제
export function useDeletePushToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: DeletePushTokenRequest
    ): Promise<PushTokenResponse> => {
      const response = await instance.delete("/notifications/push-token", {
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      // 알림 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("푸시 토큰 삭제 실패:", error);
    },
  });
}

// 브라우저 플랫폼 감지 함수
export function detectPlatform(): Platform {
  if (typeof window === "undefined") {
    return "web";
  }

  // Capacitor 플랫폼 확인
  const capWindow = window as CapacitorWindow;
  if (capWindow.Capacitor) {
    const capPlatform = capWindow.Capacitor.getPlatform();
    if (capPlatform === "android") return "android";
    if (capPlatform === "ios") return "ios";
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/android/.test(userAgent)) {
    return "android";
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  } else {
    return "web";
  }
}

// 안드로이드 FCM 토큰 가져오기
let fcmTokenListenerAdded = false;
let pendingResolvers: Array<(token: string | null) => void> = [];

// FCM 토큰 이벤트 핸들러 (전역으로 한 번만 등록)
const handleFCMTokenGlobal = (event: Event) => {
  const customEvent = event as FCMTokenEvent;
  const token = customEvent.detail;

  // 모든 대기 중인 Promise 해결
  pendingResolvers.forEach((resolve) => resolve(token));
  pendingResolvers = [];
};

export async function getAndroidFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // Capacitor가 없으면 웹 플랫폼
  const capWindow = window as CapacitorWindow;
  if (!capWindow.Capacitor) {
    return null;
  }

  const capPlatform = capWindow.Capacitor.getPlatform();
  if (capPlatform !== "android") {
    return null;
  }

  // 전역 리스너가 없으면 한 번만 등록
  if (!fcmTokenListenerAdded) {
    window.addEventListener("fcmToken", handleFCMTokenGlobal);
    fcmTokenListenerAdded = true;
  }

  return new Promise((resolve) => {
    // 타임아웃 (5초)
    const timeoutId = setTimeout(() => {
      // 대기 목록에서 제거
      const index = pendingResolvers.indexOf(resolve);
      if (index > -1) {
        pendingResolvers.splice(index, 1);
      }
      console.warn("FCM 토큰을 받는 데 시간이 너무 오래 걸립니다.");
      resolve(null);
    }, 5000);

    // 대기 목록에 추가
    const wrappedResolve = (token: string | null) => {
      clearTimeout(timeoutId);
      resolve(token);
    };
    pendingResolvers.push(wrappedResolve);
  });
}

// iOS FCM 토큰 가져오기
export async function getIOSFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    console.log("❌ getIOSFCMToken: window가 없습니다");
    return null;
  }

  // Capacitor가 없으면 웹 플랫폼
  const capWindow = window as CapacitorWindow;
  if (!capWindow.Capacitor) {
    console.log("❌ getIOSFCMToken: Capacitor가 없습니다");
    return null;
  }

  const capPlatform = capWindow.Capacitor.getPlatform();
  console.log("🔍 getIOSFCMToken: 플랫폼 =", capPlatform);

  if (capPlatform !== "ios") {
    console.log("❌ getIOSFCMToken: iOS 플랫폼이 아닙니다");
    return null;
  }

  // 1. 먼저 localStorage에서 저장된 토큰 확인
  const savedToken = localStorage.getItem("fcm_token_debug");
  if (savedToken) {
    console.log(
      "✅ localStorage에서 iOS FCM 토큰 발견:",
      savedToken.substring(0, 30) + "..."
    );
    return savedToken;
  }
  console.log("ℹ️ localStorage에 저장된 토큰이 없습니다");

  // 2. 전역 리스너가 없으면 한 번만 등록 (앱 시작 시점에 등록되도록)
  if (!fcmTokenListenerAdded) {
    console.log("📡 iOS FCM 토큰 이벤트 리스너 등록 중...");
    window.addEventListener("fcmToken", handleFCMTokenGlobal);
    fcmTokenListenerAdded = true;
    console.log("✅ iOS FCM 토큰 이벤트 리스너 등록 완료");
  } else {
    console.log("ℹ️ iOS FCM 토큰 이벤트 리스너가 이미 등록되어 있습니다");
  }

  console.log("⏳ iOS FCM 토큰 대기 중... (최대 15초)");

  return new Promise((resolve) => {
    // 타임아웃 (15초 - iOS는 초기화 시간이 좀 더 걸릴 수 있음)
    const timeoutId = setTimeout(() => {
      // 대기 목록에서 제거
      const index = pendingResolvers.indexOf(resolve);
      if (index > -1) {
        pendingResolvers.splice(index, 1);
      }
      // 타임아웃 시에도 localStorage 다시 확인
      const timeoutToken = localStorage.getItem("fcm_token_debug");
      if (timeoutToken) {
        console.log("⏰ 타임아웃 후 localStorage에서 토큰 발견");
        resolve(timeoutToken);
        return;
      }
      console.warn("❌ iOS FCM 토큰을 받는 데 시간이 너무 오래 걸립니다.");
      console.warn("   - AppDelegate에서 토큰이 dispatch되었는지 확인하세요");
      console.warn("   - Xcode 콘솔에서 'FCM 토큰 수신' 메시지를 확인하세요");
      resolve(null);
    }, 15000);

    // 대기 목록에 추가
    const wrappedResolve = (token: string | null) => {
      clearTimeout(timeoutId);
      if (token) {
        console.log("✅ iOS FCM 토큰 수신 성공!");
      }
      resolve(token);
    };
    pendingResolvers.push(wrappedResolve);
  });
}

// 웹 FCM 토큰 가져오기
export async function getWebFCMToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const capWindow = window as CapacitorWindow;
  if (capWindow.Capacitor && capWindow.Capacitor.getPlatform() !== "web") {
    return null;
  }

  try {
    const { getFirebaseMessaging } = await import("@/lib/firebase");
    const { getToken } = await import("firebase/messaging");

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("알림 권한이 거부되��습니다.");
      return null;
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) return token;

    console.warn("웹 FCM ���큰을 받을 수 없습니다.");
    return null;
  } catch (error) {
    console.error("웹 FCM 토큰 발급 실패:", error);
    return null;
  }
}

// 푸시 알림 권한 요청 및 토큰 등록 (네이티브 + 웹 FCM)
export function useWebPushNotification() {
  const registerPushToken = useRegisterPushToken();
  const isRegisteringRef = useRef(false);
  const hasRegisteredRef = useRef(false);
  const errorCountRef = useRef(0); // 에러 발생 횟수 추적

  // 안드로이드 FCM 토큰 등록 (먼저 정의)
  const registerAndroidFCMToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAndroidFCMToken();
      if (!token) {
        console.warn("안드로이드 FCM 토큰을 받을 수 없습니다.");
        isRegisteringRef.current = false;
        return false;
      }

      console.log("안드로이드 FCM 토큰 받음:", token);

      // 서버에 토큰 등록
      await registerPushToken.mutateAsync({
        token,
        platform: "android",
      });

      console.log("안드로이드 푸시 알림이 성공적으로 등록되었습니다.");
      hasRegisteredRef.current = true;
      isRegisteringRef.current = false;
      errorCountRef.current = 0;
      return true;
    } catch (error: unknown) {
      errorCountRef.current += 1;
      console.error("안드로이드 푸시 알림 등록 실패:", error);

      // 에러가 "get() returned more than one PushToken"인 경우, 이미 등록된 것으로 간주
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (error as { message?: string })?.message ||
        String(error);
      if (errorMessage.includes("get() returned more than one PushToken")) {
        console.warn(
          "이미 여러 개의 토큰이 존재합니다. 등록 완료로 처리합니다."
        );
        hasRegisteredRef.current = true; // 이미 등록된 것으로 처리
        isRegisteringRef.current = false;
        errorCountRef.current = 0;
        return true;
      }

      // 에러가 3번 이상 발생하면 더 이상 시도하지 않음
      if (errorCountRef.current >= 3) {
        console.error(
          "푸시 토큰 등록이 3번 연속 실패했습니다. 더 이상 시도하지 않습니다."
        );
        hasRegisteredRef.current = true; // 더 이상 시도하지 않도록 플래그 설정
      }

      isRegisteringRef.current = false;
      return false;
    }
  }, [registerPushToken]);

  // iOS FCM 토큰 등록
  const registerIOSFCMToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getIOSFCMToken();
      if (!token) {
        console.warn("iOS FCM 토큰을 받을 수 없습니다.");
        isRegisteringRef.current = false;
        return false;
      }

      console.log("iOS FCM 토큰 받음:", token);

      // 서버에 토큰 등록
      try {
        console.log("iOS 푸시 토큰 서버 등록 시도");
        await registerPushToken.mutateAsync({
          token,
          platform: "ios",
        });
        console.log("iOS 푸시 토큰 서버 등록 완료");
      } catch (err) {
        console.error("iOS 푸시 토큰 서버 등록 실패:", err);
        throw err;
      }

      console.log("iOS 푸시 알림이 성공적으로 등록되었습니다.");
      hasRegisteredRef.current = true;
      isRegisteringRef.current = false;
      errorCountRef.current = 0;
      return true;
    } catch (error: unknown) {
      errorCountRef.current += 1;
      console.error("iOS 푸시 알림 등록 실패:", error);

      // 에러가 "get() returned more than one PushToken"인 경우, 이미 등록된 것으로 간주
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ||
        (error as { message?: string })?.message ||
        String(error);
      if (errorMessage.includes("get() returned more than one PushToken")) {
        console.warn(
          "이미 여러 개의 토큰이 존재합니다. 등록 완료로 처리합니다."
        );
        hasRegisteredRef.current = true; // 이미 등록된 것으로 처리
        isRegisteringRef.current = false;
        errorCountRef.current = 0;
        return true;
      }

      // 에러가 3번 이상 발생하면 더 이상 시도하지 않음
      if (errorCountRef.current >= 3) {
        console.error(
          "푸시 토큰 등록이 3번 연속 실패했습니다. 더 이상 시도하지 않습니다."
        );
        hasRegisteredRef.current = true; // 더 이상 시도하지 않도록 플래그 설정
      }

      isRegisteringRef.current = false;
      return false;
    }
  }, [registerPushToken]);

  const requestPermissionAndRegisterToken =
    useCallback(async (): Promise<boolean> => {
      // 이미 등록 중이거나 등록 완료된 경우 스킵
      if (isRegisteringRef.current || hasRegisteredRef.current) {
        console.log("푸시 토큰 등록이 이미 진행 중이거나 완료되었습니다.");
        return false;
      }

      isRegisteringRef.current = true;
      try {
        // 플랫폼 확인
        const detectedPlatform = detectPlatform();

        // iOS 플랫폼 처리
        if (detectedPlatform === "ios") {
          // getIOSFCMToken 내부에서 이미 localStorage 확인하고 있으므로 바로 호출
          const result = await registerIOSFCMToken();

          // 네이티브(Firebase + Capacitor) 토큰을 받았다면 그대로 종료
          if (result) {
            return true;
          }

          // iOS 네이티브 토큰을 받지 못한 경우 웹 푸시는 지원하지 않음
          console.warn(
            "iOS 네이티브 토큰을 받지 못했습니다. iOS에서는 웹 푸시를 지원하지 않습니다."
          );
          isRegisteringRef.current = false;
          return false;
        }

        // 안드로이드 플랫폼 처리
        if (detectedPlatform === "android") {
          const result = await registerAndroidFCMToken();
          isRegisteringRef.current = false;
          return result;
        }

        // 웹 플랫폼 — Firebase Web Push
        const webToken = await getWebFCMToken();
        if (webToken) {
          try {
            await registerPushToken.mutateAsync({
              token: webToken,
              platform: "web",
            });
            hasRegisteredRef.current = true;
            errorCountRef.current = 0;
            isRegisteringRef.current = false;
            return true;
          } catch (err: unknown) {
            const errMsg =
              (err as { response?: { data?: { detail?: string } } })?.response
                ?.data?.detail || String(err);
            if (errMsg.includes("get() returned more than one PushToken")) {
              hasRegisteredRef.current = true;
              isRegisteringRef.current = false;
              return true;
            }
            throw err;
          }
        }
        isRegisteringRef.current = false;
        return false;
      } catch (error: unknown) {
        errorCountRef.current += 1;
        console.error("푸시 알림 등록 실패:", error);

        // 에러가 "get() returned more than one PushToken"인 경우, 이미 등록된 것으로 간주
        const errorMessage =
          (error as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail ||
          (error as { message?: string })?.message ||
          String(error);
        if (errorMessage.includes("get() returned more than one PushToken")) {
          console.warn(
            "이미 여러 개의 토큰이 존재합니다. 등록 완료로 처리합니다."
          );
          hasRegisteredRef.current = true;
          isRegisteringRef.current = false;
          errorCountRef.current = 0;
          return true;
        }

        if (errorCountRef.current >= 3) {
          console.error(
            "푸시 토큰 등록이 3번 연속 실패했습니다. 더 이상 시도하지 않습니다."
          );
          hasRegisteredRef.current = true;
        }

        isRegisteringRef.current = false;
        return false;
      }
    }, [registerPushToken, registerAndroidFCMToken, registerIOSFCMToken]);

  return {
    requestPermissionAndRegisterToken,
    isLoading: registerPushToken.isPending,
    error: registerPushToken.error,
  };
}
