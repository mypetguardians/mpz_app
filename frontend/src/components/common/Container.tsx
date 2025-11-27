import React, { CSSProperties, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function Container({ children, className = "", style }: ContainerProps) {
  return (
    <div
      className={`max-w-[420px] mx-auto w-full bg-wh ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export { Container };
