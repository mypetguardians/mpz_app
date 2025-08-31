import React from "react";

interface CommunityCardSkeletonProps {
  className?: string;
}

export function CommunityCardSkeleton({
  className = "",
}: CommunityCardSkeletonProps) {
  return (
    <div className={`w-full bg-white rounded-lg ${className}`}>
      {/* 사용자 정보 스켈레톤 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 스켈레톤 */}
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          {/* 사용자 이름 스켈레톤 */}
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* 신고 버튼 스켈레톤 */}
        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 이미지 스켈레톤 */}
      <div className="mb-3">
        <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* 제목 스켈레톤 */}
      <div className="mb-2">
        <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 내용 스켈레톤 */}
      <div className="mb-2">
        <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 상호작용 버튼 스켈레톤 */}
      <div className="flex items-center gap-3mb-3">
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-100" />
    </div>
  );
}
