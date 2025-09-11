"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  PushTokenRequest,
  PushTokenResponse,
  DeletePushTokenRequest,
  Platform,
} from "@/types/notifications";

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

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/android/.test(userAgent)) {
    return "android";
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  } else {
    return "web";
  }
}

// 웹 푸시 알림 권한 요청 및 토큰 등록
export function useWebPushNotification() {
  const registerPushToken = useRegisterPushToken();

  const requestPermissionAndRegisterToken = async (): Promise<boolean> => {
    try {
      // 브라우저 지원 확인
      if (!("Notification" in window)) {
        console.warn("이 브라우저는 알림을 지원하지 않습니다.");
        return false;
      }

      if (!("serviceWorker" in navigator)) {
        console.warn("이 브라우저는 Service Worker를 지원하지 않습니다.");
        return false;
      }

      // 이미 권한이 있는 경우 토큰만 등록
      if (Notification.permission === "granted") {
        console.log("알림 권한이 이미 허용되어 있습니다.");
      } else if (Notification.permission === "denied") {
        console.warn(
          "알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
        );
        return false;
      } else {
        // 권한이 아직 요청되지 않은 경우에만 요청 (사용자 제스처 필요)
        console.log("알림 권한을 요청합니다. 사용자 제스처가 필요합니다.");
        return false; // 사용자 제스처 없이는 권한 요청하지 않음
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 푸시 구독 생성 (실제 VAPID 키는 환경변수에서 가져와야 함)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // 토큰 추출 (실제로는 subscription 객체를 서버에 전송)
      const token = JSON.stringify(subscription);
      const platform = detectPlatform();

      // 서버에 토큰 등록
      await registerPushToken.mutateAsync({
        token,
        platform,
      });

      console.log("웹 푸시 알림이 성공적으로 등록되었습니다.");
      return true;
    } catch (error) {
      console.error("웹 푸시 알림 등록 실패:", error);
      return false;
    }
  };

  // 사용자 제스처로 알림 권한 요청
  const requestPermissionWithUserGesture = async (): Promise<boolean> => {
    try {
      // 브라우저 지원 확인
      if (!("Notification" in window)) {
        console.warn("이 브라우저는 알림을 지원하지 않습니다.");
        return false;
      }

      if (!("serviceWorker" in navigator)) {
        console.warn("이 브라우저는 Service Worker를 지원하지 않습니다.");
        return false;
      }

      // 알림 권한 요청 (사용자 제스처 필요)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("알림 권한이 거부되었습니다.");
        return false;
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 푸시 구독 생성
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // 토큰 추출
      const token = JSON.stringify(subscription);
      const platform = detectPlatform();

      // 서버에 토큰 등록
      await registerPushToken.mutateAsync({
        token,
        platform,
      });

      console.log("웹 푸시 알림이 성공적으로 등록되었습니다.");
      return true;
    } catch (error) {
      console.error("웹 푸시 알림 등록 실패:", error);
      return false;
    }
  };

  return {
    requestPermissionAndRegisterToken,
    requestPermissionWithUserGesture,
    isLoading: registerPushToken.isPending,
    error: registerPushToken.error,
  };
}
