"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { MiniButton } from "@/components/ui/MiniButton";
import { AdoptorListTab } from "../_components/AdoptorListTab";

function AdopterPageContent() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const handleSearch = () => {
    if (searchValue.trim()) {
      router.push(`/centerpage/adoptorlist/adopter?search=${searchValue}`);
    }
  };

  const handleMonitoringFilterClick = () => {
    const newStatusFilter = statusFilter.includes("입양 완료")
      ? statusFilter.filter((s) => s !== "입양 완료")
      : ["입양 완료"];

    setStatusFilter(newStatusFilter);

    const params = new URLSearchParams();
    if (newStatusFilter.length > 0) {
      params.set("status", newStatusFilter.join(","));
    }
    if (searchValue.trim()) {
      params.set("search", searchValue);
    }

    router.push(`/centerpage/adoptorlist/adopter?${params.toString()}`);
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case "application":
        router.push("/centerpage/adoptorlist/application?tab=application");
        break;
      case "foster":
        router.push("/centerpage/adoptorlist/foster?tab=foster");
        break;
      case "adopter":
        router.push("/centerpage/adoptorlist/adopter?tab=adopter");
        break;
    }
  };

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left={<h4>입양자 목록</h4>}
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
          value="adopter"
          onValueChange={handleTabChange}
          tabs={[
            { label: "입양 신청", value: "application" },
            { label: "임시보호", value: "foster" },
            { label: "입양자", value: "adopter" },
          ]}
          variant="variant3"
        />
      </div>

      {/* 검색 입력 */}
      <div className="px-4 pt-4">
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          placeholder="입양자명으로 검색해보세요."
          variant="primary"
        />
      </div>

      {/* 모니터링 필터 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <MiniButton
            text="모니터링 중"
            variant={
              statusFilter.includes("입양 완료") ? "filterOn" : "filterOff"
            }
            onClick={handleMonitoringFilterClick}
            className="flex-shrink-0"
          />
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-4">
        <Suspense fallback={<div>로딩 중...</div>}>
          <AdoptorListTab />
        </Suspense>
      </div>
      <NavBar />
    </Container>
  );
}

export default function AdopterPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <AdopterPageContent />
    </Suspense>
  );
}
