"use client";

import Script from "next/script";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { KakaoNativeLogin } from "@/lib/capacitor/kakao-login";

interface KakaoProviderProps {
  children: React.ReactNode;
}

export function KakaoProvider({ children }: KakaoProviderProps) {
  const kakaoKey = "06b1ee860fa3d10d88b67258d93243cf";
  const nativeAppKey = "30c65f4b266ed8e462b30c91518d174b";

  useEffect(() => {
    // 네이티브 플랫폼인 경우 네이티브 플러그인 초기화
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    console.log("🔵 [KakaoProvider] 플랫폼 확인:", { isNative, platform });

    if (isNative) {
      const initializeNativeKakao = async () => {
        try {
          console.log("🔵 [KakaoProvider] 네이티브 카카오 SDK 초기화 시작...", {
            plugin: KakaoNativeLogin,
            hasInitialize: typeof KakaoNativeLogin?.initialize === "function",
            appKey: nativeAppKey,
          });

          if (!KakaoNativeLogin) {
            console.error(
              "❌ [KakaoProvider] KakaoNativeLogin 플러그인이 없습니다!"
            );
            return;
          }

          if (typeof KakaoNativeLogin.initialize !== "function") {
            console.error(
              "❌ [KakaoProvider] KakaoNativeLogin.initialize 메서드가 없습니다!"
            );
            return;
          }

          await KakaoNativeLogin.initialize({ appKey: nativeAppKey });
          console.log("✅ [KakaoProvider] 네이티브 카카오 SDK 초기화 완료");
        } catch (error) {
          console.error(
            "❌ [KakaoProvider] 네이티브 카카오 SDK 초기화 실패:",
            error
          );
          console.error("에러 상세:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      };
      initializeNativeKakao();
    }

    // 웹 플랫폼인 경우 JavaScript SDK 초기화
    if (!kakaoKey) {
      console.error("NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY가 설정되지 않았습니다.");
      return;
    }
    // SDK가 이미 로드되어 있는 경우를 대비한 초기화
    const initializeKakao = () => {
      if (typeof window === "undefined") {
        return;
      }
      const kakao = window.Kakao;
      if (!kakao?.init) {
        return;
      }
      try {
        const alreadyInitialized = kakao.isInitialized?.() ?? false;
        if (!alreadyInitialized) {
          console.log("카카오 JavaScript SDK 초기화 중...");
          kakao.init(kakaoKey);
          console.log("카카오 JavaScript SDK 초기화 완료");
        } else {
          console.log("카카오 JavaScript SDK가 이미 초기화되어 있습니다.");
        }
      } catch (error) {
        console.error("카카오 JavaScript SDK 초기화 실패:", error);
      }
    };

    // 즉시 확인
    initializeKakao();

    // 주기적으로 확인 (SDK 로드가 늦을 수 있음)
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.Kakao?.init) {
        initializeKakao();
        clearInterval(interval);
      }
    }, 100);

    // 5초 후에는 포기
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [kakaoKey, nativeAppKey]);

  return (
    <>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
