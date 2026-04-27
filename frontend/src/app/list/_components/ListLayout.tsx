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
import { useAnimalSearch } from "./AnimalSearchSection";
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
  const [controlHeight, setControlHeight] = useState(0);
  const controlRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const isAnimating = useRef(false);

  // 실제 높이 측정
  useEffect(() => {
    if (controlRef.current) {
      setControlHeight(controlRef.current.scrollHeight);
    }
  });

  // 애니메이션 끝나면 잠금 해제
  const handleTransitionEnd = useCallback(() => {
    isAnimating.current = false;
  }, []);

  const accumulatedDelta = useRef(0);

  const handleScroll = useCallback(() => {
    if (isAnimating.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const currentScrollTop = el.scrollTop;
    const delta = currentScrollTop - lastScrollTop.current;
    lastScrollTop.current = currentScrollTop;

    if (currentScrollTop <= 10) {
      accumulatedDelta.current = 0;
      setSearchVisible(true);
      return;
    }

    // 방향 전환 시 누적 리셋
    if ((accumulatedDelta.current > 0 && delta < 0) || (accumulatedDelta.current < 0 && delta > 0)) {
      accumulatedDelta.current = 0;
    }
    accumulatedDelta.current += delta;

    // 같은 방향으로 40px 이상 누적돼야 반응
    if (Math.abs(accumulatedDelta.current) < 40) return;

    const nextVisible = accumulatedDelta.current < 0;
    accumulatedDelta.current = 0;

    // 이미 같은 상태면 무시
    setSearchVisible((prev) => {
      if (prev === nextVisible) return prev;
      isAnimating.current = true;
      return nextVisible;
    });
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

  // 동물 검색 훅 (항상 호출 — React 규칙 준수)
  const animalSearch = useAnimalSearch({
    filters,
    onSearchStateChange: handleSearchStateChange,
    hasActiveFilters,
    onClearFilters: handleClearAllFilters,
    filterSlot: (
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
      </div>
    ),
  });

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

      {/* 스크롤 영역 — 결과 카드 + 기본 목록 */}
      <div ref={scrollContainerRef} id="list-scroll-container" className="relative flex-1 overflow-y-auto">
        {/* 검색+필터 영역 — sticky로 탭 아래 고정, opacity로 fade */}
        {activeTab === "animal" && (
          <>
            <div
              ref={controlRef}
              className="sticky top-0 z-10 bg-white"
              onTransitionEnd={handleTransitionEnd}
              style={{
                opacity: searchVisible ? 1 : 0,
                pointerEvents: searchVisible ? "auto" : "none",
                transition: "opacity 200ms ease-in-out",
                marginBottom: searchVisible ? "0px" : `-${controlHeight}px`,
              }}
            >
              {animalSearch.controlArea}
            </div>
          </>
        )}
        {activeTab === "animal" ? (
          <>
            {animalSearch.resultsArea}
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
