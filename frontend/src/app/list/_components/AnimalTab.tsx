"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { PetCard, PetCardSkeleton } from "@/components/ui";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import {
  transformRawAnimalToPetCard,
  GetAnimalsParams,
  RawAnimalResponse,
} from "@/types/animal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToggleAnimalFavorite } from "@/hooks/mutation/useToggleAnimalFavorite";
import { useCheckAnimalFavorite } from "@/hooks/query/useCheckAnimalFavorite";
import { IconButton } from "@/components/ui/IconButton";
import { Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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

  // URL 파라미터에서 필터 상태 읽기
  const filters = useMemo(() => {
    const result = {
      breed: searchParams.get("breed") || "",
      weights: searchParams.get("weights")?.split(",").filter(Boolean) || [],
      regions: searchParams.get("regions")?.split(",").filter(Boolean) || [],
      ages: searchParams.get("ages")?.split(",").filter(Boolean) || [],
      genders: searchParams.get("genders")?.split(",").filter(Boolean) || [],
      protectionStatus:
        searchParams.get("protectionStatus")?.split(",").filter(Boolean) || [],
      expertOpinion:
        searchParams.get("expertOpinion")?.split(",").filter(Boolean) || [],
    };

    return result;
  }, [searchParams]);

  // 필터 파라미터를 API 요청에 맞게 변환
  const apiParams = useMemo(() => {
    const params: GetAnimalsParams = {
      page_size: ITEMS_PER_PAGE,
      sort_by: "created_at", // 기본 정렬
      sort_order: "desc",
    };

    // 품종 필터
    if (filters.breed) {
      params.breed = filters.breed;
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

    // 보호상태 필터 (protectionStatus 배열의 첫 번째 값 사용)
    if (filters.protectionStatus.length > 0) {
      const statusValue = filters.protectionStatus[0];
      // 백엔드 API는 status 하나의 필드로 처리
      params.status = statusValue as GetAnimalsParams["status"];
    }

    // 전문가 의견 필터
    if (
      filters.expertOpinion.length > 0 &&
      filters.expertOpinion[0] === "포함"
    ) {
      params.has_trainer_comment = "true";
    }

    return params;
  }, [filters]);

  // 오래기다린순 우선노출로 전체 데이터 가져오기
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAnimals(apiParams);

  // 필터가 변경될 때 스크롤 위치 초기화
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [apiParams]);

  // React Query 데이터에서 직접 동물 목록 추출
  const allAnimals = useMemo(() => {
    if (!data) return [];
    const result = data.pages
      .flatMap((page) => {
        // 백엔드 CustomPageNumberPagination 응답 구조에 맞게 data 필드에서 추출
        return page.data || [];
      })
      .filter((animal) => animal && typeof animal === "object");

    return result;
  }, [data]);

  const loadMoreAnimals = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // 스크롤 이벤트 처리 (디바운싱 적용)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 기존 타이머 클리어
      clearTimeout(timeoutId);

      // 100ms 후에 스크롤 처리 실행
      timeoutId = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // 페이지 하단에서 800px 이내에 도달하면 다음 페이지 로드
        const isNearBottom = scrollTop + windowHeight >= documentHeight - 600;
        if (isNearBottom) {
          loadMoreAnimals();
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loadMoreAnimals]);

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

  // 필터 초기화 함수
  const handleClearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // 모든 필터 파라미터 제거
    params.delete("breed");
    params.delete("weights");
    params.delete("regions");
    params.delete("ages");
    params.delete("genders");
    params.delete("protectionStatus");
    params.delete("expertOpinion");

    // 현재 페이지로 이동 (필터만 제거)
    const queryString = params.toString();
    const targetUrl = queryString ? `?${queryString}` : "";
    router.push(`/list/animal${targetUrl}`, { scroll: false });
  }, [searchParams, router]);

  // 현재 적용된 필터가 있는지 확인
  const hasActiveFilters = useMemo(() => {
    return (
      filters.breed ||
      filters.weights.length > 0 ||
      filters.regions.length > 0 ||
      filters.ages.length > 0 ||
      filters.genders.length > 0 ||
      filters.protectionStatus.length > 0 ||
      filters.expertOpinion.length > 0
    );
  }, [filters]);

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
      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">필터링된 결과</span>
            <button onClick={handleClearFilters} className="text-sm text-gr">
              전체 해제
            </button>
          </div>
        </div>
      )}

      {/* 데이터가 없는 경우 */}
      {allAnimals.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-500">등록된 동물이 없습니다</div>
        </div>
      )}

      <div className="flex flex-wrap justify-start gap-2 cursor-pointer mx-4">
        {allAnimals
          .filter((animal) => animal && animal.id)
          .map((animal) => (
            <AnimalCardWithFavorite
              key={animal.id}
              animal={animal}
              isAuthenticated={isAuthenticated}
              localFavorite={localFavorites[animal.id]}
              onLikeToggle={handleLikeToggle}
              onNavigate={() => router.push(`/list/animal/${animal.id}`)}
            />
          ))}
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
function AnimalCardWithFavorite({
  animal,
  isAuthenticated,
  onLikeToggle,
  localFavorite,
  onNavigate,
}: {
  animal: RawAnimalResponse;
  isAuthenticated: boolean;
  onLikeToggle: (animalId: string) => void;
  localFavorite?: boolean;
  onNavigate: () => void;
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
    <div className="w-[calc(50%-4px)]" onClick={onNavigate}>
      <div className="relative">
        <PetCard
          pet={transformRawAnimalToPetCard(animal)}
          variant="primary"
          imageSize="full"
          className="w-full pb-3"
        />

        {isAuthenticated && (
          <div
            className="absolute bottom-2 right-2"
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              icon={({ size, className }) => (
                <Heart
                  size={size}
                  className={cn(
                    className,
                    isLiked ? "text-brand" : "text-lg",
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
        )}
      </div>
    </div>
  );
}
