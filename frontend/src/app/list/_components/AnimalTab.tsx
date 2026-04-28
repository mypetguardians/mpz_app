"use client";

import React, { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";

import { PetCard, PetCardSkeleton } from "@/components/ui";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import {
  transformRawAnimalToPetCard,
  GetAnimalsParams,
  RawAnimalResponse,
} from "@/types/animal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToggleAnimalFavorite } from "@/hooks/mutation/useToggleAnimalFavorite";
import { useBatchAnimalFavorites } from "@/hooks/query/useBatchAnimalFavorites";
import { IconButton } from "@/components/ui/IconButton";
import { Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAnimalFiltersStore } from "@/stores/animalFilters";

const ITEMS_PER_PAGE = 20;

function AnimalTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const toggleFavorite = useToggleAnimalFavorite();
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>(
    {}
  );
  const listRef = useRef<HTMLDivElement>(null);
  const scrollRestoredRef = useRef(false);
  const {
    filters,
    searchValue,
  } = useAnimalFiltersStore();

  // URL 파라미터에서 검색 값 읽기
  const searchFromUrl = searchParams.get("search") || "";

  // 필터 파라미터를 API 요청에 맞게 변환
  const apiParams = useMemo(() => {
    const params: GetAnimalsParams = {
      page_size: ITEMS_PER_PAGE,
      sort_by: "created_at",
      sort_order: "desc",
    };

    // 검색 값 우선순위: URL 파라미터 > 스토어 searchValue > 필터 breed
    const breedValue = searchFromUrl || searchValue || filters.breed;
    if (breedValue) {
      params.breed = breedValue;
    }

    // 체중 필터 (weights 배열의 첫 번째 값 사용)
    if (filters.weights.length > 0) {
      const weightValue = filters.weights[0];
      if (weightValue === "10kg 이하") {
        params.weight_max = 10;
      } else if (weightValue === "25kg 이하") {
        params.weight_max = 25;
      } else if (weightValue === "그 이상") {
        params.weight_min = 25;
      }
    }

    // 지역 필터 (regions 배열의 첫 번째 값 사용)
    if (filters.regions.length > 0) {
      params.region = filters.regions[0];
    }

    // 나이 필터 (ages 배열의 첫 번째 값 사용) - 개월 단위로 변환
    if (filters.ages.length > 0) {
      const ageValue = filters.ages[0];
      if (ageValue === "2살 이하") {
        params.age_max = 24; // 2년 = 24개월
      } else if (ageValue === "7살 이하") {
        params.age_max = 84; // 7년 = 84개월
      } else if (ageValue === "그 이상") {
        params.age_min = 84; // 7년 이상
      }
    }

    // 성별 필터 (genders 배열의 첫 번째 값 사용)
    if (filters.genders.length > 0) {
      const genderValue = filters.genders[0];
      if (genderValue === "남아") {
        params.gender = "male";
      } else if (genderValue === "여아") {
        params.gender = "female";
      }
    }

    // 보호상태 필터 - 단순 첫 번째 값 사용
    if (filters.protectionStatus.length > 0) {
      const firstStatus = filters.protectionStatus[0];
      if (firstStatus) {
        params.status = firstStatus as GetAnimalsParams["status"];
      }
    }

    // 전문가 의견 필터
    if (
      filters.expertOpinion.length > 0 &&
      filters.expertOpinion[0] === "포함"
    ) {
      params.has_trainer_comment = "true";
    }

    return params;
  }, [filters, searchFromUrl, searchValue]);

  // 오래기다린순 우선노출로 전체 데이터 가져오기
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAnimals(apiParams);

  // 스크롤 컨테이너 ref
  const getScrollElement = useCallback(() => {
    return document.getElementById("list-scroll-container");
  }, []);

  // 필터가 변경될 때 스크롤 위치 초기화 (초기 마운트 제외)
  const apiParamsInitRef = useRef(true);
  useEffect(() => {
    if (apiParamsInitRef.current) {
      apiParamsInitRef.current = false;
      return;
    }
    getScrollElement()?.scrollTo(0, 0);
    sessionStorage.removeItem("animalListScrollTop");
    scrollRestoredRef.current = false;
  }, [apiParams, getScrollElement]);

  // 상세 페이지 이동 전 스크롤 위치 저장
  const saveScrollPosition = useCallback(() => {
    const el = getScrollElement();
    if (el) {
      sessionStorage.setItem("animalListScrollTop", String(el.scrollTop));
    }
  }, [getScrollElement]);

  // React Query 데이터에서 직접 동물 목록 추출 (페이지 간 중복 제거)
  const allAnimals = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data.pages
      .flatMap((page) => page.data || [])
      .filter((animal) => {
        if (!animal || typeof animal !== "object" || !animal.id) return false;
        if (seen.has(animal.id)) return false;
        seen.add(animal.id);
        return true;
      });
  }, [data]);

  // 뒤로가기 시 스크롤 위치 복원 (데이터 로드 후)
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    if (allAnimals.length === 0) return;

    const saved = sessionStorage.getItem("animalListScrollTop");
    if (saved) {
      const scrollTarget = parseInt(saved);
      const el = getScrollElement();
      if (el) {
        el.scrollTo(0, scrollTarget);
        requestAnimationFrame(() => {
          el.scrollTo(0, scrollTarget);
          // 복원 성공 확인 후에만 완료 처리 (ListLayout 리렌더로 리셋될 수 있음)
          if (el.scrollTop > 0) {
            scrollRestoredRef.current = true;
            sessionStorage.removeItem("animalListScrollTop");
          }
        });
      }
    }
  }, [allAnimals.length, getScrollElement]);

  // 찜 상태 일괄 조회 (개별 API 대신 1콜로 처리)
  const animalIds = useMemo(() => allAnimals.map((a) => a.id), [allAnimals]);
  const { data: batchFavorites } = useBatchAnimalFavorites(
    animalIds,
    isAuthenticated && animalIds.length > 0
  );

  // 2열 그리드를 위해 row 단위로 묶기
  const rows = useMemo(() => {
    const filtered = allAnimals.filter((a) => a && a.id);
    const result: RawAnimalResponse[][] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      result.push(filtered.slice(i, i + 2));
    }
    return result;
  }, [allAnimals]);

  // 버추얼 스크롤 (스크롤 컨테이너 기반, row 단위 가상화)
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 256,
    gap: 8,
    overscan: 2,
    getScrollElement,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // 마지막 가상 아이템 근처 도달 시 다음 페이지 로드
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 좋아요 토글 핸들러 (동물)
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
        }
      );
    },
    [
      isAuthenticated,
      localFavorites,
      batchFavorites,
      toggleFavorite,
      pathname,
      router,
      searchParams,
    ]
  );

  // 로딩 상태 처리 - 스켈레톤 표시
  if (isLoading && allAnimals.length === 0) {
    return (
      <div className="mx-4">
        <div className="flex flex-wrap justify-start gap-2">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="w-[calc(50%-4px)]">
              <PetCardSkeleton
                variant="primary"
                imageSize="full"
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">데이터를 불러오는데 실패했습니다</div>
      </div>
    );
  }

  return (
    <div>
      {/* 데이터가 없는 경우 */}
      {allAnimals.length === 0 && !isLoading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-gray-500">등록된 동물이 없습니다</div>
        </div>
      )}

      {/* 버추얼 스크롤 그리드 */}
      <div ref={listRef} className="mx-4">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
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
                    <AnimalCardWithFavorite
                      key={animal.id}
                      animal={animal}
                      isAuthenticated={isAuthenticated}
                      localFavorite={localFavorites[animal.id]}
                      batchFavorite={batchFavorites?.[animal.id]}
                      onLikeToggle={handleLikeToggle}
                      onNavigate={() => {
                        saveScrollPosition();
                        router.push(`/list/animal/${animal.id}`);
                      }}
                      imagePriority={virtualRow.index === 0}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 추가 로딩 스켈레톤 */}
      {isFetchingNextPage && (
        <div className="mx-4 mt-4">
          <div className="flex flex-wrap justify-start gap-2">
            {[...Array(4)].map((_, index) => (
              <div key={`loading-${index}`} className="w-[calc(50%-4px)]">
                <PetCardSkeleton
                  variant="primary"
                  imageSize="full"
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { AnimalTab };

// 좋아요 상태를 확인하는 개별 동물 카드 컴포넌트
const AnimalCardWithFavorite = React.memo(function AnimalCardWithFavorite({
  animal,
  isAuthenticated,
  onLikeToggle,
  localFavorite,
  batchFavorite,
  onNavigate,
  imagePriority,
}: {
  animal: RawAnimalResponse;
  isAuthenticated: boolean;
  onLikeToggle: (animalId: string) => void;
  localFavorite?: boolean;
  batchFavorite?: boolean;
  onNavigate: () => void;
  imagePriority?: boolean;
}) {
  const isLiked =
    isAuthenticated &&
    (localFavorite !== undefined
      ? localFavorite
      : batchFavorite ?? false);

  return (
    <div className="w-[calc(50%-4px)]" onClick={onNavigate} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onNavigate(); }}>
      <div className="relative">
        <PetCard
          pet={transformRawAnimalToPetCard(animal)}
          variant="primary"
          imageSize="full"
          className="w-full"
          imagePriority={imagePriority}
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
}, (prev, next) => {
  return (
    prev.animal.id === next.animal.id &&
    prev.localFavorite === next.localFavorite &&
    prev.batchFavorite === next.batchFavorite
  );
});
