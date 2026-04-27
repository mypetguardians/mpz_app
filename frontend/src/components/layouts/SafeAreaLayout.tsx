"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { SafeArea } from "capacitor-plugin-safe-area";

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

  const applyInsets = useCallback(
    (insets: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    }) => {
      if (typeof window === "undefined") return;

      const topValue = clampValue(insets.top ?? 0);
      const bottomValue = clampValue(insets.bottom ?? 0, 50);
      const leftValue = clampValue(insets.left ?? 0);
      const rightValue = clampValue(insets.right ?? 0);

      document.documentElement.style.setProperty(
        "--safe-area-top",
        `${topValue}px`
      );
      document.documentElement.style.setProperty(
        "--safe-area-bottom",
        `${bottomValue}px`
      );
      document.documentElement.style.setProperty(
        "--safe-area-left",
        `${leftValue}px`
      );
      document.documentElement.style.setProperty(
        "--safe-area-right",
        `${rightValue}px`
      );

      setSafeAreaTop((prev) => {
        if (Math.abs(prev - topValue) > 1) {
          return topValue;
        }
        return prev;
      });
      setSafeAreaBottom((prev) => {
        if (Math.abs(prev - bottomValue) > 1) {
          return bottomValue;
        }
        return prev;
      });
    },
    [clampValue]
  );

  // Safe area 값을 가져오는 함수 (CSS/env fallback)
  const updateSafeAreaValues = useCallback(() => {
    if (typeof window === "undefined") return;

    const isAndroid = Capacitor.getPlatform() === "android";
    const isIOS = Capacitor.getPlatform() === "ios";

    if (isAndroid) {
      const top = getComputedStyle(document.documentElement)
        .getPropertyValue("--safe-area-top")
        ?.trim();
      const bottom = getComputedStyle(document.documentElement)
        .getPropertyValue("--safe-area-bottom")
        ?.trim();

      applyInsets({
        top: top && top !== "0px" ? parseFloat(top) : 0,
        bottom: bottom && bottom !== "0px" ? parseFloat(bottom) : 0,
      });
    } else if (isIOS) {
      const top = getComputedStyle(document.documentElement)
        .getPropertyValue("env(safe-area-inset-top)")
        ?.trim();
      const bottom = getComputedStyle(document.documentElement)
        .getPropertyValue("env(safe-area-inset-bottom)")
        ?.trim();

      applyInsets({
        top: top && top !== "0px" ? parseFloat(top) : 0,
        bottom: bottom && bottom !== "0px" ? parseFloat(bottom) : 0,
      });
    }
  }, [applyInsets]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Safe area로 확보된 영역도 흰색으로 채워서 투명 배경 노출 방지
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prevHtmlBg = htmlEl.style.backgroundColor;
    const prevBodyBg = bodyEl.style.backgroundColor;
    htmlEl.style.backgroundColor = "#fff";
    bodyEl.style.backgroundColor = "#fff";

    const isIOS = Capacitor.getPlatform() === "ios";
    const isAndroid = Capacitor.getPlatform() === "android";

    // 플랫폼 식별 data-attr만 설정
    if (isIOS) {
      document.documentElement.setAttribute("data-capacitor-platform", "ios");
    }
    if (isAndroid) {
      document.documentElement.setAttribute(
        "data-capacitor-platform",
        "android"
      );
    }

    const recalcSafeArea = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { insets } = await SafeArea.getSafeAreaInsets();
          applyInsets(insets);
          return;
        } catch (error) {
          console.warn("SafeArea plugin 실패, fallback 사용", error);
        }
      }
      updateSafeAreaValues();
    };

    // 플러그인으로 먼저 안전 영역을 주입 (실패하면 기존 방식 fallback)
    let safeAreaPluginListener: { remove: () => void } | null = null;
    (async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { insets } = await SafeArea.getSafeAreaInsets();
          applyInsets(insets);
          safeAreaPluginListener = await SafeArea.addListener(
            "safeAreaChanged",
            ({ insets }) => applyInsets(insets)
          );
        } catch (error) {
          console.warn("SafeArea plugin 초기 로드 실패, fallback 사용", error);
          updateSafeAreaValues();
        }
      } else {
        updateSafeAreaValues();
      }
    })();

    // 안드로이드에서 네이티브가 이벤트로 보내줄 경우만 반영
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

    // 백그라운드→포그라운드 복귀 시 재계산
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 약간의 지연 후 두 번 재계산 (레이아웃 안정화 대기)
        setTimeout(() => recalcSafeArea(), 60);
        setTimeout(() => recalcSafeArea(), 180);
      }
    };

    window.addEventListener(
      "safeAreaInsetsChanged",
      handleSafeAreaChange as EventListener
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(
        "safeAreaInsetsChanged",
        handleSafeAreaChange as EventListener
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (safeAreaPluginListener) {
        safeAreaPluginListener.remove();
      }
      htmlEl.style.backgroundColor = prevHtmlBg;
      bodyEl.style.backgroundColor = prevBodyBg;
    };
  }, [updateSafeAreaValues, clampValue, applyInsets]);

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
      className="relative flex h-screen flex-col overflow-hidden bg-wh"
      style={{
        paddingTop: safeAreaTopStyle,
        // 네비게이션 높이 + safe-area bottom 합산
        paddingBottom: combinedBottomPadding,
        backgroundColor: "#fff",
      }}
    >
      {children}
    </div>
  );
}
