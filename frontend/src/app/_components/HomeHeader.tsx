"use client";

import Link from "next/link";
import Image from "next/image";

import { Bell } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

interface HomeHeaderProps {
  isLoggedIn: boolean;
}

export function HomeHeader({ isLoggedIn }: HomeHeaderProps) {
  const { data: notificationsData } = useGetNotifications();
  const { unreadCount: socketUnreadCount, isConnected } =
    useNotificationSocket();

  // 읽지 않은 알림이 있는지 확인 (소켓 연결 시 소켓 데이터 우선, 아니면 API 데이터)
  const hasUnreadNotifications =
    isConnected && socketUnreadCount > 0
      ? true
      : notificationsData?.data?.some(
          (notification) => notification.is_read === false
        );

  return (
    <TopBar
      variant="primary"
      className="px-0"
      left={
        <Link href="/">
          <Image src="/illust/logo.svg" alt="logo" width={71} height={38} />
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
            <div className="flex items-center gap-2 cursor-pointer">
              <button>로그인</button>
            </div>
          </Link>
        )
      }
    />
  );
}
