"use client";

import React from "react";
import { Bell } from "@phosphor-icons/react";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useRouter } from "next/navigation";

interface NotificationBadgeProps {
  className?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export function NotificationBadge({
  className = "",
  showCount = true,
  size = "md",
}: NotificationBadgeProps) {
  const { unreadCount, isConnected } = useNotificationSocket();
  const router = useRouter();

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  const badgeSizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-5 h-5 text-sm",
    lg: "w-6 h-6 text-base",
  };

  const handleClick = () => {
    router.push("/notifications");
  };

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {/* 벨 아이콘 */}
      <Bell
        className={`${sizeClasses[size]} text-gray-600 hover:text-gray-800 transition-colors`}
        weight="regular"
      />

      {/* 연결 상태 표시 (개발 모드에서만) */}
      {process.env.NODE_ENV === "development" && (
        <div
          className={`absolute -top-1 -left-1 w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
          title={isConnected ? "소켓 연결됨" : "소켓 연결 끊김"}
        />
      )}

      {/* 읽지 않은 알림 개수 배지 */}
      {showCount && unreadCount > 0 && (
        <div
          className={`absolute -top-2 -right-2 ${badgeSizeClasses[size]} bg-red-500 text-white rounded-full flex items-center justify-center font-bold min-w-max px-1`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </div>
  );
}
