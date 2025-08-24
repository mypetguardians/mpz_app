import React from "react";
import { cn } from "@/lib/utils";

interface DotProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  variant?: "variant1" | "variant2" | "variant3" | "variant4" | "variant5";
  className?: string;
  size?: "sm" | "md" | "lg";
  labels?: string[];
}

const variantStyles = {
  variant1: {
    completed: "bg-brand border-brand",
    active: "bg-brand border-brand",
    inactive: "bg-lg",
    line: "border-bg",
    completedLine: "border-brand",
    text: "text-gr",
    activeText: "text-gr font-bold",
    completedText: "text",
  },
  variant2: {
    completed: "bg-brand/80 border-brand/80",
    active: "bg-brand/80 border-brand/80",
    inactive: "bg-lg",
    line: "border-bg",
    completedLine: "border-brand/80",
    text: "text-gr",
    activeText: "text-gr font-bold",
    completedText: "text",
  },
  variant3: {
    completed: "bg-brand/60 border-brand/60",
    active: "bg-brand/60 border-brand/60",
    inactive: "bg-lg",
    line: "border-bg",
    completedLine: "border-brand/60",
    text: "text-gr",
    activeText: "text-gr font-bold",
    completedText: "text",
  },
  variant4: {
    completed: "bg-brand/40 border-brand/40",
    active: "bg-brand/40 border-brand/40",
    inactive: "bg-lg",
    line: "border-bg",
    completedLine: "border-brand/40",
    text: "text-gr",
    activeText: "text-gr font-bold",
    completedText: "text",
  },
  variant5: {
    completed: "bg-brand/20 border-brand/20",
    active: "bg-brand/20 border-brand/20",
    inactive: "bg-lg",
    line: "border-bg",
    completedLine: "border-brand/20",
    text: "text-gr",
    activeText: "text-gr font-bold",
    completedText: "text",
  },
};

const sizeStyles = {
  sm: {
    counter: "w-3 h-3",
    line: "top-1.5",
    gap: "gap-2",
    text: "text-xs",
  },
  md: {
    counter: "w-3 h-3",
    line: "top-1.5",
    gap: "gap-4",
    text: "text-xs",
  },
  lg: {
    counter: "w-3 h-3",
    line: "top-1.5",
    gap: "gap-6",
    text: "text-xs",
  },
};

const defaultLabels = [
  "입양신청",
  "미팅",
  "계약서 작성",
  "입양 완료",
  "모니터링",
];

export function DotProgressBar({
  currentStep,
  totalSteps = 5,
  variant = "variant1",
  className,
  size = "md",
  labels = defaultLabels,
}: DotProgressBarProps) {
  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <div className={cn("flex justify-between mb-5", className)}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const label = labels[index] || defaultLabels[index];

        let stepClass = "";
        let counterClass = "";
        let textClass = "";

        if (isCompleted) {
          stepClass = "completed";
          counterClass = styles.completed;
          textClass = styles.completedText;
        } else if (isActive) {
          stepClass = "active";
          counterClass = styles.active;
          textClass = styles.activeText;
        } else {
          counterClass = styles.inactive;
          textClass = styles.text;
        }

        return (
          <div
            key={index}
            className={cn(
              "relative flex flex-col items-center flex-1",
              stepClass
            )}
          >
            {/* Before line */}
            {index > 0 && (
              <div
                className={cn(
                  "absolute content-[''] border-b-2 w-full",
                  sizeStyle.line,
                  index < currentStep ? styles.completedLine : styles.line,
                  "z-[2]"
                )}
                style={{
                  top: sizeStyle.line,
                  left: "-50%",
                }}
              />
            )}

            {/* After line */}
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  "absolute content-[''] border-b-2 w-full",
                  sizeStyle.line,
                  index < currentStep ? styles.completedLine : styles.line,
                  "z-[2]"
                )}
                style={{
                  top: sizeStyle.line,
                  left: "50%",
                }}
              />
            )}

            {/* Step counter */}
            <div
              className={cn(
                "relative z-[5] flex justify-center items-center rounded-full mb-1.5",
                sizeStyle.counter,
                counterClass
              )}
            />

            {/* Step name */}
            <div className={cn("text-center text-xs text-gray-600", textClass)}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
