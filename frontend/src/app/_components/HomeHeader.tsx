"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

import { Bell } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

interface HomeHeaderProps {
  isLoggedIn: boolean;
}

export function HomeHeader({ isLoggedIn }: HomeHeaderProps) {
  const { data: notificationsData, refetch } = useGetNotifications();
  const { unreadCount: socketUnreadCount, isConnected } =
    useNotificationSocket();
  const [fcmBump, setFcmBump] = useState(0);

  // FCM 포그라운드 메시지 수신 시 뱃지 업데이트
  const handleFcmNotification = useCallback(() => {
    setFcmBump((prev) => prev + 1);
    refetch();
  }, [refetch]);

  useEffect(() => {
    window.addEventListener("fcm-notification-received", handleFcmNotification);
    return () => window.removeEventListener("fcm-notification-received", handleFcmNotification);
  }, [handleFcmNotification]);

  // 읽지 않은 알림이 있는지 확인
  const hasUnreadNotifications =
    fcmBump > 0 ||
    (isConnected && socketUnreadCount > 0) ||
    notificationsData?.data?.some((notification) => notification.is_read === false);

  return (
    <TopBar
      variant="primary"
      className="px-0"
      left={
        <Link href="/">
          <img src="/illust/logo.svg" alt="logo" width={71} height={38} />
        </Link>
      }
      right={
        isLoggedIn ? (
          <Link href="/notifications">
            <div className="relative">
              <IconButton
                icon={({ size }) => <Bell size={size} weight="bold" />}
                size="iconM"
              />
              {hasUnreadNotifications && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full"></div>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/login">
            <div className="flex items-center cursor-pointer">
              <button>로그인</button>
            </div>
          </Link>
        )
      }
    />
  );
}
