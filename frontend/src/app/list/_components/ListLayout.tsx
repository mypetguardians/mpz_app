"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bell, CaretDown } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { AnimalSearchSection } from "./AnimalSearchSection";
import { CenterSearchSection } from "./CenterSearchSection";

import { getFilterCounts } from "@/lib/filter-utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useAnimalFiltersStore } from "@/stores/animalFilters";
import { useAnimalFilterOverlayStore } from "@/stores/animalFilterOverlay";
import { AnimalFilterOverlay } from "@/app/list/animal/filter/AnimalFilterOverlay";

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

  const [isSearching, setIsSearching] = useState(false);
  const { filters, reset: resetAnimalFilters } = useAnimalFiltersStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // hide/show on scroll
  const [searchVisible, setSearchVisible] = useState(true);
  const lastScrollTop = useRef(0);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const currentScrollTop = el.scrollTop;
    if (currentScrollTop > 10) {
      setSearchVisible(currentScrollTop < lastScrollTop.current);
    } else {
      setSearchVisible(true);
    }
    lastScrollTop.current = currentScrollTop;
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const activeTab = pathname.includes("/center") ? "center" : "animal";

  const tabs = [
    { label: "동물 찾기", value: "animal", href: "/list/animal" },
    { label: "보호센터 찾기", value: "center", href: "/list/center" },
  ];

  const filterCounts = useMemo(() => getFilterCounts(filters), [filters]);
  const { open: openFilterOverlay } = useAnimalFilterOverlayStore();

  const filterOptions = [
    { label: "지역", count: filterCounts.regions, hasFilters: filterCounts.regions > 0 },
    { label: "품종", count: filterCounts.breed, hasFilters: filterCounts.breed > 0 },
    { label: "체중", count: filterCounts.weights, hasFilters: filterCounts.weights > 0 },
    { label: "성별", count: filterCounts.genders, hasFilters: filterCounts.genders > 0 },
    { label: "나이", count: filterCounts.ages, hasFilters: filterCounts.ages > 0 },
    { label: "보호상태", count: filterCounts.protectionStatus, hasFilters: filterCounts.protectionStatus > 0 },
  ];

  const searchFromUrl = searchParams.get("search") || "";

  const hasActiveFilters = useMemo(() => {
    const hasNonDefaultProtectionStatus =
      filters.protectionStatus.length > 0 &&
      !(filters.protectionStatus.length === 1 && filters.protectionStatus[0] === "입양가능");
    return !!(
      filters.breed ||
      filters.weights.length > 0 ||
      filters.regions.length > 0 ||
      filters.ages.length > 0 ||
      filters.genders.length > 0 ||
      hasNonDefaultProtectionStatus ||
      filters.expertOpinion.length > 0
    );
  }, [filters]);

  const handleClearAllFilters = useCallback(() => {
    resetAnimalFilters();
    if (searchFromUrl) {
      router.push(pathname);
    }
  }, [resetAnimalFilters, searchFromUrl, router, pathname]);

  const handleSearchStateChange = useCallback((searching: boolean) => {
    setIsSearching(searching);
  }, []);

  return (
    <Container className="flex flex-col !overflow-hidden">
      <TopBar
        variant="variant4"
        left={<h2>입양</h2>}
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

      {/* 탭 - 고정 */}
      <div className="z-10 bg-white w-full px-3.5">
        <TabButton
          value={activeTab}
          tabs={tabs}
          variant="variant3"
          useLinks={true}
        />
        <div className="border-b-2 border-lg -mt-0.5" />
      </div>

      {/* 스크롤 영역 - 검색/필터/결과/목록 모두 자연스럽게 스크롤 */}
      <div ref={scrollContainerRef} id="list-scroll-container" className="flex-1 overflow-y-auto">
        {activeTab === "animal" ? (
          <>
            <AnimalSearchSection
              filters={filters}
              filterCounts={filterCounts}
              onSearchStateChange={handleSearchStateChange}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearAllFilters}
              searchVisible={searchVisible}
              filterSlot={
                <div className="px-4 pb-3">
                  <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                    {filterOptions.map((option) => (
                      <MiniButton
                        key={option.label}
                        text={`${option.label}${option.count > 0 ? ` ${option.count}` : ""}`}
                        rightIcon={<CaretDown size={12} />}
                        variant={option.hasFilters ? "filterOn" : "filterOff"}
                        onClick={openFilterOverlay}
                        className="flex-shrink-0"
                      />
                    ))}
                  </div>
                  {hasActiveFilters && (
                    <div className="flex justify-end mt-3">
                      <button onClick={handleClearAllFilters} className="text-sm text-gr cursor-pointer">
                        필터 초기화
                      </button>
                    </div>
                  )}
                </div>
              }
            />
            {!isSearching && children}
          </>
        ) : (
          <>
            <CenterSearchSection
              onSearchStateChange={handleSearchStateChange}
              scrollContainerRef={scrollContainerRef}
            />
            {!isSearching && children}
          </>
        )}
      </div>
      {activeTab === "animal" && <AnimalFilterOverlay />}
      <NavBar />
    </Container>
  );
}
