"use client";

import { ReactNode, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

interface SafeAreaLayoutProps {
  children: ReactNode;
}

export function SafeAreaLayout({ children }: SafeAreaLayoutProps) {
  const [safeAreaTop, setSafeAreaTop] = useState(0);

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

      // 초기 safe area 값 확인
      const checkSafeArea = () => {
        const top = getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-top")
          ?.trim();
        if (top && top !== "0px" && top !== "") {
          const topValue = parseInt(top.replace("px", "")) || 0;
          if (topValue > 0) {
            setSafeAreaTop(topValue);
            if (process.env.NODE_ENV !== "production") {
              console.info("[SafeAreaLayout] Safe area top 값 확인:", topValue);
            }
          }
        }
      };

      // safeAreaInsetsChanged 이벤트 리스너
      const handleSafeAreaChange = (event: CustomEvent) => {
        const { top } = event.detail;
        if (top && top > 0) {
          setSafeAreaTop(top);
          if (process.env.NODE_ENV !== "production") {
            console.info(
              "[SafeAreaLayout] Safe area insets 업데이트:",
              event.detail
            );
          }
        }
      };

      window.addEventListener(
        "safeAreaInsetsChanged",
        handleSafeAreaChange as EventListener
      );

      // 초기 확인 (즉시)
      checkSafeArea();

      // 주기적으로 확인 (네이티브에서 값이 전달되는 시간 고려)
      const intervals: NodeJS.Timeout[] = [];
      [100, 300, 500, 1000, 2000].forEach((delay) => {
        const timeoutId = setTimeout(checkSafeArea, delay);
        intervals.push(timeoutId);
      });

      // 추가로 100ms마다 확인 (최대 5초)
      let checkCount = 0;
      const maxChecks = 50; // 5초
      const intervalId = setInterval(() => {
        checkSafeArea();
        checkCount++;
        if (checkCount >= maxChecks) {
          clearInterval(intervalId);
        }
      }, 100);

      return () => {
        window.removeEventListener(
          "safeAreaInsetsChanged",
          handleSafeAreaChange as EventListener
        );
        intervals.forEach((id) => clearTimeout(id));
        clearInterval(intervalId);
      };
    }

    const isAndroidWeb = /Android/i.test(window.navigator.userAgent);
    const safeBottom = getComputedStyle(document.documentElement)
      .getPropertyValue("env(safe-area-inset-bottom)")
      ?.trim();
    const edgeToEdgeActive =
      isAndroidWeb && safeBottom !== "" && safeBottom !== "0px";

    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[SafeAreaLayout] Edge-to-edge:",
        edgeToEdgeActive ? "active" : "inactive",
        "iOS Native:",
        isIOS,
        "Android Native:",
        isAndroid
      );
    }
  }, []);

  return (
    <div
      className="flex min-h-screen flex-col pt-safe-top"
      style={safeAreaTop > 0 ? { paddingTop: `${safeAreaTop}px` } : undefined}
    >
      {children}
    </div>
  );
}
