"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Heart } from "@phosphor-icons/react";

import { SearchInput } from "@/components/ui/SearchInput";
import { PetCard } from "@/components/ui/PetCard";
import { IconButton } from "@/components/ui/IconButton";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToggleAnimalFavorite } from "@/hooks/mutation/useToggleAnimalFavorite";
import { useCheckAnimalFavorite } from "@/hooks/query/useCheckAnimalFavorite";
import { cn } from "@/lib/utils";

import { FilterState, getFilterCounts } from "@/lib/filter-utils";
import { useAnimalFiltersStore } from "@/stores/animalFilters";
import type { RawAnimalResponse } from "@/types/animal";

interface AnimalSearchSectionProps {
  filters: FilterState;
  filterCounts: ReturnType<typeof getFilterCounts>;
  onSearchStateChange: (isSearching: boolean) => void;
}

type SearchAnimal = RawAnimalResponse;

export function AnimalSearchSection({
  filters,
  filterCounts,
  onSearchStateChange,
  children,
}: AnimalSearchSectionProps & {
  children?: (searchResults: React.ReactNode) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const toggleFavorite = useToggleAnimalFavorite();
  const {
    searchValue: storedSearchValue,
    setSearchValue: setStoredSearchValue,
  } = useAnimalFiltersStore();

  // URL 파라미터에서 검색 값 읽기
  const searchFromUrl = searchParams.get("search") || "";

  const [localSearchValue, setLocalSearchValue] = useState(searchFromUrl || storedSearchValue);
  const [isSearching, setIsSearching] = useState(!!(searchFromUrl || storedSearchValue));
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {}
  );

  // URL 파라미터 변경 시에만 동기화 (최초 진입 or 외부 URL 변경)
  const prevSearchFromUrl = useRef(searchFromUrl);
  useEffect(() => {
    if (searchFromUrl !== prevSearchFromUrl.current) {
      prevSearchFromUrl.current = searchFromUrl;
      if (searchFromUrl) {
        setLocalSearchValue(searchFromUrl);
        setStoredSearchValue(searchFromUrl);
        setIsSearching(true);
      }
    }
  }, [searchFromUrl, setStoredSearchValue]);

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
    breed: localSearchValue.trim() || filters.breed || undefined,
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

  const handleSearch = () => {
    const trimmedValue = localSearchValue.trim();
    if (trimmedValue) {
      setStoredSearchValue(trimmedValue);
      setIsSearching(true);
      router.push(`${pathname}?search=${encodeURIComponent(trimmedValue)}`);
      onSearchStateChange(true);
    } else {
      // 빈 값이면 검색 초기화
      handleSearchClear();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
  };

  const handleSearchClear = () => {
    setLocalSearchValue("");
    setStoredSearchValue("");
    setIsSearching(false);
    prevSearchFromUrl.current = "";
    router.push(pathname);
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
          : false;

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
        }
      );
    },
    [
      isAuthenticated,
      localFavorites,
      toggleFavorite,
      pathname,
      router,
      searchParams,
    ]
  );

  const searchResultsElement = showSearchResults ? (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-dg">
          {isSearching && localSearchValue.trim().length > 0
            ? `"${localSearchValue}" 검색 결과`
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
            &ldquo;{localSearchValue}&rdquo;에 해당하는 동물을 찾을 수
            없습니다
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
              <SearchAnimalCardWithFavorite
                key={animal.id ?? idx}
                animal={animal}
                isAuthenticated={isAuthenticated}
                localFavorite={localFavorites[animal.id]}
                onLikeToggle={handleLikeToggle}
                onNavigate={() => router.push(`/list/animal/${animal.id}`)}
                variant={
                  filters.expertOpinion.includes("포함")
                    ? "variant2"
                    : "primary"
                }
                className={
                  filters.expertOpinion.includes("포함")
                    ? "w-full cursor-pointer"
                    : "w-[calc(50%-4px)] cursor-pointer"
                }
              />
            ))}
        </div>
      )}

      {isFetchingNextSearchPage && (
        <div className="py-4 text-center text-gray-500">불러오는 중...</div>
      )}
    </div>
  ) : null;

  return (
    <>
      {/* 검색 입력 */}
      <div className="px-4 py-4">
        <SearchInput
          value={localSearchValue}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          triggerOnContainerClick={false}
          placeholder="품종으로 검색해보세요."
          variant="primary"
          readOnly={false}
        />
      </div>

      {/* 검색 결과를 children을 통해 외부에 위치시킴 */}
      {children?.(searchResultsElement)}
    </>
  );
}

// 검색 결과용 동물 카드 컴포넌트 (찜 버튼 포함)
function SearchAnimalCardWithFavorite({
  animal,
  isAuthenticated,
  onLikeToggle,
  localFavorite,
  onNavigate,
  variant,
  className,
}: {
  animal: SearchAnimal;
  isAuthenticated: boolean;
  onLikeToggle: (animalId: string) => void;
  localFavorite?: boolean;
  onNavigate: () => void;
  variant: "primary" | "variant2";
  className: string;
}) {
  const { data: favoriteData } = useCheckAnimalFavorite(
    animal.id,
    isAuthenticated && localFavorite === undefined
  );

  const isLiked =
    isAuthenticated &&
    (localFavorite !== undefined
      ? localFavorite
      : favoriteData
      ? favoriteData.is_favorited
      : false);

  return (
    <div className={className} onClick={onNavigate} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onNavigate(); }}>
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
                        isLiked && "fill-current"
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
