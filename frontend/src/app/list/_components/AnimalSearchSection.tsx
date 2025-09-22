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
    breed: searchValue.trim() || filters.breed || undefined,
    page_size: 20,
    // 체중 필터
    ...(filters.weights.length > 0 && {
      weight_max:
        filters.weights[0] === "10kg 이하"
          ? 10
          : filters.weights[0] === "25kg 이하"
          ? 25
          : undefined,
      weight_min: filters.weights[0] === "그 이상" ? 25 : undefined,
    }),
    // 지역 필터
    ...(filters.regions.length > 0 && {
      region: filters.regions[0],
    }),
    // 나이 필터
    ...(filters.ages.length > 0 && {
      age_max:
        filters.ages[0] === "2살 이하"
          ? 24
          : filters.ages[0] === "7살 이하"
          ? 84
          : undefined,
      age_min: filters.ages[0] === "그 이상" ? 84 : undefined,
    }),
    // 성별 필터
    ...(filters.genders.length > 0 && {
      gender: filters.genders[0] === "남아" ? "male" : "female",
    }),
    // 보호상태 필터
    ...(filters.protectionStatus.length > 0 && {
      status:
        filters.protectionStatus[0] === "무지개다리"
          ? "자연사" // 무지개다리는 자연사로 검색 (백엔드에서 처리)
          : filters.protectionStatus[0] === "입양가능"
          ? "입양가능" // 입양가능은 입양가능으로 검색 (백엔드에서 입양진행중도 포함하도록 수정 필요)
          : filters.protectionStatus[0] === "임시보호중"
          ? "보호중"
          : filters.protectionStatus[0] === "방사"
          ? "반환"
          : (filters.protectionStatus[0] as
              | "보호중"
              | "안락사"
              | "자연사"
              | "반환"
              | "입양가능"
              | "입양진행중"
              | "입양완료"
              | "입양불가"),
    }),
    // 전문가 의견 필터
    ...(filters.expertOpinion.length > 0 &&
      filters.expertOpinion[0] === "포함" && {
        has_trainer_comment: "true",
      }),
  });

  // 품종 검색을 위한 데이터 가져오기
  const { data: breedSearchData, isLoading: isBreedSearchLoading } =
    useGetAnimals({
      breed: breedSearchTerm.trim() || undefined,
      page_size: 50,
    });

  // 검색 결과가 있는지 확인
  const hasSearchResults = (searchData?.pages?.[0]?.data?.length ?? 0) > 0;

  // 검색 상태 업데이트 - 텍스트 검색만 활성화되어 있으면 true
  const showSearchResults = isSearching; // 텍스트 검색만 검색 결과로 표시

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
      path: "breed-sheet", // 특별한 경로로 바텀시트 열기
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
    {
      label: "전문가 분석",
      path: "/list/animal/filter",
      count: filterCounts.expertOpinion,
      hasFilters: filterCounts.expertOpinion > 0,
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
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          placeholder="품종으로 검색해보세요."
          variant="primary"
          readOnly={false}
        />
      </div>

      {/* 필터 미니버튼들은 항상 표시 */}
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
              onClick={() => {
                if (option.path === "breed-sheet") {
                  handleBreedSearchClick();
                } else {
                  onFilterClick(option.path);
                }
              }}
              className="flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* 검색 결과 표시 - 텍스트 검색만 */}
      {showSearchResults && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-dg">
              {isSearching && searchValue.trim().length > 0
                ? `"${searchValue}" 검색 결과`
                : "검색 결과"}
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
                &ldquo;{searchValue}&rdquo;에 해당하는 동물을 찾을 수 없습니다
              </div>
            </div>
          )}

          {hasSearchResults && (
            <div
              className={
                filters.expertOpinion.includes("포함")
                  ? "flex flex-col gap-3 cursor-pointer"
                  : "flex flex-wrap justify-start gap-2 cursor-pointer"
              }
            >
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
                    className={
                      filters.expertOpinion.includes("포함")
                        ? "w-full cursor-pointer"
                        : "w-[calc(50%-4px)] cursor-pointer"
                    }
                    onClick={() => router.push(`/list/animal/${animal.id}`)}
                  >
                    <PetCard
                      pet={{
                        id: animal.id,
                        name: animal.name,
                        breed: animal.breed,
                        isFemale: animal.is_female,
                        protection_status: animal.protection_status || "보호중",
                        adoption_status: animal.adoption_status || "입양가능",
                        animalImages:
                          animal.animal_images?.map((image) => ({
                            id: image.id,
                            imageUrl: image.image_url,
                            orderIndex: image.order_index,
                          })) || [],
                        foundLocation: animal.found_location || "",
                        centerId: animal.center_id,
                        trainerComment: animal.trainer_comment,
                        activityLevel: animal.activity_level?.toString() || "",
                        sensitivity: animal.sensitivity?.toString() || "",
                        sociability: animal.sociability?.toString() || "",
                      }}
                      variant={
                        filters.expertOpinion.includes("포함")
                          ? "variant2"
                          : "primary"
                      }
                      imageSize="full"
                      className="w-full"
                    />
                  </div>
                ))}
            </div>
          )}
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
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
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
