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
  // 고정 하단 네비게이션 높이 (px)
  const NAV_HEIGHT = 64;

  const clampValue = useCallback((value: number, max = 60) => {
    if (Number.isNaN(value)) return 0;
    return Math.min(Math.max(value, 0), max);
  }, []);

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
        const topValue = clampValue(parseFloat(top));
        setSafeAreaTop((prev) => {
          // 값이 실제로 변경된 경우에만 업데이트
          if (Math.abs(prev - topValue) > 1) {
            return topValue;
          }
          return prev;
        });
      }

      if (bottom && bottom !== "0px" && bottom !== "") {
        const bottomValue = clampValue(parseFloat(bottom), 50);
        setSafeAreaBottom((prev) => {
          if (Math.abs(prev - bottomValue) > 1) {
            return bottomValue;
          }
          return prev;
        });
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
        const topValue = clampValue(parseFloat(top));
        setSafeAreaTop((prev) => {
          if (Math.abs(prev - topValue) > 1) {
            return topValue;
          }
          return prev;
        });
      }

      if (bottom && bottom !== "0px" && bottom !== "") {
        const bottomValue = clampValue(parseFloat(bottom), 50);
        setSafeAreaBottom((prev) => {
          if (Math.abs(prev - bottomValue) > 1) {
            return bottomValue;
          }
          return prev;
        });
      }
    }
  }, [clampValue]);

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
        const clampedTop = clampValue(top);
        setSafeAreaTop((prev) => {
          if (Math.abs(prev - clampedTop) > 1) {
            return clampedTop;
          }
          return prev;
        });
      }
      if (bottom !== undefined && bottom >= 0) {
        const clampedBottom = clampValue(bottom, 50);
        setSafeAreaBottom((prev) => {
          if (Math.abs(prev - clampedBottom) > 1) {
            return clampedBottom;
          }
          return prev;
        });
      }
    };

    // 앱이 포그라운드로 돌아올 때 safe area 재계산
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 먼저 값을 0으로 리셋한 후 재계산 (잘못된 값 방지)
        setSafeAreaTop(0);
        setSafeAreaBottom(0);

        // 약간의 지연을 두고 재계산 (레이아웃이 안정화된 후)
        setTimeout(() => {
          updateSafeAreaValues();
        }, 50);

        // 추가 재계산 (더 안정적)
        setTimeout(() => {
          updateSafeAreaValues();
        }, 200);
      }
    };

    // 앱 상태 변경 감지 (Capacitor)
    let appStateListener: { remove: () => Promise<void> } | null = null;
    if (Capacitor.isNativePlatform()) {
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          // 먼저 값을 0으로 리셋한 후 재계산 (잘못된 값 방지)
          setSafeAreaTop(0);
          setSafeAreaBottom(0);

          // 앱이 활성화될 때 safe area 재계산
          setTimeout(() => {
            updateSafeAreaValues();
          }, 50);

          // 추가 재계산 (더 안정적)
          setTimeout(() => {
            updateSafeAreaValues();
          }, 200);
        } else {
          // 앱이 백그라운드로 갈 때는 값을 유지 (선택사항)
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
    // 하지만 너무 자주 실행하면 성능 문제가 있을 수 있으므로 간격을 늘림
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        // 현재 값이 비정상적으로 큰 경우에만 재계산
        if (safeAreaTop > 100 || safeAreaBottom > 100) {
          setSafeAreaTop(0);
          setSafeAreaBottom(0);
          updateSafeAreaValues();
        }
      }
    }, 2000);

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
  }, [updateSafeAreaValues, clampValue, safeAreaTop, safeAreaBottom]);

  // 비정상적으로 큰 값 방지 (100px 이상이면 0으로 처리)
  const normalizedSafeAreaTop = safeAreaTop > 100 ? 0 : safeAreaTop;
  const normalizedSafeAreaBottom = safeAreaBottom > 100 ? 0 : safeAreaBottom;

  // CSS env() 값을 직접 사용 (더 안정적)
  const safeAreaTopStyle =
    normalizedSafeAreaTop > 0
      ? `${normalizedSafeAreaTop}px`
      : "env(safe-area-inset-top, 0px)";
  const safeAreaBottomStyle =
    normalizedSafeAreaBottom > 0
      ? `${normalizedSafeAreaBottom}px`
      : "env(safe-area-inset-bottom, 0px)";
  const combinedBottomPadding = `calc(${safeAreaBottomStyle} + ${NAV_HEIGHT}px)`;

  return (
    <div
      className="flex min-h-screen flex-col bg-wh"
      style={{
        paddingTop: safeAreaTopStyle,
        // 네비게이션 높이 + safe-area bottom 합산
        paddingBottom: combinedBottomPadding,
      }}
    >
      {children}
    </div>
  );
}
