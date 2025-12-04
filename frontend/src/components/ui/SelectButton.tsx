import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectButtonProps {
  variant?: "1" | "2" | "3" | "4" | "5" | "6";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function SelectButton({
  variant = "1",
  selected = false,
  onClick,
  className,
  icon,
  children,
  disabled = false,
}: SelectButtonProps) {
  const isLarge = variant === "3" || variant === "4";
  const isSelected =
    selected || variant === "2" || variant === "4" || variant === "6";

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "relative bg-transparent rounded-xl transition-all px-4 py-3",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
        isSelected && "border border-brand bg-brand/10 hover:bg-brand/10",
        !isSelected && "border border-lg",
        className
      )}
      onClick={handleClick}
    >
      {/* **mr-2 삭제 */}
      {isLarge ? (
        <div className="flex flex-col items-center text-center">
          <div className="flex justify-center">{icon}</div>
          <div className="space-y-2">{children}</div>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex-1">{children}</div>
        </div>
      )}
    </div>
  );
}
