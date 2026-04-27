import React from "react";
import { cn } from "@/lib/utils";
// 새로운 PetCard 타입 사용
import {
  PetCardVariant,
  PetCardSkeletonProps as PetCardSkeletonPropsNew,
} from "@/types/petcard";

// 기존 호환성을 위한 타입 (deprecated)
type PetCardSkeletonVariant = PetCardVariant;

interface PetCardSkeletonPropsLegacy {
  variant?: PetCardSkeletonVariant;
  className?: string;
  imageSize?: "sm" | "md" | "lg" | "full";
}

// 새로운 타입과 기존 타입을 모두 지원
type PetCardSkeletonProps =
  | PetCardSkeletonPropsNew
  | PetCardSkeletonPropsLegacy;

export function PetCardSkeleton({
  variant = "primary",
  className,
  imageSize = "md",
}: PetCardSkeletonProps) {
  const getImageSize = () => {
    switch (imageSize) {
      case "sm":
        return "h-[100px] w-[100px]";
      case "md":
        return "h-[146px] w-[146px]";
      case "lg":
        return "h-[200px] w-[200px]";
      case "full":
        return "h-auto w-full aspect-square";
      default:
        return "h-[146px] w-[146px]";
    }
  };

  if (variant === "variant2") {
    return (
      <div className={cn("flex gap-4 items-center h-[154px]", className)}>
        <div className="flex-shrink-0">
          <div className="relative w-[120px] h-[154px] overflow-hidden">
            <div className="w-full h-full bg-gray-200 animate-pulse rounded-[10px]" />
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center mb-[6px] gap-1">
            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
            <div className="w-3 h-3 bg-gray-200 animate-pulse rounded-full" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-3 bg-gray-200 animate-pulse rounded w-full" />
            <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-12 h-3 bg-gray-200 animate-pulse rounded mr-2" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-200 animate-pulse rounded-full"
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-3 bg-gray-200 animate-pulse rounded mr-2" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-200 animate-pulse rounded-full"
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-3 bg-gray-200 animate-pulse rounded mr-2" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-200 animate-pulse rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "variant3") {
    return (
      <div className={cn("flex flex-col items-start w-full", className)}>
        <div className={cn("mb-2", getImageSize())}>
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-[10px]" />
        </div>
        <div className="flex items-center mb-[6px] gap-1">
          <div className="h-5 w-12 bg-gray-200 animate-pulse rounded-full" />
          <div className="h-4 w-8 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (variant === "variant4") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 border border-bg rounded-lg",
          className
        )}
      >
        <div className="w-13 h-13 bg-gray-200 animate-pulse rounded" />
        <div className="flex-1">
          <div className="flex items-center mb-[6px] gap-1">
            <div className="h-5 w-12 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
            <div className="w-3 h-3 bg-gray-200 animate-pulse rounded-full" />
          </div>
          <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (variant === "edit") {
    return (
      <div
        className={cn(
          "flex flex-col items-start min-w-[146px] pb-3",
          className
        )}
      >
        <div className={cn("relative mb-2", getImageSize())}>
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-[10px]" />
          <div className="absolute bottom-0 left-0 w-full bg-gray-300 animate-pulse h-8 rounded-b-[10px]" />
        </div>
        <div className="flex items-center mb-[6px] gap-1">
          <div className="h-5 w-12 bg-gray-200 animate-pulse rounded-full" />
          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
          <div className="w-3 h-3 bg-gray-200 animate-pulse rounded-full" />
        </div>
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded mb-2" />
        <div className="w-full h-8 bg-gray-200 animate-pulse rounded mt-[10px]" />
      </div>
    );
  }

  // Variant 1 - Primary
  return (
    <div
      className={cn("flex flex-col items-start min-w-[146px] pb-3", className)}
    >
      <div className={cn("relative mb-2", getImageSize())}>
        <div className="w-full h-full bg-gray-200 animate-pulse rounded-[10px]" />
        <div className="absolute bottom-0 left-0 w-full bg-gray-300 animate-pulse h-8 rounded-b-[10px]" />
      </div>
      <div className="flex items-center mb-[6px] gap-1">
        <div className="h-5 w-12 bg-gray-200 animate-pulse rounded-full" />
        <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
        <div className="w-3 h-3 bg-gray-200 animate-pulse rounded-full" />
      </div>
      <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
    </div>
  );
}
