import React, { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`max-w-[420px] mx-auto w-full bg-wh  ${className}`}>
      {children}
    </div>
  );
}

export { Container };
