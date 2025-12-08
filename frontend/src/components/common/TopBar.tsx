"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

const topbarVariants = cva(
  "fixed left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] min-h-[54px] bg-wh",
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
  const [safeAreaTop, setSafeAreaTop] = React.useState(0);

  // Safe area top 값 가져오기
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSafeAreaTop = () => {
      const isAndroid = Capacitor.getPlatform() === "android";
      const isIOS = Capacitor.getPlatform() === "ios";

      if (isAndroid) {
        // Android: CSS 변수에서 값 가져오기
        const top = getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-top")
          ?.trim();
        if (top && top !== "0px") {
          const topValue = parseInt(top.replace("px", "")) || 0;
          setSafeAreaTop(topValue);
        }
      } else if (isIOS) {
        // iOS: env() 값 사용
        const top = getComputedStyle(document.documentElement)
          .getPropertyValue("env(safe-area-inset-top)")
          ?.trim();
        if (top && top !== "0px") {
          const topValue = parseInt(top.replace("px", "")) || 0;
          setSafeAreaTop(topValue);
        }
      }
    };

    updateSafeAreaTop();

    // safeAreaInsetsChanged 이벤트 리스너 (Android)
    const handleSafeAreaChange = (event: CustomEvent) => {
      const { top } = event.detail;
      if (top && top > 0) {
        setSafeAreaTop(top);
      }
    };

    window.addEventListener(
      "safeAreaInsetsChanged",
      handleSafeAreaChange as EventListener
    );

    // 주기적으로 확인 (Android에서 값이 늦게 올 수 있음)
    const intervals: NodeJS.Timeout[] = [];
    [100, 300, 500, 1000, 2000].forEach((delay) => {
      const timeoutId = setTimeout(updateSafeAreaTop, delay);
      intervals.push(timeoutId);
    });

    // 추가로 100ms마다 확인 (최대 5초)
    let checkCount = 0;
    const maxChecks = 50; // 5초
    const intervalId = setInterval(() => {
      updateSafeAreaTop();
      checkCount++;
      if (checkCount >= maxChecks) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      window.removeEventListener(
        "safeAreaInsetsChanged",
        handleSafeAreaChange as EventListener
      );
      intervals.forEach((id) => clearTimeout(id));
      clearInterval(intervalId);
    };
  }, []);

  // 안정적인 className 생성을 위해 메모이제이션
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

  // TopBar 위치: safe area top 아래에 배치
  const topBarStyle = React.useMemo(() => {
    return safeAreaTop > 0 ? { top: `${safeAreaTop}px` } : { top: "0px" };
  }, [safeAreaTop]);

  // Spacer 높이: safe area top + TopBar 높이
  const spacerHeight = React.useMemo(() => {
    return `${safeAreaTop + 54}px`;
  }, [safeAreaTop]);

  return (
    <>
      <Comp className={outerClassName} style={topBarStyle} {...props}>
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
