"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, CaretDown } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { MiniButton } from "@/components/ui/MiniButton";
import { FilterState, getFilterCounts } from "@/lib/filter-utils";

interface ListLayoutProps {
  children: React.ReactNode;
}

export function ListLayout({ children }: ListLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");

  // 현재 경로에서 활성 탭 결정
  const activeTab = pathname.includes("/center") ? "center" : "animal";

  const tabs = [
    { label: "동물 찾기", value: "animal", href: "/list/animal" },
    { label: "보호소 찾기", value: "center", href: "/list/center" },
  ];

  // URL 파라미터에서 필터 상태 읽기
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

  // 필터 옵션들 (동물 탭에서만)
  const filterOptions = [
    {
      label: "지역",
      path: "/list/animal/filter",
      count: filterCounts.regions,
      hasFilters: filterCounts.regions > 0,
    },
    {
      label: "품종",
      path: "/list/animal/filter",
      count: filterCounts.breed,
      hasFilters: filterCounts.breed > 0,
    },
    {
      label: "체중",
      path: "/list/animal/filter",
      count: filterCounts.weights,
      hasFilters: filterCounts.weights > 0,
    },
    {
      label: "성별",
      path: "/list/animal/filter",
      count: filterCounts.genders,
      hasFilters: filterCounts.genders > 0,
    },
    {
      label: "나이",
      path: "/list/animal/filter",
      count: filterCounts.ages,
      hasFilters: filterCounts.ages > 0,
    },
    {
      label: "보호상태",
      path: "/list/animal/filter",
      count: filterCounts.protectionStatus,
      hasFilters: filterCounts.protectionStatus > 0,
    },
  ];

  const handleSearch = () => {
    if (searchValue.trim()) {
      router.push(`${pathname}?search=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleFilterClick = (path: string) => {
    router.push(path);
  };

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left={<h4>입양</h4>}
        right={
          <IconButton
            icon={({ size }) => <Bell size={size} weight="bold" />}
            size="iconM"
          />
        }
      />

      {/* 탭 버튼 */}
      <div>
        <TabButton
          value={activeTab}
          tabs={tabs}
          variant="variant3"
          useLinks={true} // URL 기반 네비게이션 사용
        />
      </div>

      {/* 검색 입력 */}
      <div className="px-4 pt-4">
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          placeholder={
            activeTab === "animal"
              ? "품종으로 검색해보세요."
              : "보호소명으로 검색해보세요."
          }
          variant="primary"
        />
      </div>

      {/* 필터 옵션 버튼들 - 동물 탭에서만 표시 */}
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
                onClick={() => handleFilterClick(option.path)}
                className="flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* 탭 컨텐츠 */}
      <div className="p-4">{children}</div>
      <NavBar />
    </Container>
  );
}
