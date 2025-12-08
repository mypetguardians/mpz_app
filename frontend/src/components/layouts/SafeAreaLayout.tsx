"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

interface SafeAreaLayoutProps {
  children: ReactNode;
}

export function SafeAreaLayout({ children }: SafeAreaLayoutProps) {
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  // Safe area 값을 가져오는 함수
  const updateSafeAreaValues = useCallback(() => {
    if (typeof window === "undefined") return;

    const isAndroid = Capacitor.getPlatform() === "android";
    const isIOS = Capacitor.getPlatform() === "ios";

    if (isAndroid) {
      // Android: CSS 변수에서 값 가져오기
      const top = getComputedStyle(document.documentElement)
        .getPropertyValue("--safe-area-top")
        ?.trim();
      const bottom = getComputedStyle(document.documentElement)
        .getPropertyValue("--safe-area-bottom")
        ?.trim();

      if (top && top !== "0px" && top !== "") {
        const topValue = parseInt(top.replace("px", "")) || 0;
        if (topValue > 0 && topValue <= 100) {
          setSafeAreaTop((prev) => {
            // 값이 실제로 변경된 경우에만 업데이트
            if (Math.abs(prev - topValue) > 1) {
              return topValue;
            }
            return prev;
          });
        }
      }

      if (bottom && bottom !== "0px" && bottom !== "") {
        const bottomValue = parseInt(bottom.replace("px", "")) || 0;
        if (bottomValue >= 0 && bottomValue <= 100) {
          setSafeAreaBottom((prev) => {
            if (Math.abs(prev - bottomValue) > 1) {
              return bottomValue;
            }
            return prev;
          });
        }
      }
    } else if (isIOS) {
      // iOS: env() 값 사용
      const top = getComputedStyle(document.documentElement)
        .getPropertyValue("env(safe-area-inset-top)")
        ?.trim();
      const bottom = getComputedStyle(document.documentElement)
        .getPropertyValue("env(safe-area-inset-bottom)")
        ?.trim();

      if (top && top !== "0px" && top !== "") {
        const topValue = parseInt(top.replace("px", "")) || 0;
        if (topValue > 0 && topValue <= 100) {
          setSafeAreaTop((prev) => {
            if (Math.abs(prev - topValue) > 1) {
              return topValue;
            }
            return prev;
          });
        }
      }

      if (bottom && bottom !== "0px" && bottom !== "") {
        const bottomValue = parseInt(bottom.replace("px", "")) || 0;
        if (bottomValue >= 0 && bottomValue <= 100) {
          setSafeAreaBottom((prev) => {
            if (Math.abs(prev - bottomValue) > 1) {
              return bottomValue;
            }
            return prev;
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isIOS = Capacitor.getPlatform() === "ios";
    const isAndroid = Capacitor.getPlatform() === "android";

    // iOS 네이티브에서도 safe area를 사용하도록 data 속성만 추가
    // CSS 변수는 env(safe-area-inset-top)을 사용하므로 자동으로 노치 높이가 적용됨
    if (isIOS) {
      // html 요소에 data 속성 추가 (CSS 선택자용)
      document.documentElement.setAttribute("data-capacitor-platform", "ios");
    }

    // Android의 경우 JavaScript로 전달된 safe area insets 사용
    if (isAndroid) {
      document.documentElement.setAttribute(
        "data-capacitor-platform",
        "android"
      );
    }

    // 초기 safe area 값 가져오기
    updateSafeAreaValues();

    // safe area 변경 이벤트 리스너 (Android)
    const handleSafeAreaChange = (event: CustomEvent) => {
      const { top, bottom } = event.detail;
      if (top !== undefined && top >= 0) {
        // 비정상적으로 큰 값 방지 (일반적으로 100px 이하)
        if (top <= 100) {
          setSafeAreaTop((prev) => {
            if (Math.abs(prev - top) > 1) {
              return top;
            }
            return prev;
          });
        }
      }
      if (bottom !== undefined && bottom >= 0) {
        if (bottom <= 100) {
          setSafeAreaBottom((prev) => {
            if (Math.abs(prev - bottom) > 1) {
              return bottom;
            }
            return prev;
          });
        }
      }
    };

    // 앱이 포그라운드로 돌아올 때 safe area 재계산
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 약간의 지연을 두고 재계산 (레이아웃이 안정화된 후)
        setTimeout(() => {
          updateSafeAreaValues();
        }, 100);
      }
    };

    // 앱 상태 변경 감지 (Capacitor)
    let appStateListener: { remove: () => Promise<void> } | null = null;
    if (Capacitor.isNativePlatform()) {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          // 앱이 활성화될 때 safe area 재계산
          setTimeout(() => {
            updateSafeAreaValues();
          }, 150);
        }
      }).then((listener) => {
        appStateListener = listener;
      });
    }

    window.addEventListener(
      "safeAreaInsetsChanged",
      handleSafeAreaChange as EventListener
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 주기적으로 safe area 값 확인 (백그라운드에서 돌아올 때를 대비)
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        updateSafeAreaValues();
      }
    }, 1000);

    return () => {
      window.removeEventListener(
        "safeAreaInsetsChanged",
        handleSafeAreaChange as EventListener
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(intervalId);
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, [updateSafeAreaValues]);

  return (
    <>
      {/* 상단 safe area 영역을 흰색으로 채움 */}
      <div
        className="fixed top-0 left-0 right-0 bg-wh z-50"
        style={{
          height:
            safeAreaTop > 0
              ? `${safeAreaTop}px`
              : "var(--safe-area-top, env(safe-area-inset-top, 0px))",
        }}
      />
      <div
        className="flex min-h-screen flex-col bg-wh"
        style={{
          paddingTop:
            safeAreaTop > 0
              ? `${safeAreaTop}px`
              : "var(--safe-area-top, env(safe-area-inset-top, 0px))",
          paddingBottom:
            safeAreaBottom > 0
              ? `${safeAreaBottom}px`
              : "var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </div>
    </>
  );
}
