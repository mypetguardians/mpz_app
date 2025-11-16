"use client";

import Script from "next/script";
import { useEffect } from "react";

interface KakaoProviderProps {
  children: React.ReactNode;
}

export function KakaoProvider({ children }: KakaoProviderProps) {
  const kakaoKey = "06b1ee860fa3d10d88b67258d93243cf";

  useEffect(() => {
    if (!kakaoKey) {
      console.error("NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY가 설정되지 않았습니다.");
      return;
    }
    // SDK가 이미 로드되어 있는 경우를 대비한 초기화
    const initializeKakao = () => {
      if (typeof window !== "undefined" && window.Kakao) {
        try {
          if (!window.Kakao.isInitialized || !window.Kakao.isInitialized()) {
            console.log("카카오 JavaScript SDK 초기화 중...");
            window.Kakao.init(kakaoKey);
            console.log("카카오 JavaScript SDK 초기화 완료");
          } else {
            console.log("카카오 JavaScript SDK가 이미 초기화되어 있습니다.");
          }
        } catch (error) {
          console.error("카카오 JavaScript SDK 초기화 실패:", error);
        }
      }
    };

    // 즉시 확인
    initializeKakao();

    // 주기적으로 확인 (SDK 로드가 늦을 수 있음)
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.Kakao) {
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
  }, [kakaoKey]);

  return (
    <>
      <Script
        src="https://developers.kakao.com/sdk/js/kakao.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
