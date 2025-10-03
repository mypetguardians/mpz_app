"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const topbarVariants = cva(
  "flex items-center w-full px-4 h-[54px] justify-between mx-auto",
  {
    variants: {
      variant: {
        primary: "bg-wh",
        customer: "bg-wh",
        variant4: "bg-wh",
        variant5: "bg-wh",
        variant6: "bg-transparent border-none",
        variant8: "bg-wh",
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
  };

export function TopBar({
  className,
  variant,
  left,
  center,
  right,
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
      "relative flex items-center w-full max-w-[420px] mx-auto h-[54px]",
      variant === "variant6" ? "bg-transparent" : "bg-wh"
    );
  }, [variant]);
  
  return (
    <Comp className={outerClassName} {...props}>
      <nav className={innerClassName}>
        <div className="flex items-center shrink-0" style={{ minWidth: 40 }}>
          {left}
        </div>
        <div className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
          {center}
        </div>
        <div className="flex items-center ml-auto shrink-0">{right}</div>
      </nav>
    </Comp>
  );
}
