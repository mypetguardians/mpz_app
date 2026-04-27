"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Heart } from "@phosphor-icons/react";

import { SearchInput } from "@/components/ui/SearchInput";
import { PetCard } from "@/components/ui/PetCard";
import { IconButton } from "@/components/ui/IconButton";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToggleAnimalFavorite } from "@/hooks/mutation/useToggleAnimalFavorite";
import { useBatchAnimalFavorites } from "@/hooks/query/useBatchAnimalFavorites";
import { cn } from "@/lib/utils";

import { FilterState } from "@/lib/filter-utils";
// useAnimalFiltersStore는 ListLayout에서 사용
import type { RawAnimalResponse } from "@/types/animal";

interface AnimalSearchSectionProps {
  filters: FilterState;
  onSearchStateChange: (isSearching: boolean) => void;
  filterSlot?: React.ReactNode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

type SearchAnimal = RawAnimalResponse;

export function useAnimalSearch({
  filters,
  onSearchStateChange,
  filterSlot,
  hasActiveFilters,
  onClearFilters,
}: AnimalSearchSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const toggleFavorite = useToggleAnimalFavorite();
  // sessionStorage로 뒤로가기 시 검색값 유지
  const [localSearchValue, setLocalSearchValue] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("animalSearchValue") || "";
  });
  const [isSearching, setIsSearching] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!sessionStorage.getItem("animalSearchValue");
  });
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {},
  );

  // 보호상태 필터 기본값 처리 (비어있으면 "입양가능"을 기본값으로 사용)
  const effectiveProtectionStatus =
    filters.protectionStatus.length > 0
      ? filters.protectionStatus
      : ["입양가능"];

  // 검색 결과 가져오기
  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    fetchNextPage: fetchNextSearchPage,
    hasNextPage: hasNextSearchPage,
    isFetchingNextPage: isFetchingNextSearchPage,
  } = useGetAnimals({
    search: localSearchValue.trim() || undefined,
    breed: filters.breed || undefined,
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
    // 보호상태 필터 (기본값 "입양가능" 적용)
    ...(effectiveProtectionStatus.length > 0 && {
      status:
        effectiveProtectionStatus[0] === "입양가능"
          ? "입양가능" // 입양가능은 입양가능으로 검색 (백엔드에서 입양진행중도 포함하도록 수정 필요)
          : effectiveProtectionStatus[0] === "보호중"
          ? "입양불가" // "보호중"으로 표시되지만 "입양불가"로 검색
          : (effectiveProtectionStatus[0] as
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

  // 중복 제거 + 유효한 동물만 필터
  const validSearchAnimals = useMemo(() => {
    const seen = new Set<string>();
    return searchAnimals
      .filter((a): a is NonNullable<typeof a> => !!a?.id)
      .filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
  }, [searchAnimals]);

  // 2열 그리드를 위해 row 단위로 묶기
  const searchRows = useMemo(() => {
    const result: RawAnimalResponse[][] = [];
    for (let i = 0; i < validSearchAnimals.length; i += 2) {
      result.push(validSearchAnimals.slice(i, i + 2));
    }
    return result;
  }, [validSearchAnimals]);

  // 찜 상태 일괄 조회
  const searchAnimalIds = useMemo(
    () => validSearchAnimals.map((a) => a.id),
    [validSearchAnimals],
  );
  const { data: batchFavorites } = useBatchAnimalFavorites(
    searchAnimalIds,
    isAuthenticated && searchAnimalIds.length > 0,
  );

  // 스크롤 컨테이너 ref (버추얼 스크롤 + 무한스크롤용)
  const getSearchScrollElement = useCallback(() => {
    return document.getElementById("list-scroll-container");
  }, []);

  // 버추얼 스크롤
  const searchVirtualizer = useVirtualizer({
    count: searchRows.length,
    estimateSize: () => 256,
    gap: 8,
    overscan: 2,
    getScrollElement: getSearchScrollElement,
  });

  const searchVirtualItems = searchVirtualizer.getVirtualItems();

  // 무한스크롤: 마지막 가상 아이템 근처 도달 시 다음 페이지 로드
  useEffect(() => {
    const lastItem = searchVirtualItems[searchVirtualItems.length - 1];
    if (!lastItem) return;
    if (
      lastItem.index >= searchRows.length - 1 &&
      hasNextSearchPage &&
      !isFetchingNextSearchPage
    ) {
      fetchNextSearchPage();
    }
  }, [searchVirtualItems, searchRows.length, hasNextSearchPage, isFetchingNextSearchPage, fetchNextSearchPage]);

  // 무한스크롤은 searchVirtualItems의 useEffect에서 처리

  const handleSearch = () => {
    const trimmedValue = localSearchValue.trim();
    if (trimmedValue) {
      setIsSearching(true);
      onSearchStateChange(true);
    } else {
      handleSearchClear();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    if (value.trim()) {
      setIsSearching(true);
      sessionStorage.setItem("animalSearchValue", value.trim());
    } else {
      setIsSearching(false);
      sessionStorage.removeItem("animalSearchValue");
    }
  };

  const handleSearchClear = () => {
    setLocalSearchValue("");
    setIsSearching(false);
    sessionStorage.removeItem("animalSearchValue");
    onSearchStateChange(false);
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = useCallback(
    (animalId: string) => {
      if (!isAuthenticated) {
        const qs = searchParams.toString();
        const currentUrl = `${pathname}${qs ? `?${qs}` : ""}`;
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      const currentFavorite =
        localFavorites[animalId] !== undefined
          ? localFavorites[animalId]
          : batchFavorites?.[animalId] ?? false;

      // optimistic update
      setLocalFavorites((prev) => ({ ...prev, [animalId]: !currentFavorite }));

      toggleFavorite.mutate(
        { animalId },
        {
          onSuccess: (data) => {
            const isFavorited = data.is_favorited ?? false;
            setLocalFavorites((prev) => ({ ...prev, [animalId]: isFavorited }));
          },
          onError: () => {
            setLocalFavorites((prev) => ({
              ...prev,
              [animalId]: currentFavorite,
            }));
          },
        },
      );
    },
    [
      isAuthenticated,
      localFavorites,
      toggleFavorite,
      pathname,
      router,
      searchParams,
    ],
  );

  // 결과 헤더 (검색 결과 N건 + 초기화 버튼들) - 접히는 영역에 포함
  const searchHeaderElement = showSearchResults ? (
    <div className="px-4 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-dg font-medium">
          검색 결과{searchData ? ` (${searchTotal}건)` : ""}
        </span>
        <div className="flex items-center">
          {hasActiveFilters && onClearFilters && (
            <>
              <button
                onClick={onClearFilters}
                className="text-xs text-gr cursor-pointer"
              >
                필터 초기화
              </button>
              <span className="mx-1.5 h-3 w-px bg-gray-300" />
            </>
          )}
          <button
            onClick={handleSearchClear}
            className="text-xs text-gr cursor-pointer"
          >
            검색 초기화
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const searchResultsElement = showSearchResults ? (
    <div className="px-4 pt-2">
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
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-gray-500">
            &ldquo;{localSearchValue}&rdquo;에 해당하는 동물을 찾을 수 없습니다
          </div>
        </div>
      )}

      {hasSearchResults && (
        <div
          style={{
            height: `${searchVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {searchVirtualItems.map((virtualRow) => {
            const row = searchRows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex cursor-pointer space-x-2">
                  {row.map((animal) => (
                    <SearchAnimalCardWithFavorite
                      key={animal.id}
                      animal={animal}
                      isAuthenticated={isAuthenticated}
                      localFavorite={localFavorites[animal.id]}
                      batchFavorite={batchFavorites?.[animal.id]}
                      onLikeToggle={handleLikeToggle}
                      onNavigate={() => router.push(`/list/animal/${animal.id}`)}
                      variant="primary"
                      className="w-[calc(50%-4px)] cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFetchingNextSearchPage && (
        <div className="py-4 text-center text-gray-500">불러오는 중...</div>
      )}
    </div>
  ) : null;

  // 두 영역을 분리해서 반환 — ListLayout에서 다른 위치에 배치
  const controlArea = (
    <>
      <div className="px-4 py-4">
        <SearchInput
          value={localSearchValue}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          onClear={handleSearchClear}
          triggerOnContainerClick={false}
          placeholder="품종, 이름 또는 발견 지역으로 검색해보세요."
          variant="primary"
          readOnly={false}
        />
      </div>
      {filterSlot}
      {/* 검색 중이면 searchHeader에 포함, 아니면 단독 표시 */}
      {showSearchResults ? searchHeaderElement : (
        hasActiveFilters && onClearFilters && (
          <div className="flex justify-end px-4 pb-2">
            <button onClick={onClearFilters} className="text-xs text-gr cursor-pointer">
              필터 초기화
            </button>
          </div>
        )
      )}
    </>
  );

  const resultsArea = searchResultsElement;

  return { controlArea, resultsArea };
}

// 검색 결과용 동물 카드 컴포넌트 (찜 버튼 포함)
function SearchAnimalCardWithFavorite({
  animal,
  isAuthenticated,
  onLikeToggle,
  localFavorite,
  batchFavorite,
  onNavigate,
  variant,
  className,
}: {
  animal: SearchAnimal;
  isAuthenticated: boolean;
  onLikeToggle: (animalId: string) => void;
  localFavorite?: boolean;
  batchFavorite?: boolean;
  onNavigate: () => void;
  variant: "primary" | "variant2";
  className: string;
}) {
  const isLiked =
    isAuthenticated &&
    (localFavorite !== undefined ? localFavorite : batchFavorite ?? false);

  return (
    <div
      className={className}
      onClick={onNavigate}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onNavigate();
      }}
    >
      <div className="relative">
        <PetCard
          pet={{
            id: animal.id,
            name: animal.name,
            breed: animal.breed,
            isFemale: animal.is_female,
            protection_status: animal.protection_status ?? "보호중",
            adoption_status: animal.adoption_status ?? "입양가능",
            animalImages:
              animal.animal_images?.map((image) => ({
                id: image.id,
                imageUrl: image.image_url,
                orderIndex: image.order_index,
              })) || [],
            foundLocation: animal.found_location || "",
            centerId: animal.center_id,
            trainerComment: animal.trainer_comment ?? null,
            activityLevel: animal.activity_level || null,
            sensitivity: animal.sensitivity || null,
            sociability: animal.sociability || null,
          }}
          variant={variant}
          imageSize="full"
          className="w-full"
          headerAction={
            isAuthenticated ? (
              <div onClick={(e) => e.stopPropagation()}>
                <IconButton
                  icon={({ size, className }) => (
                    <Heart
                      size={size}
                      className={cn(
                        className,
                        isLiked ? "text-brand" : "text-[#e3e3e3]",
                        isLiked && "fill-current",
                      )}
                      weight={isLiked ? "fill" : "regular"}
                    />
                  )}
                  size="iconM"
                  label="찜"
                  onClick={() => onLikeToggle(animal.id)}
                />
              </div>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
