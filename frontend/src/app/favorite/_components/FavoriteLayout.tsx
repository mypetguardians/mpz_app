"use client";

import { usePathname } from "next/navigation";
import { Bell } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo } from "react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { NavBar } from "@/components/common/NavBar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useGetAnimalFavorites, useGetCenterFavorites } from "@/hooks/query/useGetFavorites";
import { numberWithComma } from "@/lib/format-utils";

interface FavoriteLayoutProps {
  children: React.ReactNode;
}

export function FavoriteLayout({ children }: FavoriteLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { unreadCount: socketUnreadCount, isConnected } =
    useNotificationSocket();
  const { data: notificationsData } = useGetNotifications({
    enabled: !authLoading && isAuthenticated,
  });
  const hasUnreadNotifications = useMemo(() => {
    if (!isAuthenticated) return false;
    if (isConnected && socketUnreadCount > 0) return true;
    const list = notificationsData?.data ?? [];
    return list.some((n) => n.is_read === false);
  }, [isAuthenticated, isConnected, socketUnreadCount, notificationsData]);

  const { data: animalData } = useGetAnimalFavorites();
  const { data: centerData } = useGetCenterFavorites();

  const animalCount = animalData?.total ?? 0;
  const centerCount = centerData?.total ?? 0;

  const activeTab = pathname.includes("/center") ? "center" : "animal";

  const tabs = [
    {
      label: `동물 ${animalCount > 0 ? numberWithComma(animalCount) : ""}`,
      value: "animal",
      href: "/favorite/animal",
    },
    {
      label: `보호센터 ${centerCount > 0 ? numberWithComma(centerCount) : ""}`,
      value: "center",
      href: "/favorite/center",
    },
  ];

  return (
    <Container>
      <TopBar
        variant="variant4"
        left={<h2>찜</h2>}
        right={
          authLoading ? (
            <div className="w-10 h-10" />
          ) : isAuthenticated ? (
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

      {/* 탭 버튼 */}
      <div className="sticky top-[54px] z-20 bg-white w-full px-3.5">
        <TabButton
          value={activeTab}
          tabs={tabs}
          variant="variant3"
          useLinks={true}
        />
        <div className="border-b-2 border-lg -mt-0.5" />
      </div>

      {/* 메인 콘텐츠 */}
      {children}

      <NavBar />
    </Container>
  );
}
