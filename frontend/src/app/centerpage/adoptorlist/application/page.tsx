"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { TabButton } from "@/components/ui/TabButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { MiniButton } from "@/components/ui/MiniButton";
import { AdoptorListTab } from "../_components/AdoptorListTab";

function ApplicationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(paramsString);
    const statusParam = params.get("status") || "";
    const searchParam = params.get("search") || "";

    setStatusFilter(statusParam);
    setSearchValue(searchParam);
  }, [paramsString]);

  const handleSearch = () => {
    const trimmedSearch = searchValue.trim();
    const params = new URLSearchParams();

    if (statusFilter) {
      params.set("status", statusFilter);
    }

    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }

    const queryString = params.toString();

    router.push(
      `/centerpage/adoptorlist/application${
        queryString ? `?${queryString}` : ""
      }`
    );
  };

  const handleStatusFilterClick = (status: string) => {
    const trimmedSearch = searchValue.trim();
    const isSameStatus = statusFilter === status;
    const nextStatus = isSameStatus ? "" : status;

    setStatusFilter(nextStatus);

    const params = new URLSearchParams();
    if (nextStatus) {
      params.set("status", nextStatus);
    }
    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }

    const queryString = params.toString();

    router.push(
      `/centerpage/adoptorlist/application${
        queryString ? `?${queryString}` : ""
      }`
    );
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
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconS"
              onClick={() => router.push("/centerpage")}
            />
            <h4>입양자 관리</h4>
          </div>
        }
      />

      {/* 탭 버튼 */}
      <div>
        <TabButton
          value="application"
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

      {/* 상태 필터 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {["신청", "미팅", "계약서작성", "입양완료", "모니터링", "취소"].map(
            (status) => (
              <MiniButton
                key={status}
                text={status}
                variant={statusFilter === status ? "filterOn" : "filterOff"}
                onClick={() => handleStatusFilterClick(status)}
                className="flex-shrink-0"
              />
            )
          )}
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

export default function ApplicationPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ApplicationPageContent />
    </Suspense>
  );
}
