"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const [searchValue, setSearchValue] = useState("");
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
    if (searchValue.trim()) {
      router.push(`${pathname}?search=${encodeURIComponent(searchValue)}`);
    }
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
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
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
