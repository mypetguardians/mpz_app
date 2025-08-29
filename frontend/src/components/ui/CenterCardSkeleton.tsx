import React from "react";

interface CenterCardSkeletonProps {
  className?: string;
}

export function CenterCardSkeleton({
  className = "",
}: CenterCardSkeletonProps) {
  return (
    <div className={`w-full bg-white${className}`}>
      <div className="flex items-center gap-4">
        {/* 이미지 스켈레톤 */}
        <div className="flex-shrink-0">
          <div className="w-[63px] h-[63px] bg-gray-200 rounded-lg animate-pulse" />
        </div>
        {/* 정보 스켈레톤 */}
        <div className="flex-1 min-w-0">
          {/* 센터 이름 스켈레톤 */}
          <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2" />

          {/* 위치 스켈레톤 */}
          <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse mb-3" />
        </div>
      </div>
    </div>
  );
}
