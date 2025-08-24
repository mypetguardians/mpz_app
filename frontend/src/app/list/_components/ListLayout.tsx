"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Bell } from "@phosphor-icons/react";
import Link from "next/link";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { AnimalSearchSection } from "./AnimalSearchSection";
import { CenterSearchSection } from "./CenterSearchSection";

import { FilterState, getFilterCounts } from "@/lib/filter-utils";

interface ListLayoutProps {
  children: React.ReactNode;
}

export function ListLayout({ children }: ListLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);

  // 현재 경로에서 활성 탭 결정
  const activeTab = pathname.includes("/center") ? "center" : "animal";

  const tabs = [
    { label: "동물 찾기", value: "animal", href: "/list/animal" },
    { label: "보호소 찾기", value: "center", href: "/list/center" },
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

  const handleSearchStateChange = (searching: boolean) => {
    setIsSearching(searching);
  };

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left={<h4>입양</h4>}
        right={
          <Link href="/notifications">
            <IconButton
              icon={({ size }) => <Bell size={size} weight="bold" />}
              size="iconM"
            />
          </Link>
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

      {/* 메인 콘텐츠 - 검색 중이 아닐 때만 표시 */}
      {!isSearching && children}
      <NavBar />
    </Container>
  );
}
