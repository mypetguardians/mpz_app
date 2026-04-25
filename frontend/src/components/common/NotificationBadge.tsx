"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  const { unreadCount: socketUnreadCount } = useNotificationSocket();
  const router = useRouter();
  const [fcmBump, setFcmBump] = useState(0);

  // FCM 포그라운드 메시지 수신 시 카운트 증가
  const handleFcmNotification = useCallback(() => {
    setFcmBump((prev) => prev + 1);
  }, []);

  useEffect(() => {
    window.addEventListener("fcm-notification-received", handleFcmNotification);
    return () => window.removeEventListener("fcm-notification-received", handleFcmNotification);
  }, [handleFcmNotification]);

  // WebSocket 카운트 + FCM 수신 카운트
  const unreadCount = socketUnreadCount + fcmBump;

  const iconSize = { sm: 20, md: 24, lg: 28 }[size];

  const handleClick = () => {
    setFcmBump(0); // 알림함 진입 시 FCM 카운트 리셋
    router.push("/notifications");
  };

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <Bell size={iconSize} className="text-dg" weight="regular" />

      {showCount && unreadCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red rounded-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-wh leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}
