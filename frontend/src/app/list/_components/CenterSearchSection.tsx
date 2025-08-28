"use client";

import { useState } from "react";

import { SearchInput } from "@/components/ui/SearchInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CenterCard } from "@/components/ui/CenterCard";
import { useGetCenterByLocation } from "@/hooks/query/useGetCenters";
import type { Center } from "@/types/center";

interface CenterSearchSectionProps {
  onSearchStateChange: (isSearching: boolean) => void;
}

export function CenterSearchSection({
  onSearchStateChange,
}: CenterSearchSectionProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [likedCenters, setLikedCenters] = useState<Set<string>>(new Set());

  // 지역 검색 바텀시트 상태
  const [isRegionSheetOpen, setIsRegionSheetOpen] = useState(false);
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [tempSelectedRegion, setTempSelectedRegion] = useState("");

  // 검색 결과 가져오기
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
  } = useGetCenterByLocation({
    region: searchValue.trim() || undefined,
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

  // 검색 결과가 있는지 확인
  const hasSearchResults =
    searchData && searchData.centers && searchData.centers.length > 0;
  const showSearchResults = isSearching && searchValue.trim().length > 0;

  // 검색 결과 데이터 추출
  const searchCenters = searchData?.centers || [];
  const searchTotal = searchData?.centers?.length || 0;

  const handleSearch = () => {
    if (searchValue.trim()) {
      setIsSearching(true);
      onSearchStateChange(true);
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
    setIsSearching(false);
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
      setIsSearching(true);
      onSearchStateChange(true);
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
            <h5 className="text-dg">
              &ldquo;{searchValue}&rdquo; 검색 결과
              {searchData && ` (${searchTotal}건)`}
            </h5>
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
                &ldquo;{searchValue}&rdquo;에 해당하는 보호소를 찾을 수 없습니다
              </div>
            </div>
          )}

          {hasSearchResults && (
            <div className="flex flex-col gap-4">
              {searchCenters.map((center: Center, idx: number) => (
                <div key={center.id ?? idx}>
                  <CenterCard
                    imageUrl="/img/dummyImg.jpeg"
                    name={center.name}
                    location={center.location || "주소 정보 없음"}
                    verified={center.verified || false}
                    isLiked={likedCenters.has(center.id)}
                    onLikeToggle={() => handleLikeToggle(center.id)}
                    centerId={center.id}
                  />
                </div>
              ))}
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
          <div className="max-h-60 overflow-y-auto">
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
