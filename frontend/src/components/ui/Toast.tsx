import * as React from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ToastProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function Toast({
  className,
  children,
  onClick,
  disabled = false,
}: ToastProps) {
  const baseClasses =
    "bg-white text-brand body rounded-lg w-full flex items-top gap-2 p-3 max-w-[300px] mx-auto border border-brand-light opacity-100";

  return (
    <div
      className={cn(baseClasses, className)}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : "status"}
      aria-live={onClick ? undefined : "polite"}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={
        onClick && !disabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <CheckCircle size={25} />
      {children}
    </div>
  );
}
