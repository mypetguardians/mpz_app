"use client";

import React, { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { AnimalSearchSection } from "./AnimalSearchSection";
import { CenterSearchSection } from "./CenterSearchSection";

import { FilterState, getFilterCounts } from "@/lib/filter-utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

interface ListLayoutProps {
  children: React.ReactNode;
}

export function ListLayout({ children }: ListLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // 검색 상태 관리
  const [isSearching, setIsSearching] = useState(false);

  // 현재 경로에서 활성 탭 결정
  const activeTab = pathname.includes("/center") ? "center" : "animal";

  const tabs = [
    { label: "동물 찾기", value: "animal", href: "/list/animal" },
    { label: "보호센터 찾기", value: "center", href: "/list/center" },
  ];

  // URL 파라미터에서 필터 상태 읽기 (동물 탭에서만 사용)
  const getFiltersFromURL = (): FilterState => {
    return {
      breed: searchParams.get("breed") || "",
      weights: searchParams.get("weights")?.split(",").filter(Boolean) || [],
      regions: searchParams.get("regions")?.split(",").filter(Boolean) || [],
      ages: searchParams.get("ages")?.split(",").filter(Boolean) || [],
      genders: searchParams.get("genders")?.split(",").filter(Boolean) || [],
      protectionStatus:
        searchParams.get("protectionStatus")?.split(",").filter(Boolean) || [],
      expertOpinion:
        searchParams.get("expertOpinion")?.split(",").filter(Boolean) || [],
    };
  };

  const filters = getFiltersFromURL();
  const filterCounts = getFilterCounts(filters);

  const handleFilterClick = (path: string) => {
    router.push(path);
  };

  // 검색 상태 변경 핸들러
  const handleSearchStateChange = (searching: boolean) => {
    setIsSearching(searching);
  };

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left={<h4>입양</h4>}
        right={
          isAuthenticated ? (
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
              <IconButton
                icon={({ size }) => <Bell size={size} weight="bold" />}
                size="iconM"
              />
            </Link>
          )
        }
      />

      {/* 탭 버튼 */}
      <div>
        <TabButton
          value={activeTab}
          tabs={tabs}
          variant="variant3"
          useLinks={true}
        />
      </div>

      {/* 검색 섹션 - 탭에 따라 다른 컴포넌트 렌더링 */}
      {activeTab === "animal" ? (
        <AnimalSearchSection
          filters={filters}
          filterCounts={filterCounts}
          onFilterClick={handleFilterClick}
          onSearchStateChange={handleSearchStateChange}
        />
      ) : (
        <CenterSearchSection onSearchStateChange={handleSearchStateChange} />
      )}

      {/* 검색 중이 아닐 때만 기존 리스트 표시 */}
      {!isSearching && children}
      <NavBar />
    </Container>
  );
}
