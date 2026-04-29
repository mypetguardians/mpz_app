"use client";

import Lottie from "lottie-react";
import { cn } from "@/lib/utils";
import animationData from "@/assets/loading-animation.json";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
};

export function Loading({
  className,
  size = "md",
  message,
  fullScreen = false,
}: LoadingProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Lottie animationData={animationData} loop className={sizeMap[size]} />
      {message && <p className="mt-2 text-sm text-gr">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
