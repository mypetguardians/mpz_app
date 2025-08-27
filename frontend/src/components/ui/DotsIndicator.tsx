import React from "react";

interface DotsIndicatorProps {
  count: number;
  maxCount?: number;
  color?: string;
  className?: string;
  variant?: "variant1" | "variant2";
}

export function DotsIndicator({
  count,
  maxCount = 5,
  color = "bg-brand",
  className = "",
  variant = "variant1",
}: DotsIndicatorProps) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: maxCount }).map((_, i) => {
        const isActive = i < count;

        if (variant === "variant2") {
          // 테두리 있는 타입: 비활성은 흰 배경 + 회색 테두리, 활성은 컬러 배경
          return (
            <div
              key={i}
              className={`rounded-sm w-3 h-3 ${
                isActive ? `${color} border-transparent` : "bg-lg"
              }`}
            />
          );
        }

        // 기본 타입: 활성은 컬러 배경, 비활성은 회색 배경
        return (
          <div
            key={i}
            className={`rounded-full w-2 h-2 ${
              isActive ? `${color} border-transparent` : "bg-lg"
            }`}
          />
        );
      })}
    </div>
  );
}
