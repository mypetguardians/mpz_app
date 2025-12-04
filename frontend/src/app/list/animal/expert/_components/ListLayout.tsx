"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bell, CaretDown } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { MiniButton } from "@/components/ui/MiniButton";
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
  const { searchValue, setSearchValue: setStoredSearchValue } =
    useAnimalFiltersStore();

  // URL 파라미터에서 검색 값 읽기
  const searchFromUrl = searchParams.get("search") || "";

  // 스토어 값과 URL 파라미터 중 우선순위: URL > 스토어
  const initialSearchValue = searchFromUrl || searchValue;
  const [localSearchValue, setLocalSearchValue] = useState(initialSearchValue);
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

  const activeTab = pathname.includes("/center") ? "center" : "animal";

  const tabs = [
    { label: "동물 찾기", value: "animal", href: "/list/animal" },
    { label: "보호센터 찾기", value: "center", href: "/list/center" },
  ];

  const { filters } = useAnimalFiltersStore();
  const filterCounts = useMemo(() => getFilterCounts(filters), [filters]);
  const { open: openAnimalFilterOverlay } = useAnimalFilterOverlayStore();

  // URL 파라미터와 스토어 값 동기화
  useEffect(() => {
    // URL에 검색 파라미터가 있으면 우선 사용
    if (searchFromUrl && searchFromUrl !== searchValue) {
      setStoredSearchValue(searchFromUrl);
      setLocalSearchValue(searchFromUrl);
    } else if (searchValue && !searchFromUrl) {
      // URL에 없고 스토어에만 있으면 로컬 상태만 업데이트
      setLocalSearchValue(searchValue);
    }
  }, [searchFromUrl, searchValue, setStoredSearchValue]);

  const filterOptions = [
    {
      label: "지역",
      count: filterCounts.regions,
      hasFilters: filterCounts.regions > 0,
    },
    {
      label: "품종",
      count: filterCounts.breed,
      hasFilters: filterCounts.breed > 0,
    },
    {
      label: "체중",
      count: filterCounts.weights,
      hasFilters: filterCounts.weights > 0,
    },
    {
      label: "성별",
      count: filterCounts.genders,
      hasFilters: filterCounts.genders > 0,
    },
    {
      label: "나이",
      count: filterCounts.ages,
      hasFilters: filterCounts.ages > 0,
    },
    {
      label: "보호상태",
      count: filterCounts.protectionStatus,
      hasFilters: filterCounts.protectionStatus > 0,
    },
  ];

  const handleSearch = () => {
    const trimmedValue = localSearchValue.trim();
    setStoredSearchValue(trimmedValue);
    // URL 업데이트
    if (trimmedValue) {
      router.push(`${pathname}?search=${encodeURIComponent(trimmedValue)}`);
    } else {
      // 검색 값이 비어있으면 URL에서 제거
      router.push(pathname);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    // 실시간으로 스토어에 저장
    setStoredSearchValue(value);
  };

  // 입력이 완료된 후 자동으로 URL에 반영 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedValue = localSearchValue.trim();
      // 현재 URL의 검색 값과 다를 때만 업데이트
      if (trimmedValue !== searchFromUrl) {
        if (trimmedValue) {
          router.push(`${pathname}?search=${encodeURIComponent(trimmedValue)}`);
        } else if (searchFromUrl) {
          // 검색 값이 비어있고 URL에 검색 파라미터가 있으면 제거
          router.push(pathname);
        }
      }
    }, 500); // 500ms 디바운싱

    return () => clearTimeout(timer);
  }, [localSearchValue, pathname, router, searchFromUrl]);

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left="입양"
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

      <div>
        <TabButton
          value={activeTab}
          tabs={tabs}
          variant="variant3"
          useLinks={true}
        />
      </div>

      <div className="px-4 pt-4">
        <SearchInput
          value={localSearchValue}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder={
            activeTab === "animal"
              ? "품종으로 검색해보세요."
              : "보호센터명으로 검색해보세요."
          }
          variant="primary"
        />
      </div>

      {activeTab === "animal" && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterOptions.map((option) => (
              <MiniButton
                key={option.label}
                text={`${option.label}${
                  option.count > 0 ? ` ${option.count}` : ""
                }`}
                rightIcon={<CaretDown size={12} />}
                variant={option.hasFilters ? "filterOn" : "filterOff"}
                onClick={openAnimalFilterOverlay}
                className="flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-4">{children}</div>
      {activeTab === "animal" && <AnimalFilterOverlay />}
      <NavBar />
    </Container>
  );
}
