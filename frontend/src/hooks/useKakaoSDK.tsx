"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Link: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons: Array<{
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }>;
        }) => void;
      };
      Share: {
        sendScrap: (options: { requestUrl: string }) => void;
      };
    };
  }
}

export function useKakaoSDK() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkKakaoSDK = () => {
      if (typeof window !== "undefined" && window.Kakao) {
        setIsLoaded(true);
        // Kakao SDK가 로드되었지만 초기화되지 않았을 수 있으므로 확인
        if (window.Kakao.isInitialized && window.Kakao.isInitialized()) {
          setIsInitialized(true);
        } else {
          // 초기화되지 않았다면 초기화 시도
          try {
            const kakaoKey = "06b1ee860fa3d10d88b67258d93243cf";
            window.Kakao.init(kakaoKey);
            setIsInitialized(true);
          } catch (error) {
            console.error("카카오 SDK 초기화 실패:", error);
          }
        }
      }
    };

    // 즉시 확인
    checkKakaoSDK();

    // 주기적으로 확인 (SDK 로드가 늦을 수 있음)
    const interval = setInterval(checkKakaoSDK, 100);

    // 5초 후에는 포기
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return { isLoaded, isInitialized };
}
