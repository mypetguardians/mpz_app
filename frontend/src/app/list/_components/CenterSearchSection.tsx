"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useSearchParams } from "next/navigation";

import { SearchInput } from "@/components/ui/SearchInput";
import { CenterCard } from "@/components/ui/CenterCard";
import { CenterCardSkeleton } from "@/components/ui/CenterCardSkeleton";
import { useGetCenters } from "@/hooks/query";
import type { Center } from "@/types/center";
import { transformRawCenterToCenter } from "@/types/center";

interface CenterSearchSectionProps {
  onSearchStateChange: (isSearching: boolean) => void;
}

export function CenterSearchSection({
  onSearchStateChange,
}: CenterSearchSectionProps) {
  const searchParams = useSearchParams();

  // 검색 쿼리 파라미터를 sessionStorage에 저장 (센터 상세페이지 뒤로가기 시 사용)
  useEffect(() => {
    const searchString = searchParams.toString();

    // 모든 검색 파라미터를 저장 (빈 문자열도 포함하여 현재 상태 보존)
    const paramsToStore = searchString ? `?${searchString}` : "";
    sessionStorage.setItem("centerListSearchParams", paramsToStore);
  }, [searchParams]);

  const [searchValue, setSearchValue] = useState("");
  const [localIsSearching, setLocalIsSearching] = useState(false);
  const [likedCenters, setLikedCenters] = useState<Set<string>>(new Set());

  // 초기 검색 상태 복원
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedValue = sessionStorage.getItem("centerListSearchValue") ?? "";
    const storedIsSearching =
      sessionStorage.getItem("centerListIsSearching") === "true";

    if (storedValue) {
      setSearchValue(storedValue);
    }
    if (storedIsSearching && storedValue) {
      setLocalIsSearching(true);
      onSearchStateChange(true);
    }
  }, [onSearchStateChange]);

  // 바텀시트 제거: 직접 입력 검색으로 변경

  // URL에서 region 파라미터 읽기
  const regionFromUrl = searchParams.get("region");
  const regionList: string[] = [
    "서울",
    "부산",
    "대구",
    "인천",
    "광주",
    "대전",
    "울산",
    "세종",
    "경기",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
  ];
  // 입력값이 지역명인지 판별하여 OR 유사 동작: 지역이면 region, 아니면 name으로 검색
  const normalized = searchValue.trim().toLowerCase();
  const isRegionKeyword = regionList
    .map((r) => r.toLowerCase())
    .includes(normalized);

  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    fetchNextPage: fetchNextRegionPage,
    hasNextPage: hasNextRegionPage,
    isFetchingNextPage: isFetchingNextRegionPage,
  } = useGetCenters({
    region: isRegionKeyword ? searchValue.trim() : regionFromUrl || undefined,
    name: !isRegionKeyword ? searchValue.trim() || undefined : undefined,
  });

  // 검색 결과가 있는지 확인 - 텍스트 검색과 지역 검색 결과를 모두 고려
  const hasSearchResults =
    searchData &&
    searchData.pages &&
    searchData.pages.length > 0 &&
    searchData.pages.some((page) => page.data && page.data.length > 0);

  // 검색 상태 업데이트 - 텍스트 검색 또는 지역 검색 중 하나라도 활성화되어 있으면 true
  const showSearchResults = localIsSearching;

  // 검색 결과 데이터 추출 - 지역 검색 결과가 우선, 모든 페이지의 데이터를 평면화하고 변환
  const searchCenters = (
    searchData?.pages?.flatMap((page) => page.data || []) || []
  ).map(transformRawCenterToCenter);

  // 무한스크롤 핸들러
  const loadMoreCenters = useCallback(() => {
    if (isFetchingNextRegionPage || !hasNextRegionPage) return;
    fetchNextRegionPage();
  }, [isFetchingNextRegionPage, hasNextRegionPage, fetchNextRegionPage]);

  // 스크롤 이벤트 처리 (디바운싱 적용)
  useEffect(() => {
    if (!showSearchResults) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        if (scrollTop + windowHeight >= documentHeight - 800) {
          loadMoreCenters();
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loadMoreCenters, showSearchResults]);

  // 검색 상태가 변경될 때마다 부모 컴포넌트에 알림
  React.useEffect(() => {
    onSearchStateChange(!!showSearchResults);
  }, [showSearchResults, onSearchStateChange]);

  const handleSearch = () => {
    if (searchValue.trim()) {
      setLocalIsSearching(true);
      onSearchStateChange(true);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("centerListSearchValue", searchValue.trim());
        sessionStorage.setItem("centerListIsSearching", "true");
      }
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
    setLocalIsSearching(false);
    onSearchStateChange(false);

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("centerListSearchValue");
      sessionStorage.removeItem("centerListIsSearching");
    }
  };

  const handleLikeToggle = (centerId: string) => {
    setLikedCenters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(centerId)) {
        newSet.delete(centerId);
      } else {
        newSet.add(centerId);
      }
      return newSet;
    });
  };

  // 바텀시트 제거로 관련 핸들러/필터 제거

  return (
    <>
      {/* 검색 입력 */}
      <div className="px-4 py-4">
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          placeholder="지역 또는 이름으로 검색해보세요."
          variant="primary"
        />
      </div>

      {/* 검색 결과 표시 */}
      {showSearchResults && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-dg">&ldquo;{searchValue}&rdquo; 검색 결과</h5>
            <button
              onClick={handleSearchClear}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              검색 초기화
            </button>
          </div>

          {isSearchLoading && (
            <div className="text-center py-8">
              <div className="text-gray-500">검색 중...</div>
            </div>
          )}

          {searchError && (
            <div className="text-center py-8">
              <div className="text-red-500">검색 중 오류가 발생했습니다</div>
            </div>
          )}

          {!isSearchLoading && !searchError && !hasSearchResults && (
            <div className="text-center py-8">
              <div className="text-gray-500">
                &ldquo;{searchValue}&rdquo;에 해당하는 보호센터를 찾을 수
                없습니다
              </div>
            </div>
          )}

          {hasSearchResults && (
            <div className="flex flex-col gap-4">
              {searchCenters.map((center: Center, idx: number) => (
                <div key={center.id ?? idx}>
                  <CenterCard
                    imageUrl="/img/dummyImg.png"
                    name={center.name}
                    location={center.location || "주소 정보 없음"}
                    isSubscribed={center.isSubscriber || false}
                    isLiked={likedCenters.has(center.id)}
                    onLikeToggle={() => handleLikeToggle(center.id)}
                    centerId={center.id}
                  />
                </div>
              ))}

              {/* 무한스크롤 로딩 스켈레톤 */}
              {isFetchingNextRegionPage && (
                <div className="flex flex-col gap-4 mt-4">
                  {[...Array(3)].map((_, index) => (
                    <CenterCardSkeleton key={`loading-${index}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* 바텀시트 제거 완료 */}
    </>
  );
}
