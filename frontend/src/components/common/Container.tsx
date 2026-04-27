import React, { CSSProperties, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function Container({ children, className = "", style }: ContainerProps) {
  return (
    <main
      className={`max-w-[420px] mx-auto w-full bg-wh flex-1 overflow-y-auto ${className}`}
      style={style}
    >
      {children}
    </main>
  );
}

export { Container };
