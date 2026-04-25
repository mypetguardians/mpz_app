"use client";

import React, { useEffect } from "react";
import { Bell } from "@phosphor-icons/react";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

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
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // API에서도 읽지 않은 개수 가져오기 (탭 복귀 시 갱신)
  const { data: notificationsData } = useGetNotifications({
    page: 1,
    page_size: 1,
    enabled: isAuthenticated,
  });

  // FCM 포그라운드 메시지 수신 시 쿼리 갱신
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    window.addEventListener("fcm-notification-received", handler);
    return () => window.removeEventListener("fcm-notification-received", handler);
  }, [queryClient]);

  // API 응답에서 읽지 않은 개수 계산
  const apiUnreadCount = notificationsData?.data?.filter((n) => !n.is_read).length ?? 0;

  // WebSocket 카운트가 있으면 우선, 없으면 API 카운트 사용
  const unreadCount = socketUnreadCount > 0 ? socketUnreadCount : apiUnreadCount;

  const iconSize = { sm: 20, md: 24, lg: 28 }[size];

  const handleClick = () => {
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
