"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { SearchInput } from "@/components/ui/SearchInput";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";

import { FilterState, getFilterCounts } from "@/lib/filter-utils";

interface AnimalSearchSectionProps {
  filters: FilterState;
  filterCounts: ReturnType<typeof getFilterCounts>;
  onFilterClick: (path: string) => void;
  onSearchStateChange: (isSearching: boolean) => void;
}

export function AnimalSearchSection({
  filters,
  filterCounts,
  onFilterClick,
  onSearchStateChange,
}: AnimalSearchSectionProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 품종 검색 바텀시트 상태
  const [isBreedSheetOpen, setIsBreedSheetOpen] = useState(false);
  const [breedSearchTerm, setBreedSearchTerm] = useState("");
  const [tempSelectedBreed, setTempSelectedBreed] = useState("");

  // 검색 결과 가져오기
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
  } = useGetAnimals({
    breed: searchValue.trim() || undefined,
    limit: 20,
    // 필터 값들도 포함
    ...(filters.breed && { breed: filters.breed }),
    ...(filters.weights.length > 0 && {
      weight:
        filters.weights[0] === "10kg 이하"
          ? "10kg_under"
          : filters.weights[0] === "25kg 이하"
          ? "25kg_under"
          : filters.weights[0] === "그 이상"
          ? "over_25kg"
          : undefined,
    }),
    ...(filters.regions.length > 0 && {
      region: filters.regions[0] as
        | "서울"
        | "부산"
        | "대구"
        | "인천"
        | "광주"
        | "대전"
        | "울산"
        | "세종"
        | "경기"
        | "강원"
        | "충북"
        | "충남"
        | "전북"
        | "전남"
        | "경북"
        | "경남"
        | "제주",
    }),
    ...(filters.ages.length > 0 && {
      age:
        filters.ages[0] === "2살 이하"
          ? "2_under"
          : filters.ages[0] === "7살 이하"
          ? "7_under"
          : filters.ages[0] === "그 이상"
          ? "over_7"
          : undefined,
    }),
    ...(filters.genders.length > 0 && {
      gender:
        filters.genders[0] === "남아"
          ? "male"
          : filters.genders[0] === "여아"
          ? "female"
          : undefined,
    }),
    ...(filters.protectionStatus.length > 0 && {
      status:
        filters.protectionStatus[0] === "무지개다리"
          ? "자연사"
          : (filters.protectionStatus[0] as
              | "보호중"
              | "입양완료"
              | "임시보호중"
              | "반환"
              | "방사"),
    }),
    ...(filters.expertOpinion.length > 0 && { hasTrainerComment: "true" }),
  });

  // 품종 검색을 위한 데이터 가져오기
  const { data: breedSearchData, isLoading: isBreedSearchLoading } =
    useGetAnimals({
      breed: breedSearchTerm.trim() || undefined,
      limit: 50,
    });

  // 검색 결과가 있는지 확인
  const hasSearchResults = (searchData?.pages?.[0]?.data?.length ?? 0) > 0;

  // 검색 상태 업데이트 - 텍스트 검색 또는 필터 적용 중 하나라도 활성화되어 있으면 true
  const hasActiveFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );
  const showSearchResults = isSearching || hasActiveFilters;

  // 검색 상태가 변경될 때마다 부모 컴포넌트에 알림
  React.useEffect(() => {
    onSearchStateChange(showSearchResults);
  }, [showSearchResults, onSearchStateChange]);

  // 검색 결과 데이터 추출
  const searchAnimals = searchData?.pages.flatMap((page) => page.data) || [];
  const searchTotal = searchData?.pages[0]?.totalCnt || 0;

  // 품종 검색 결과 추출
  const breedSearchResults =
    breedSearchData?.pages.flatMap((page) => page.data) || [];
  const uniqueBreeds = Array.from(
    new Set(
      breedSearchResults
        ?.filter(
          (animal): animal is NonNullable<typeof animal> =>
            animal !== null &&
            animal !== undefined &&
            typeof animal === "object"
        )
        ?.map((animal) => animal.breed || "")
        ?.filter((breed) => breed !== "") || []
    )
  );

  // 필터 옵션들
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
      setIsSearching(true);
      onSearchStateChange(true);
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
    setIsSearching(false);
    // 필터도 초기화
    const currentUrl = new URL(window.location.href);
    currentUrl.search = "";
    router.push(currentUrl.pathname);
    onSearchStateChange(false);
  };

  // 품종 검색 바텀시트 핸들러들
  const handleBreedSearchClick = () => {
    setTempSelectedBreed(searchValue);
    setIsBreedSheetOpen(true);
  };

  const handleBreedApply = (breed: string) => {
    setSearchValue(breed);
    setIsBreedSheetOpen(false);
    setBreedSearchTerm("");
    if (breed.trim()) {
      setIsSearching(true);
      onSearchStateChange(true);
    }
  };

  const handleBreedSelect = (breed: string) => {
    setTempSelectedBreed(breed);
  };

  return (
    <>
      {/* 검색 입력 */}
      <div className="px-4 py-4">
        <div onClick={handleBreedSearchClick} className="cursor-pointer">
          <SearchInput
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            placeholder="품종으로 검색해보세요."
            variant="primary"
          />
        </div>
      </div>

      {/* 검색 결과 표시 */}
      {showSearchResults && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-dg">
              {isSearching && searchValue.trim().length > 0
                ? `"${searchValue}" 검색 결과`
                : hasActiveFilters
                ? "필터링된 결과"
                : "검색 결과"}
              {searchData && ` (${searchTotal}건)`}
            </h5>
            <button
              onClick={handleSearchClear}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              {isSearching && searchValue.trim().length > 0
                ? "검색 초기화"
                : "필터 초기화"}
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
                &ldquo;{searchValue}&rdquo;에 해당하는 동물을 찾을 수 없습니다
              </div>
            </div>
          )}

          {hasSearchResults && (
            <div className="flex flex-wrap justify-start gap-2 cursor-pointer">
              {searchAnimals
                .filter(
                  (animal): animal is NonNullable<typeof animal> =>
                    animal !== null &&
                    animal !== undefined &&
                    typeof animal === "object"
                )
                .map((animal, idx) => (
                  <div
                    key={animal.id ?? idx}
                    className="w-[calc(50%-4px)] cursor-pointer"
                    onClick={() => router.push(`/list/animal/${animal.id}`)}
                  >
                    <PetCard
                      pet={{
                        id: animal.id,
                        name: animal.name,
                        breed: animal.breed,
                        isFemale: animal.is_female,
                        status: animal.status,
                        animalImages:
                          animal.animal_images?.map((image) => ({
                            id: image.id,
                            imageUrl: image.image_url,
                            orderIndex: image.order_index,
                          })) || [],
                        foundLocation: animal.found_location || "",
                        centerId: animal.center_id,
                      }}
                      variant="primary"
                      imageSize="full"
                      className="w-full"
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {!showSearchResults && (
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterOptions.map((option) => (
              <MiniButton
                key={option.label}
                text={`${option.label}${
                  option.count > 0 ? ` ${option.count}` : ""
                }`}
                rightIcon={<CaretDown size={12} />}
                variant={option.hasFilters ? "filterOn" : "filterOff"}
                onClick={() => onFilterClick(option.path)}
                className="flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* 품종 검색 바텀시트 */}
      <BottomSheet
        open={isBreedSheetOpen}
        onClose={() => setIsBreedSheetOpen(false)}
        variant="selectMenu"
        showApplyButton={true}
        applyButtonText="적용하기"
        onApply={handleBreedApply}
        selectedValue={tempSelectedBreed}
      >
        <div className="flex flex-col gap-4">
          <SearchInput
            variant="variant2"
            placeholder="품종을 검색해보세요"
            value={breedSearchTerm}
            onChange={(e) => setBreedSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto">
            {isBreedSearchLoading ? (
              <div className="text-center py-4">
                <div className="text-gray-500">검색 중...</div>
              </div>
            ) : uniqueBreeds.length > 0 ? (
              <div className="space-y-1">
                {uniqueBreeds.map((breed, index) => (
                  <button
                    key={index}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                      tempSelectedBreed === breed
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "text-gray-800"
                    }`}
                    onClick={() => handleBreedSelect(breed)}
                  >
                    {breed}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                {breedSearchTerm.trim()
                  ? "검색 결과가 없습니다."
                  : "품종을 검색해보세요."}
              </p>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
