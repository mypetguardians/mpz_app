"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const topbarVariants = cva(
  "fixed left-1/2 -translate-x-1/2 top-0 z-50 w-full max-w-[420px] h-[54px] px-4",
  {
    variants: {
      variant: {
        primary: "bg-white/95 backdrop-blur-sm border-b border-gray-200",
        customer: "bg-white/95 backdrop-blur-sm border-b border-gray-200",
        variant4: "bg-white/95 backdrop-blur-sm border-b border-gray-200",
        variant5: "bg-white/95 backdrop-blur-sm border-b border-gray-200",
        variant6: "bg-transparent border-none",
        variant8: "bg-white/95 backdrop-blur-sm border-b border-gray-200",
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
  const outerClassName = React.useMemo(() => {
    return cn(topbarVariants({ variant, className }));
  }, [variant, className]);

  const innerClassName = React.useMemo(() => {
    return cn(
      "relative flex items-center w-full h-[54px] max-w-[420px] mx-auto",
      variant === "variant6" ? "bg-transparent" : "bg-white/95 backdrop-blur-sm"
    );
  }, [variant]);

  // center와 title 중 하나만 표시
  const centerContent = center || title;

  return (
    <>
      {/* TopBar 자체 */}
      <Comp className={outerClassName} {...props}>
        <nav className={innerClassName}>
          {/* 전체 레이아웃: justify-between으로 좌우 분배 */}
          <div className="flex items-center justify-between w-full h-full">
            {/* Left 영역 - 왼쪽 끝에 고정 */}
            <div className="flex items-center shrink-0">{left}</div>

            {/* Center 영역 - 중앙 정렬 */}
            <div className="flex-1 flex justify-center items-center min-w-0">
              <div className="text-center truncate px-2">{centerContent}</div>
            </div>

            {/* Right 영역 - 오른쪽 끝에 고정 */}
            <div className="flex items-center shrink-0">{right}</div>
          </div>
        </nav>
      </Comp>

      {/* 페이지 콘텐츠가 TopBar 아래로 시작하도록 패딩 추가 */}
      <div className={`pt-[54px]`}>
        {/* 이 div는 부모 컴포넌트에서 TopBar 아래 콘텐츠를 감싸는 용도로 사용 */}
        {props.children}
      </div>
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
