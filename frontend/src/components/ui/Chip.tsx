"use client";
import React, { createContext, useContext } from "react";
import clsx from "clsx";

// 타입 정의
export type ChipVariant =
  | "default"
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "brand";
export type ChipTheme = Record<ChipVariant, string>;

// 기본 테마
const defaultChipTheme: ChipTheme = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green/10 text-green",
  warning: "bg-yellow/10 text-yellow",
  info: "bg-bg text-gr",
  danger: "bg-red/10 text-red",
  brand: "bg-brand/10 text-brand",
};

// 테마 컨텍스트
const ChipThemeContext = createContext<ChipTheme>(defaultChipTheme);
export function ChipProvider({
  theme,
  children,
}: {
  theme?: Partial<ChipTheme>;
  children: React.ReactNode;
}) {
  const merged: ChipTheme = {
    ...defaultChipTheme,
    ...(theme as Partial<ChipTheme>),
  };
  return (
    <ChipThemeContext.Provider value={merged}>
      {children}
    </ChipThemeContext.Provider>
  );
}
export function useChipTheme() {
  return useContext(ChipThemeContext);
}

// Chip 컴포넌트
export type ChipProps = {
  children: React.ReactNode;
  variant?: ChipVariant;
  className?: string;
};
export function Chip({ children, variant = "default", className }: ChipProps) {
  const theme = useChipTheme();
  return (
    <h6
      className={clsx(
        "px-[8px] py-[3px] rounded-lg text-[14px] font-semibold inline-block leading-[22px]",
        theme[variant],
        className
      )}
    >
      {children}
    </h6>
  );
}

// 값-색상 매핑 Chip
export type MappedChipProps<Value extends string = string> = {
  value: Value;
  map: Partial<Record<Value, ChipVariant>>;
  fallback?: ChipVariant;
  className?: string;
  children?: React.ReactNode;
};
export function MappedChip<Value extends string = string>({
  value,
  map,
  fallback = "default",
  className,
  children,
}: MappedChipProps<Value>) {
  const variant = map[value] ?? fallback;
  return (
    <Chip variant={variant} className={className}>
      {children ?? value}
    </Chip>
  );
}
