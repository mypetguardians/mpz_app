"use client";

import { ReactNode, useEffect } from "react";

interface SafeAreaLayoutProps {
  children: ReactNode;
}

export function SafeAreaLayout({ children }: SafeAreaLayoutProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAndroid = /Android/i.test(window.navigator.userAgent);
    const safeBottom = getComputedStyle(document.documentElement)
      .getPropertyValue("env(safe-area-inset-bottom)")
      ?.trim();
    const edgeToEdgeActive =
      isAndroid && safeBottom !== "" && safeBottom !== "0px";

    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[SafeAreaLayout] Edge-to-edge:",
        edgeToEdgeActive ? "active" : "inactive"
      );
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col px-safe-left px-safe-right">
      {children}
    </div>
  );
}
