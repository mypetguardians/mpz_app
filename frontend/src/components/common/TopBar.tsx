"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
// import { Capacitor } from "@capacitor/core";

const topbarVariants = cva(
  "fixed left-1/2 -translate-x-1/2 top-0 z-50 w-full max-w-[420px] min-h-[54px] bg-wh",
  {
    variants: {
      variant: {
        primary: "bg-white/95 backdrop-blur-sm",
        customer: "bg-white/95 backdrop-blur-sm",
        variant4: "bg-white/95 backdrop-blur-sm",
        variant5: "bg-white/95 backdrop-blur-sm",
        variant6: "bg-transparent border-none",
        variant8: "bg-white/95 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

type TopBarProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof topbarVariants> & {
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    asChild?: boolean;
    title?: string | React.ReactNode;
  };

export function TopBar({
  className,
  variant,
  left,
  center,
  right,
  title,
  asChild = false,
  ...props
}: TopBarProps) {
  const Comp = asChild ? Slot : "nav";

  // 안정적인 className 생성을 위해 메모이제이션
  // Safe Area padding은 최상위 Layout에서만 처리하므로 TopBar에서는 제거
  const outerClassName = React.useMemo(() => {
    return cn(topbarVariants({ variant, className }));
  }, [variant, className]);

  const innerClassName = React.useMemo(() => {
    return cn(
      "relative flex items-center w-full h-[54px] px-4 max-w-[420px] mx-auto",
      variant === "variant6" ? "bg-transparent" : "bg-white/95 backdrop-blur-sm"
    );
  }, [variant]);

  // center와 title 중 하나만 표시
  const centerContent = center || title;

  // Safe Area padding은 SafeAreaLayout에서 처리하므로, TopBar는 높이(54px)만 spacer로 필요
  // 모든 플랫폼에서 동일하게 TopBar 높이만 적용
  const spacerHeight = "54px";

  return (
    <>
      <Comp className={outerClassName} {...props}>
        <nav className={innerClassName}>
          {/* 전체 레이아웃: justify-between으로 좌우 분배 */}
          <div className="flex items-center justify-between w-full h-full">
            {/* Left 영역 - 왼쪽 끝에 고정 */}
            <div className="flex items-center shrink-0 text-heading2">
              {left}
            </div>

            {/* Center 영역 - 중앙 정렬 */}
            <div className="flex items-center justify-center flex-1 min-w-0">
              <div className="px-2 text-center truncate">{centerContent}</div>
            </div>

            {/* Right 영역 - 오른쪽 끝에 고정 */}
            <div className="flex items-center shrink-0">{right}</div>
          </div>
        </nav>
      </Comp>

      {/* TopBar가 fixed이므로, 콘텐츠가 TopBar 아래에 가려지지 않도록 spacer 추가 */}
      {/* Safe Area는 SafeAreaLayout에서 이미 처리됨 */}
      <div aria-hidden className="w-full" style={{ height: spacerHeight }} />
      {props.children}
    </>
  );
}

export function TopBarContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-h-screen", className)} {...props}>
      {children}
    </div>
  );
}

// 기본 TopBar 사용 예시를 위한 확장 컴포넌트 (개선됨)
export function CenteredTopBar({
  title,
  left,
  right,
  variant = "primary",
  className,
  ...props
}: {
  title?: string | React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  variant?: "primary" | "variant6";
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <TopBar
      variant={variant}
      title={title}
      left={left}
      right={right}
      className={cn("text-gray-800", className)}
      {...props}
    />
  );
}

// 간단한 타이틀 + 아이콘 조합을 위한 헬퍼
export function SimpleTopBar({
  title,
  leftIcon,
  rightIcon,
  onLeftClick,
  onRightClick,
  variant = "primary",
}: {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  variant?: "primary" | "variant6";
}) {
  return (
    <TopBar variant={variant}>
      {leftIcon && (
        <button onClick={onLeftClick} className="p-2">
          {leftIcon}
        </button>
      )}
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      {rightIcon && (
        <button onClick={onRightClick} className="p-2">
          {rightIcon}
        </button>
      )}
    </TopBar>
  );
}
