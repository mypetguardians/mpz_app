"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PetCard, PetCardSkeleton, FilterChip } from "@/components/ui";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import {
  transformRawAnimalToPetCard,
  RawAnimalResponse,
  GetAnimalsParams,
} from "@/types/animal";

const ITEMS_PER_PAGE = 20;

function AnimalTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allAnimals, setAllAnimals] = useState<RawAnimalResponse[]>([]);

  // URL 파라미터에서 필터 상태 읽기
  const filters = useMemo(() => {
    return {
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
  }, [searchParams]);

  // 필터 파라미터를 API 요청에 맞게 변환
  const apiParams = useMemo(() => {
    const params: GetAnimalsParams = {
      limit: ITEMS_PER_PAGE,
      sortBy: "waiting_days", // 오래기다린순 정렬
      sortOrder: "desc",
    };

    // 품종 필터
    if (filters.breed) {
      params.breed = filters.breed;
    }

    // 체중 필터 (weights 배열의 첫 번째 값 사용)
    if (filters.weights.length > 0) {
      const weightMap: {
        [key: string]: "10kg_under" | "25kg_under" | "over_25kg";
      } = {
        "10kg 이하": "10kg_under",
        "25kg 이하": "25kg_under",
        "그 이상": "over_25kg",
      };
      const weightValue = weightMap[filters.weights[0]];
      if (weightValue) {
        params.weight = weightValue;
      }
    }

    // 지역 필터 (regions 배열의 첫 번째 값 사용)
    if (filters.regions.length > 0) {
      const regionMap: {
        [key: string]:
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
          | "제주";
      } = {
        서울: "서울",
        부산: "부산",
        대구: "대구",
        인천: "인천",
        광주: "광주",
        대전: "대전",
        울산: "울산",
        세종: "세종",
        경기: "경기",
        강원: "강원",
        충북: "충북",
        충남: "충남",
        전북: "전북",
        전남: "전남",
        경북: "경북",
        경남: "경남",
        제주: "제주",
      };
      const regionValue = regionMap[filters.regions[0]];
      if (regionValue) {
        params.region = regionValue;
      }
    }

    // 나이 필터 (ages 배열의 첫 번째 값 사용)
    if (filters.ages.length > 0) {
      const ageMap: { [key: string]: "2_under" | "7_under" | "over_7" } = {
        "2살 이하": "2_under",
        "7살 이하": "7_under",
        "그 이상": "over_7",
      };
      const ageValue = ageMap[filters.ages[0]];
      if (ageValue) {
        params.age = ageValue;
      }
    }

    // 성별 필터 (genders 배열의 첫 번째 값 사용)
    if (filters.genders.length > 0) {
      const genderMap: { [key: string]: "male" | "female" } = {
        남아: "male",
        여아: "female",
      };
      const genderValue = genderMap[filters.genders[0]];
      if (genderValue) {
        params.gender = genderValue;
      }
    }

    // 보호상태 필터 (protectionStatus 배열의 첫 번째 값 사용)
    if (filters.protectionStatus.length > 0) {
      const statusMap: {
        [key: string]:
          | "보호중"
          | "입양완료"
          | "입양진행중"
          | "임시보호중"
          | "자연사"
          | "안락사"
          | "방사";
      } = {
        보호중: "보호중",
        입양완료: "입양완료",
        입양진행중: "입양진행중",
        임시보호중: "임시보호중",
      };
      const statusValue = statusMap[filters.protectionStatus[0]];
      if (statusValue) {
        params.status = statusValue;
      }

      // 무지개다리 필터가 선택된 경우 자연사나 안락사 중 하나 선택
      if (filters.protectionStatus.includes("무지개다리")) {
        params.status = Math.random() > 0.5 ? "자연사" : "안락사";
      }
    }

    // 전문가 의견 필터
    if (
      filters.expertOpinion.length > 0 &&
      filters.expertOpinion[0] === "포함"
    ) {
      params.hasTrainerComment = "true";
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

  // 데이터가 로드되면 상태 업데이트
  useEffect(() => {
    if (data) {
      const allAnimalsData = data.pages
        .flatMap((page) => {
          // API 응답 구조에 따라 data 또는 animals 필드에서 데이터 추출
          return page.data || page.animals || [];
        })
        .filter((animal) => animal && typeof animal === "object");
      setAllAnimals(allAnimalsData);
    }
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
        if (scrollTop + windowHeight >= documentHeight - 800) {
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

  // 필터 제거 함수
  const handleRemoveFilter = useCallback(
    (filterType: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (filterType === "breed") {
        params.delete("breed");
      } else {
        const currentValues =
          params.get(filterType)?.split(",").filter(Boolean) || [];
        const newValues = currentValues.filter((v) => v !== value);

        if (newValues.length > 0) {
          params.set(filterType, newValues.join(","));
        } else {
          params.delete(filterType);
        }
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `?${queryString}` : "";
      router.push(`/list/animal${targetUrl}`, { scroll: false });
    },
    [searchParams, router]
  );

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

  // 데이터가 없는 경우
  if (allAnimals.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">등록된 동물이 없습니다</div>
      </div>
    );
  }

  return (
    <div>
      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">적용된 필터</span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              전체 해제
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.breed && (
              <FilterChip
                label={filters.breed}
                onRemove={() => handleRemoveFilter("breed", filters.breed)}
              />
            )}
            {filters.weights.map((weight) => (
              <FilterChip
                key={weight}
                label={weight}
                onRemove={() => handleRemoveFilter("weights", weight)}
              />
            ))}
            {filters.regions.map((region) => (
              <FilterChip
                key={region}
                label={region}
                onRemove={() => handleRemoveFilter("regions", region)}
              />
            ))}
            {filters.ages.map((age) => (
              <FilterChip
                key={age}
                label={age}
                onRemove={() => handleRemoveFilter("ages", age)}
              />
            ))}
            {filters.genders.map((gender) => (
              <FilterChip
                key={gender}
                label={gender}
                onRemove={() => handleRemoveFilter("genders", gender)}
              />
            ))}
            {filters.protectionStatus.map((status) => (
              <FilterChip
                key={status}
                label={status}
                onRemove={() => handleRemoveFilter("protectionStatus", status)}
              />
            ))}
            {filters.expertOpinion.map((opinion) => (
              <FilterChip
                key={opinion}
                label={opinion}
                onRemove={() => handleRemoveFilter("expertOpinion", opinion)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-start gap-2 cursor-pointer mx-4">
        {allAnimals
          .filter((animal) => animal && animal.id)
          .map((animal) => (
            <div
              key={animal.id}
              className="w-[calc(50%-4px)]"
              onClick={() => router.push(`/list/animal/${animal.id}`)}
            >
              <PetCard
                pet={transformRawAnimalToPetCard(animal)}
                variant="primary"
                imageSize="full"
                className="w-full"
              />
            </div>
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
