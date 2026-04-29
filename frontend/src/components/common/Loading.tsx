"use client";

import React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

let animationData: object | null = null;
let animationPromise: Promise<object> | null = null;

function loadAnimation() {
  if (animationData) return Promise.resolve(animationData);
  if (!animationPromise) {
    animationPromise = fetch("/lottie/loading.json")
      .then((res) => res.json())
      .then((data) => {
        animationData = data;
        return data;
      });
  }
  return animationPromise;
}

export function Loading({
  className,
  size = "md",
  message,
  fullScreen = false,
}: LoadingProps) {
  const [data, setData] = React.useState<object | null>(animationData);

  React.useEffect(() => {
    if (!data) {
      loadAnimation().then(setData);
    }
  }, [data]);

  const content = (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {data ? (
        <Lottie animationData={data} loop className={sizeMap[size]} />
      ) : (
        <div className={cn(sizeMap[size], "animate-pulse rounded-full bg-gray-200")} />
      )}
      {message && <p className="mt-2 text-sm text-gr">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {content}
      </div>
    );
  }

  return content;
}
