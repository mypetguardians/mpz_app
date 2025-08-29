import React from "react";

interface CommunityDetailSkeletonProps {
  className?: string;
}

export function CommunityDetailSkeleton({ className = "" }: CommunityDetailSkeletonProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* 사용자 정보 스켈레톤 */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 스켈레톤 */}
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          {/* 사용자 이름 스켈레톤 */}
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* 신고/작업 버튼 스켈레톤 */}
        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 이미지 갤러리 스켈레톤 */}
      <div className="mb-3 px-4">
        {/* 단일 이미지 스켈레톤 */}
        <div className="w-full h-80 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* 제목 스켈레톤 */}
      <div className="px-4 mb-2">
        <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 내용 스켈레톤 */}
      <div className="px-4 mb-2">
        <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 날짜 스켈레톤 */}
      <div className="px-4 mb-3">
        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 해시태그 스켈레톤 */}
      <div className="flex gap-2 mt-3 px-4">
        <div className="w-16 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-14 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
