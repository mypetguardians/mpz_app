import React, { CSSProperties, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function Container({ children, className = "", style }: ContainerProps) {
  // min-h-screen은 SafeAreaLayout(h-screen)과 충돌하므로 제거
  const safeClassName = className.replace(/min-h-screen/g, "").trim();
  return (
    <main
      className={`max-w-[420px] mx-auto w-full bg-wh flex-1 overflow-y-auto ${safeClassName}`}
      style={style}
    >
      {children}
    </main>
  );
}

export { Container };
