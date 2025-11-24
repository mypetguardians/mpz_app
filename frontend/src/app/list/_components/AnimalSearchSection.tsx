"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { SearchInput } from "@/components/ui/SearchInput";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";

import { FilterState, getFilterCounts } from "@/lib/filter-utils";
import { useAnimalFilterOverlayStore } from "@/stores/animalFilterOverlay";

interface AnimalSearchSectionProps {
  filters: FilterState;
  filterCounts: ReturnType<typeof getFilterCounts>;
  onSearchStateChange: (isSearching: boolean) => void;
}

export function AnimalSearchSection({
  filters,
  filterCounts,
  onSearchStateChange,
}: AnimalSearchSectionProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { open: openFilterOverlay } = useAnimalFilterOverlayStore();

  // 검색 결과 가져오기
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: hasNextSearchPage,
    isFetchingNextPage: isFetchingNextSearchPage,
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
        filters.protectionStatus[0] === "입양가능"
          ? "입양가능" // 입양가능은 입양가능으로 검색 (백엔드에서 입양진행중도 포함하도록 수정 필요)
          : filters.protectionStatus[0] === "보호중"
          ? "입양불가" // "보호중"으로 표시되지만 "입양불가"로 검색
          : (filters.protectionStatus[0] as
              | "보호중"
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

  // 검색 결과가 있는지 확인
  const hasSearchResults = (searchData?.pages?.[0]?.data?.length ?? 0) > 0;

  // 검색 상태 업데이트 - 텍스트 검색만 활성화되어 있으면 true
  const showSearchResults = isSearching; // 텍스트 검색만 검색 결과로 표시

  // 검색 상태가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    onSearchStateChange(showSearchResults);
  }, [showSearchResults, onSearchStateChange]);

  // 검색 결과 데이터 추출
  const searchAnimals = searchData?.pages.flatMap((page) => page.data) || [];
  const searchTotal = searchData?.pages[0]?.totalCnt || 0;

  const loadMoreSearchResults = useCallback(() => {
    if (!showSearchResults) return;
    if (isFetchingNextSearchPage || !hasNextSearchPage) return;
    fetchNextSearchPage();
  }, [
    fetchNextSearchPage,
    hasNextSearchPage,
    isFetchingNextSearchPage,
    showSearchResults,
  ]);

  useEffect(() => {
    if (!showSearchResults) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        const isNearBottom = scrollTop + windowHeight >= documentHeight - 600;
        if (isNearBottom) {
          loadMoreSearchResults();
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loadMoreSearchResults, showSearchResults]);

  // 필터 옵션들
  const filterOptions = [
    {
      label: "지역",
      count: filterCounts.regions,
      hasFilters: filterCounts.regions > 0,
    },
    {
      label: "품종",
      count: filterCounts.breed,
      hasFilters: filterCounts.breed > 0,
    },
    {
      label: "체중",
      count: filterCounts.weights,
      hasFilters: filterCounts.weights > 0,
    },
    {
      label: "성별",
      count: filterCounts.genders,
      hasFilters: filterCounts.genders > 0,
    },
    {
      label: "나이",
      count: filterCounts.ages,
      hasFilters: filterCounts.ages > 0,
    },
    {
      label: "보호상태",
      count: filterCounts.protectionStatus,
      hasFilters: filterCounts.protectionStatus > 0,
    },
    {
      label: "전문가 분석",
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
              onClick={openFilterOverlay}
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
              className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
            >
              검색 초기화
            </button>
          </div>

          {isSearchLoading && (
            <div className="py-8 text-center">
              <div className="text-gray-500">검색 중...</div>
            </div>
          )}

          {searchError && (
            <div className="py-8 text-center">
              <div className="text-red-500">검색 중 오류가 발생했습니다</div>
            </div>
          )}

          {!isSearchLoading && !searchError && !hasSearchResults && (
            <div className="py-8 text-center">
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
                        activityLevel: animal.activity_level || null,
                        sensitivity: animal.sensitivity || null,
                        sociability: animal.sociability || null,
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

          {isFetchingNextSearchPage && (
            <div className="py-4 text-center text-gray-500">불러오는 중...</div>
          )}
        </div>
      )}
    </>
  );
}
