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

      // 초기 safe area 값 가져오기
      const getInitialSafeArea = () => {
        const top = getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-top")
          ?.trim();
        if (top && top !== "0px" && top !== "") {
          const topValue = parseInt(top.replace("px", "")) || 0;
          // 비정상적으로 큰 값 방지 (일반적으로 100px 이하)
          if (topValue > 0 && topValue <= 100) {
            setSafeAreaTop(topValue);
          }
        }
      };

      getInitialSafeArea();

      // safe area 변경 이벤트 리스너
      const handleSafeAreaChange = (event: CustomEvent) => {
        const { top } = event.detail;
        if (top !== undefined && top >= 0) {
          // 비정상적으로 큰 값 방지 (일반적으로 100px 이하)
          // 이전 값과 비교하여 급격한 증가 방지
          if (
            top <= 100 &&
            (safeAreaTop === 0 || Math.abs(top - safeAreaTop) <= 50)
          ) {
            setSafeAreaTop(top);
          } else {
            console.warn(
              `비정상적인 safe area top 값 감지: ${top}px, 이전 값: ${safeAreaTop}px`
            );
          }
        }
      };

      window.addEventListener(
        "safeAreaInsetsChanged",
        handleSafeAreaChange as EventListener
      );

      return () => {
        window.removeEventListener(
          "safeAreaInsetsChanged",
          handleSafeAreaChange as EventListener
        );
      };
    }
  }, [safeAreaTop]);

  return (
    <>
      {/* 상단 safe area 영역을 흰색으로 채움 */}
      <div
        className="fixed top-0 left-0 right-0 bg-wh z-50"
        style={{
          height: safeAreaTop > 0 ? `${safeAreaTop}px` : "var(--safe-area-top)",
        }}
      />
      <div className="flex min-h-screen flex-col pt-safe-top bg-wh">
        {children}
      </div>
    </>
  );
}
