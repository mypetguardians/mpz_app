"use client";

import { ReactNode, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

interface SafeAreaLayoutProps {
  children: ReactNode;
}

export function SafeAreaLayout({ children }: SafeAreaLayoutProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isIOS = Capacitor.getPlatform() === "ios";

    // iOS 네이티브에서는 CSS 변수를 0으로 설정하여 Safe Area 여백 제거
    if (isIOS) {
      // CSS 변수를 0으로 설정
      document.documentElement.style.setProperty("--safe-area-top", "0px");
      document.documentElement.style.setProperty("--safe-area-bottom", "0px");
      document.documentElement.style.setProperty("--safe-area-left", "0px");
      document.documentElement.style.setProperty("--safe-area-right", "0px");

      // html 요소에 data 속성 추가 (CSS 선택자용)
      document.documentElement.setAttribute("data-capacitor-platform", "ios");

      // body에도 직접 padding/margin 제거
      document.body.style.paddingTop = "0px";
      document.body.style.marginTop = "0px";
      document.body.style.paddingLeft = "0px";
      document.body.style.paddingRight = "0px";

      // html 요소에도 직접 padding 제거
      document.documentElement.style.paddingTop = "0px";
      document.documentElement.style.marginTop = "0px";
    }

    const isAndroid = /Android/i.test(window.navigator.userAgent);
    const safeBottom = getComputedStyle(document.documentElement)
      .getPropertyValue("env(safe-area-inset-bottom)")
      ?.trim();
    const edgeToEdgeActive =
      isAndroid && safeBottom !== "" && safeBottom !== "0px";

    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[SafeAreaLayout] Edge-to-edge:",
        edgeToEdgeActive ? "active" : "inactive",
        "iOS Native:",
        isIOS
      );
    }
  }, []);

  // Safe Area는 TopBar와 NavBar에서만 처리하므로, 여기서는 전체 children에 padding을 적용하지 않음
  // iOS 네이티브와 웹/안드로이드 모두 동일하게 처리
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
