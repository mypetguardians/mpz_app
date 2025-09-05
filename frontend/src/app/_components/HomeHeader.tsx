"use client";

import Link from "next/link";
import Image from "next/image";

import { Bell } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";

interface HomeHeaderProps {
  isLoggedIn: boolean;
}

export function HomeHeader({ isLoggedIn }: HomeHeaderProps) {
  const { data: notificationsData } = useGetNotifications();

  // 읽지 않은 알림이 있는지 확인
  const hasUnreadNotifications = notificationsData?.data?.some(
    (notification) => notification.is_read === false
  );

  return (
    <TopBar
      variant="primary"
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
