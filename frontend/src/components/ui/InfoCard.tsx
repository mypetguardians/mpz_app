import * as React from "react";
import { Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export function InfoCard({
  className,
  children,
  onClick,
  disabled = false,
}: InfoCardProps) {
  const baseClasses =
    "bg-bg text-dg body rounded-lg flex items-top gap-2 p-3 w-full mx-auto";

  return (
    <div
      className={cn(baseClasses, className)}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
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
      <Info size={25} />
      {children}
    </div>
  );
}
