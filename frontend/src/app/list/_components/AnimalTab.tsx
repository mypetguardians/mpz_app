"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PetCard } from "@/components/ui/PetCard";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import { transformRawAnimalToPetCard, RawAnimalResponse } from "@/types/animal";

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
    const params: {
      limit: number;
      breed?: string;
      weight?: "10kg_under" | "25kg_under" | "over_25kg";
      region?:
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
      age?: "2_under" | "7_under" | "over_7";
      gender?: "male" | "female";
      status?:
        | "보호중"
        | "입양완료"
        | "무지개다리"
        | "임시보호중"
        | "반환"
        | "방사";
      hasTrainerComment?: "true" | "false";
    } = {
      limit: ITEMS_PER_PAGE,
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
          | "무지개다리"
          | "임시보호중"
          | "반환"
          | "방사";
      } = {
        보호중: "보호중",
        입양완료: "입양완료",
        무지개다리: "무지개다리",
        임시보호중: "임시보호중",
      };
      const statusValue = statusMap[filters.protectionStatus[0]];
      if (statusValue) {
        params.status = statusValue;
      }
    }

    // 전문가 의견 필터
    if (filters.expertOpinion.length > 0) {
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
      console.log("AnimalTab - Full data structure:", data);
      console.log("AnimalTab - First page structure:", data.pages[0]);

      const allAnimalsData = data.pages
        .flatMap((page) => page.data || [])
        .filter((animal) => animal && typeof animal === "object");
      console.log("AnimalTab - Raw animals from API:", allAnimalsData);
      setAllAnimals(allAnimalsData);
    }
  }, [data]);

  const loadMoreAnimals = useCallback(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 1000
      ) {
        loadMoreAnimals();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreAnimals]);

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
