import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const BigButtonVariants = cva(
  "inline-flex items-center justify-center gap-1 shadow-none whitespace-nowrap rounded-full transition-all cursor-pointer disabled:pointer-events-none disabled:bg-bg disabled:text-gr py-3 h-[44px]",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white border-0 hover:bg-brand/90",
        variant3: "bg-white text-gray-400 border-0",
        variant4: "relative bg-brand text-white border-0 hover:bg-brand/90",
        variant5: "bg-transparent text-bk border border-gray-300",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export interface BigBtnProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof BigButtonVariants> {
  asChild?: boolean;
  left?: React.ReactNode; // 왼쪽(아이콘/뱃지)
  children: React.ReactNode; // 메인 텍스트
  right?: React.ReactNode; // 오른쪽(아이콘/뱃지)
}

const BigButton = React.forwardRef<HTMLButtonElement, BigBtnProps>(
  (
    { className, variant, asChild = false, left, children, right, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(BigButtonVariants({ variant }), className, "px-4")}
        ref={ref}
        {...props}
      >
        {left && <span className="mr-1 flex items-center">{left}</span>}
        <h3>{children}</h3>
        {right && <span className="ml-1 flex items-center">{right}</span>}
      </Comp>
    );
  }
);
BigButton.displayName = "BigBtn";

export { BigButton, BigButtonVariants };
