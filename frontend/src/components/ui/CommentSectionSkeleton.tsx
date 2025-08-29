import React from "react";

interface CommentSectionSkeletonProps {
  className?: string;
}

export function CommentSectionSkeleton({
  className = "",
}: CommentSectionSkeletonProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* 댓글 섹션 제목 스켈레톤 */}
      <div className="px-4 mb-4">
        <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 댓글 목록 스켈레톤 */}
      <div className="space-y-4 px-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="border-b border-gray-100 pb-4">
            {/* 댓글 작성자 정보 스켈레톤 */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-3 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>

            {/* 댓글 내용 스켈레톤 */}
            <div className="ml-11">
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* 댓글 입력창 스켈레톤 */}
      <div className="px-4 mt-6">
        <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
