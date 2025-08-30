import { Bell } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface NotificationCardSkeletonProps {
  className?: string;
}

export function NotificationCardSkeleton({
  className = "",
}: NotificationCardSkeletonProps) {
  return (
    <div className={cn("flex gap-3 py-[10px] px-2 m-2 items-start", className)}>
      <div className="mt-1">
        <Bell className="text-gray-300" size={16} />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex flex-col gap-2">
          {/* 제목 스켈레톤 */}
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          {/* 내용 스켈레톤 */}
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
          {/* 날짜 스켈레톤 */}
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3 mt-1"></div>
        </div>
      </div>
    </div>
  );
}
