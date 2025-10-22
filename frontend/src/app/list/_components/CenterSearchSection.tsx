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

  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [localIsSearching, setLocalIsSearching] = useState(false);
  const [likedCenters, setLikedCenters] = useState<Set<string>>(new Set());

  // URL에서 region 파라미터 읽기
  const regionFromUrl = searchParams.get("region");

  // 검색어 디바운싱 (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchValue);
      if (searchValue.trim()) {
        setLocalIsSearching(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  // 통합 검색 - 센터명 또는 지역으로 검색
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetCenters({
    name: debouncedSearch.trim() || undefined, // 센터명으로 검색
    region: regionFromUrl || undefined, // URL 파라미터의 지역 필터
  });

  // 검색 결과가 있는지 확인
  const hasSearchResults =
    searchData &&
    searchData.pages &&
    searchData.pages.length > 0 &&
    searchData.pages.some((page) => page.data && page.data.length > 0);

  // 검색 상태 업데이트
  const showSearchResults = localIsSearching || !!debouncedSearch.trim();

  // 검색 결과 데이터 추출
  const searchCenters = (
    searchData?.pages?.flatMap((page) => page.data || []) || []
  ).map(transformRawCenterToCenter);

  // 무한스크롤 핸들러
  const loadMoreCenters = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

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

  const handleSearchClear = () => {
    setSearchValue("");
    setDebouncedSearch("");
    setLocalIsSearching(false);
    onSearchStateChange(false);
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

  return (
    <>
      {/* 검색 입력 */}
      <div className="px-4 py-4">
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="센터명 또는 지역으로 검색"
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
                    verified={center.verified || false}
                    isLiked={likedCenters.has(center.id)}
                    onLikeToggle={() => handleLikeToggle(center.id)}
                    centerId={center.id}
                  />
                </div>
              ))}

              {/* 무한스크롤 로딩 스켈레톤 */}
              {isFetchingNextPage && (
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
    </>
  );
}
