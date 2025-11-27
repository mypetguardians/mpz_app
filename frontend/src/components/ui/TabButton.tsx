import * as React from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { cn } from "@/lib/utils";

type TabBtnVariant = "primary" | "variant3" | "variant4";

const variantStyles: Record<
  TabBtnVariant,
  { base: string; active: string; size: string }
> = {
  primary: {
    base: "text-gr font-bold h6 border-b border-b-lg",
    active: "text-bk font-bold h6 border-b border-black",
    size: "px-3",
  },
  variant3: {
    base: "text-gr font-bold h4 border-b border-b-lg",
    active: "text-bk font-bold h4 border-b border-black",
    size: "px-3",
  },
  variant4: {
    base: "text-gr font-bold h4 border-b border-b-lg",
    active: "text-bk font-bold h4 border-b border-black",
    size: "px-3",
  },
};

interface TabBtnProps {
  value: string;
  onValueChange?: (value: string) => void;
  tabs: { label: string; value: string; href?: string }[];
  variant?: TabBtnVariant;
  useLinks?: boolean;
}

export function TabButton({
  value,
  onValueChange,
  tabs,
  variant = "primary",
  useLinks = false,
}: TabBtnProps) {
  const v = variantStyles[variant];

  if (useLinks) {
    // URL 기반 네비게이션을 사용하는 경우
    return (
      <div className="w-full">
        <div className={cn("bg-transparent flex w-full")}>
          {tabs.map((tab, index) => {
            const isActive = value === tab.value;
            // tab.value가 유효하지 않은 경우 index를 fallback으로 사용
            const tabKey =
              tab.value && typeof tab.value === "string"
                ? tab.value
                : `tab-${index}`;

            const content = (
              <div
                className={cn(
                  "bg-transparent rounded-none flex flex-col items-center justify-end p-3 pb-[10px] cursor-pointer w-full",
                  v.size,
                  isActive ? v.active : v.base
                )}
              >
                {tab.label}
              </div>
            );

            return tab.href ? (
              <Link
                key={tabKey}
                href={tab.href}
                className={cn(variant === "variant3" && "flex-1")}
              >
                {content}
              </Link>
            ) : (
              <div
                key={tabKey}
                className={cn(variant === "variant3" && "flex-1")}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 기존 상태 기반 탭 동작
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <TabsList className="bg-transparent border-lg flex w-full overflow-x-auto scrollbar-hide whitespace-nowrap pb-2 min-w-max justify-start">
        {tabs.map((tab, index) => {
          const isActive = value === tab.value;
          // tab.value가 유효하지 않은 경우 index를 fallback으로 사용
          const tabKey =
            tab.value && typeof tab.value === "string"
              ? tab.value
              : `tab-${index}`;

          return (
            <TabsTrigger
              key={tabKey}
              value={tab.value}
              className={cn(
                "bg-transparent rounded-none flex flex-col items-center justify-end p-3 pb-[10px] whitespace-nowrap",
                v.size,
                isActive ? v.active : v.base,
                variant === "variant3" && "flex-1"
              )}
            >
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
