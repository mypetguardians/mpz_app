"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SearchInput } from "@/components/ui/SearchInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState("");
  const [localIsSearching, setLocalIsSearching] = useState(false);
  const [likedCenters, setLikedCenters] = useState<Set<string>>(new Set());

  // 지역 검색 바텀시트 상태
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [tempSelectedRegion, setTempSelectedRegion] = useState("");

  // URL에서 region 파라미터 읽기
  const regionFromUrl = searchParams.get("region");
  // 검색 결과 가져오기 - 텍스트 입력은 location으로, 지역 선택은 region으로 검색
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
  } = useGetCenters({
    location: searchValue.trim() || undefined,
  });

  // 지역별 검색을 위한 별도 훅 - URL 파라미터 또는 선택된 지역 사용
  const {
    data: regionSearchData,
    isLoading: isRegionSearchLoading,
    error: regionSearchError,
    fetchNextPage: fetchNextRegionPage,
    hasNextPage: hasNextRegionPage,
    isFetchingNextPage: isFetchingNextRegionPage,
  } = useGetCenters({
    region: tempSelectedRegion || regionFromUrl || undefined,
  });

  // 고정된 지역 리스트
  const regionList = [
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

  // 검색 결과가 있는지 확인 - 텍스트 검색과 지역 검색 결과를 모두 고려
  const hasSearchResults =
    (searchData &&
      searchData.pages &&
      searchData.pages.length > 0 &&
      searchData.pages.some((page) => page.data && page.data.length > 0)) ||
    (regionSearchData &&
      regionSearchData.pages &&
      regionSearchData.pages.length > 0 &&
      regionSearchData.pages.some((page) => page.data && page.data.length > 0));

  // 검색 상태 업데이트 - 텍스트 검색 또는 지역 검색 중 하나라도 활성화되어 있으면 true
  const showSearchResults =
    localIsSearching ||
    (tempSelectedRegion &&
      regionSearchData?.pages &&
      regionSearchData.pages.some(
        (page) => page.data && page.data.length > 0
      )) ||
    (regionFromUrl &&
      regionSearchData?.pages &&
      regionSearchData.pages.some((page) => page.data && page.data.length > 0));

  // 검색 결과 데이터 추출 - 지역 검색 결과가 우선, 모든 페이지의 데이터를 평면화하고 변환
  const searchCenters = (
    regionSearchData?.pages?.flatMap((page) => page.data || []) ||
    searchData?.pages?.flatMap((page) => page.data || []) ||
    []
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
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
    setLocalIsSearching(false);
    setTempSelectedRegion("");
    onSearchStateChange(false);

    // URL에서 region 파라미터 제거
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("region");
    router.push(currentUrl.pathname + currentUrl.search);
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

  // 지역 검색 바텀시트 핸들러들
  const handleRegionSearchClick = () => {
    setTempSelectedRegion(searchValue);
    setIsRegionSheetOpen(true);
  };

  const handleRegionApply = (region: string) => {
    setSearchValue(region);
    setIsRegionSheetOpen(false);
    setRegionSearchTerm("");
    if (region.trim()) {
      setLocalIsSearching(true);
      onSearchStateChange(true);

      // URL에 region 파라미터 추가
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("region", region);
      router.push(currentUrl.pathname + currentUrl.search);
    }
  };

  const handleRegionSelect = (region: string) => {
    setTempSelectedRegion(region);
  };

  // 지역 검색 결과 필터링
  const filteredRegions = regionList.filter((region) =>
    region.toLowerCase().includes(regionSearchTerm.toLowerCase())
  );

  return (
    <>
      {/* 검색 입력 */}
      <div className="px-4 py-4">
        <div onClick={handleRegionSearchClick} className="cursor-pointer">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            placeholder="지역으로 검색해보세요."
            variant="primary"
          />
        </div>
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

          {(isSearchLoading || isRegionSearchLoading) && (
            <div className="text-center py-8">
              <div className="text-gray-500">검색 중...</div>
            </div>
          )}

          {(searchError || regionSearchError) && (
            <div className="text-center py-8">
              <div className="text-red-500">검색 중 오류가 발생했습니다</div>
            </div>
          )}

          {!isSearchLoading &&
            !isRegionSearchLoading &&
            !searchError &&
            !regionSearchError &&
            !hasSearchResults && (
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
                    verified={center.verified || false}
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

      {/* 지역 검색 바텀시트 */}
      <BottomSheet
        open={isRegionSheetOpen}
        onClose={() => setIsRegionSheetOpen(false)}
        variant="selectMenu"
        showApplyButton={true}
        applyButtonText="적용하기"
        onApply={handleRegionApply}
        selectedValue={tempSelectedRegion}
      >
        <div className="flex flex-col gap-4">
          <SearchInput
            variant="variant2"
            placeholder="지역을 검색해보세요"
            value={regionSearchTerm}
            onChange={(e) => setRegionSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {filteredRegions.length > 0 ? (
              <div className="space-y-1">
                {filteredRegions.map((region: string, index: number) => (
                  <button
                    key={index}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                      tempSelectedRegion === region
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "text-gray-800"
                    }`}
                    onClick={() => handleRegionSelect(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                {regionSearchTerm.trim()
                  ? "검색 결과가 없습니다."
                  : "지역을 검색해보세요."}
              </p>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
