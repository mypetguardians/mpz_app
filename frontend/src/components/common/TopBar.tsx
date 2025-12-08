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

    const isAndroid = Capacitor.getPlatform() === "android";
    const isIOS = Capacitor.getPlatform() === "ios";

    // Safe area 값을 가져오는 함수
    const checkSafeAreaValue = () => {
      if (isAndroid) {
        // Android: CSS 변수에서 값 가져오기
        const top = getComputedStyle(document.documentElement)
          .getPropertyValue("--safe-area-top")
          ?.trim();
        if (top && top !== "0px" && top !== "") {
          const topValue = parseInt(top.replace("px", "")) || 0;
          if (topValue > 0 && topValue <= 100) {
            setSafeAreaTop((prev) => {
              if (Math.abs(prev - topValue) > 1) {
                return topValue;
              }
              return prev;
            });
          }
        }
      } else if (isIOS) {
        // iOS: env() 값 사용
        const top = getComputedStyle(document.documentElement)
          .getPropertyValue("env(safe-area-inset-top)")
          ?.trim();
        if (top && top !== "0px" && top !== "") {
          const topValue = parseInt(top.replace("px", "")) || 0;
          if (topValue > 0 && topValue <= 100) {
            setSafeAreaTop((prev) => {
              if (Math.abs(prev - topValue) > 1) {
                return topValue;
              }
              return prev;
            });
          }
        }
      }
    };

    // 즉시 확인
    checkSafeAreaValue();

    // safeAreaInsetsChanged 이벤트 리스너 (Android에서 값이 전달될 때만 업데이트)
    const handleSafeAreaChange = (event: CustomEvent) => {
      const { top } = event.detail;
      if (top !== undefined && top >= 0 && top <= 100) {
        setSafeAreaTop((prev) => {
          if (Math.abs(prev - top) > 1) {
            return top;
          }
          return prev;
        });
      }
    };

    // 앱이 포그라운드로 돌아올 때 safe area 재계산
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          checkSafeAreaValue();
        }, 100);
      }
    };

    window.addEventListener(
      "safeAreaInsetsChanged",
      handleSafeAreaChange as EventListener
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 최소한의 지연 확인 (한 번만, 500ms 후)
    const timeoutId = setTimeout(() => {
      checkSafeAreaValue();
    }, 500);

    return () => {
      window.removeEventListener(
        "safeAreaInsetsChanged",
        handleSafeAreaChange as EventListener
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(timeoutId);
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
  // backgroundColor는 className에서 이미 처리되므로 제거
  const topBarStyle = React.useMemo(() => {
    if (safeAreaTop > 0) {
      return {
        top: `${safeAreaTop}px`,
      };
    }
    return {};
  }, [safeAreaTop]);

  // Spacer 높이: TopBar 높이만 (safe area top은 위치에만 반영)
  const spacerHeight = "54px";

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
