import React from "react";
import { cn } from "@/lib/utils";

export interface LinearProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
  label?: React.ReactNode;
}

export function LinearProgressBar({
  value,
  max = 100,
  className,
  trackClassName,
  indicatorClassName,
  showLabel = false,
  label,
}: LinearProgressBarProps) {
  const clampedMax = Number.isFinite(max) && max > 0 ? max : 100;
  const clampedValue = Number.isFinite(value)
    ? Math.max(0, Math.min(value, clampedMax))
    : 0;
  const rawPercent = (clampedValue / clampedMax) * 100;
  const percent = Number.isFinite(rawPercent) ? rawPercent : 0;

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-lg h-2",
          trackClassName
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={clampedMax}
        aria-valuenow={clampedValue}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out",
            "bg-brand",
            indicatorClassName
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {showLabel && (
        <div className="mt-1 text-right text-xs text-dg">
          {label ?? `${Math.round(percent)}%`}
        </div>
      )}
    </div>
  );
}

export default LinearProgressBar;
