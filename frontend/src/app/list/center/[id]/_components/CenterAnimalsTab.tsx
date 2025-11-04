"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PetCard } from "@/components/ui/PetCard";
import { MiniButton } from "@/components/ui/MiniButton";
import { CaretDown } from "@phosphor-icons/react";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import type { Animal } from "./types";
import { transformRawAnimalToAnimal } from "@/types/animal";

interface CenterAnimalsTabProps {
  showFilters?: boolean;
  centerId: string;
  variant?: "simple" | "detailed";
  className?: string;
}

interface FilterState {
  breed: string;
  weights: string[];
  regions: string[];
  ages: string[];
  genders: string[];
  protectionStatus: string[];
  expertOpinion: string[];
}

interface FilterOption {
  label: string;
  path: string;
  count: number;
  hasFilters: boolean;
}

export function CenterAnimalsTab({
  showFilters = false,
  centerId,
  variant = "simple",
  className = "",
}: CenterAnimalsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const STORAGE_KEY = useMemo(() => `center_filters_${centerId}`, [centerId]);

  // 센터 동물 데이터 가져오기
  const {
    data: animalsData,
    isLoading,
    error,
  } = useGetAnimals({
    center_id: centerId,
    page: 1,
    page_size: 50,
  });

  // animals 배열을 useMemo로 감싸서 성능 최적화
  const animals = useMemo(() => {
    if (!animalsData?.pages) return [];
    return animalsData.pages.flatMap((page) =>
      (page.data || []).map(transformRawAnimalToAnimal)
    );
  }, [animalsData]);

  // URL 파라미터에서 필터 상태 읽기
  const filters = useMemo((): FilterState | null => {
    if (!showFilters) return null;

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
  }, [searchParams, showFilters]);

  // 필터 상태를 로컬 스토리지에 저장
  useEffect(() => {
    if (!showFilters) return;
    const params = new URLSearchParams(searchParams.toString());
    const state: FilterState = {
      breed: params.get("breed") || "",
      weights: params.get("weights")?.split(",").filter(Boolean) || [],
      regions: params.get("regions")?.split(",").filter(Boolean) || [],
      ages: params.get("ages")?.split(",").filter(Boolean) || [],
      genders: params.get("genders")?.split(",").filter(Boolean) || [],
      protectionStatus:
        params.get("protectionStatus")?.split(",").filter(Boolean) || [],
      expertOpinion:
        params.get("expertOpinion")?.split(",").filter(Boolean) || [],
    };
    // 하나라도 값이 있으면 저장, 모두 비어있으면 삭제
    const hasAny =
      state.breed ||
      state.weights.length ||
      state.regions.length ||
      state.ages.length ||
      state.genders.length ||
      state.protectionStatus.length ||
      state.expertOpinion.length;
    try {
      if (hasAny) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error(error);
      // 저장 실패는 무시
    }
  }, [searchParams, showFilters, STORAGE_KEY]);

  // 재진입 시(초기 로드) URL에 필터가 없고, 저장된 상태가 있으면 복원
  useEffect(() => {
    if (!showFilters) return;
    const hasAnyParam = [
      "breed",
      "weights",
      "regions",
      "ages",
      "genders",
      "protectionStatus",
      "expertOpinion",
    ].some((key) => searchParams.get(key));
    if (hasAnyParam) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: FilterState = JSON.parse(raw);
      const params = new URLSearchParams(searchParams.toString());
      if (saved.breed) params.set("breed", saved.breed);
      if (saved.weights.length) params.set("weights", saved.weights.join(","));
      if (saved.regions.length) params.set("regions", saved.regions.join(","));
      if (saved.ages.length) params.set("ages", saved.ages.join(","));
      if (saved.genders.length) params.set("genders", saved.genders.join(","));
      if (saved.protectionStatus.length)
        params.set("protectionStatus", saved.protectionStatus.join(","));
      if (saved.expertOpinion.length)
        params.set("expertOpinion", saved.expertOpinion.join(","));
      params.set("tab", "animals");
      const query = params.toString();
      router.replace(`/list/center/${centerId}${query ? `?${query}` : ""}`);
    } catch (error) {
      console.error(error);
    }
  }, [showFilters, STORAGE_KEY, centerId, router, searchParams]);

  // 필터링 로직을 별도 함수로 분리
  const applyFilters = useMemo(() => {
    if (!animals || !filters) return animals || [];

    return animals.filter((animal) => {
      // 품종 필터
      if (filters.breed && animal.breed !== filters.breed) {
        return false;
      }

      // 체중 필터
      if (filters.weights.length > 0) {
        const weight = animal.weight;
        if (weight) {
          const weightValue = filters.weights[0];
          if (weightValue === "10kg 이하" && weight > 10) return false;
          if (weightValue === "25kg 이하" && weight > 25) return false;
          if (weightValue === "그 이상" && weight <= 25) return false;
        }
      }

      // 지역 필터
      if (filters.regions.length > 0) {
        const location = animal.foundLocation;
        if (location && !filters.regions.includes(location)) {
          return false;
        }
      }

      // 나이 필터
      if (filters.ages.length > 0) {
        const age = animal.age;
        if (age) {
          const ageValue = filters.ages[0];
          if (ageValue === "2살 이하" && age > 2) return false;
          if (ageValue === "7살 이하" && age > 7) return false;
          if (ageValue === "그 이상" && age <= 7) return false;
        }
      }

      // 성별 필터
      if (filters.genders.length > 0) {
        const isFemale = animal.isFemale;
        const gender = isFemale ? "여아" : "남아";
        if (!filters.genders.includes(gender)) {
          return false;
        }
      }

      // 보호상태 필터
      if (filters.protectionStatus.length > 0) {
        const status = animal.status;
        if (status && !filters.protectionStatus.includes(status)) {
          return false;
        }
      }

      // 전문가 의견 필터
      if (filters.expertOpinion.length > 0) {
        if (!animal.trainerComment) {
          return false;
        }
      }

      return true;
    });
  }, [animals, filters]);

  // 필터링된 동물 목록 상태 업데이트
  useEffect(() => {
    setFilteredAnimals(applyFilters);
  }, [applyFilters]);

  // 필터 옵션들
  const filterOptions = useMemo((): FilterOption[] => {
    if (!showFilters || !filters) return [];

    return [
      {
        label: "지역",
        path: `/list/center/${centerId}/filter`,
        count: filters.regions.length,
        hasFilters: filters.regions.length > 0,
      },
      {
        label: "품종",
        path: `/list/center/${centerId}/filter`,
        count: filters.breed ? 1 : 0,
        hasFilters: !!filters.breed,
      },
      {
        label: "체중",
        path: `/list/center/${centerId}/filter`,
        count: filters.weights.length,
        hasFilters: filters.weights.length > 0,
      },
      {
        label: "성별",
        path: `/list/center/${centerId}/filter`,
        count: filters.genders.length,
        hasFilters: filters.genders.length > 0,
      },
      {
        label: "나이",
        path: `/list/center/${centerId}/filter`,
        count: filters.ages.length,
        hasFilters: filters.ages.length > 0,
      },
      {
        label: "보호상태",
        path: `/list/center/${centerId}/filter`,
        count: filters.protectionStatus.length,
        hasFilters: filters.protectionStatus.length > 0,
      },
    ];
  }, [showFilters, filters, centerId]);

  const handleFilterClick = (path: string) => {
    // 현재 적용 중인 필터 쿼리를 필터 페이지로 전달하여 재진입 시 상태 유지
    const current = new URLSearchParams(searchParams.toString());
    const passthroughKeys = [
      "breed",
      "weights",
      "regions",
      "ages",
      "genders",
      "protectionStatus",
      "expertOpinion",
    ];
    const params = new URLSearchParams();
    passthroughKeys.forEach((key) => {
      const value = current.get(key);
      if (value) params.set(key, value);
    });
    const query = params.toString();
    router.push(`${path}${query ? `?${query}` : ""}`);
  };

  const renderLoadingState = () => (
    <div className={`px-4 py-8 ${className}`}>
      <div className="text-center text-gray-500">
        동물 정보를 불러오는 중...
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className={`px-4 py-8 ${className}`}>
      <div className="text-center text-gray-500">
        {error ? (
          <div>
            <div className="mb-2">동물 정보를 불러오는데 실패했습니다.</div>
            <div className="text-sm text-red-500">{error.message}</div>
          </div>
        ) : (
          <>
            <div className="mb-3">조건에 해당하는 동물이 없습니다.</div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-gray-600 underline"
            >
              필터 초기화
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderFilterOptions = () =>
    showFilters &&
    filterOptions.length > 0 && (
      <div className="pb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => (
            <MiniButton
              key={option.label}
              text={`${option.label}${
                option.count > 0 ? ` ${option.count}` : ""
              }`}
              rightIcon={<CaretDown size={12} />}
              variant={option.hasFilters ? "filterOn" : "filterOff"}
              onClick={() => handleFilterClick(option.path)}
              className="flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );

  const renderSimpleView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        보호 중인 동물 ({filteredAnimals.length}마리)
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {filteredAnimals.map((animal) => (
          <PetCard
            key={animal.id}
            pet={{
              id: animal.id,
              name: animal.name || "",
              breed: animal.breed || "",
              isFemale: animal.isFemale,
              protection_status: animal.protection_status || "보호중",
              adoption_status: animal.adoption_status || "입양가능",
              centerId: animal.centerId,
              animalImages: animal.animalImages || [],
              foundLocation: animal.foundLocation || "",
            }}
            variant="variant2"
            className="w-full"
          />
        ))}
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="flex flex-wrap justify-start gap-2 cursor-pointer">
      {filteredAnimals.map((animal, idx) => (
        <div
          key={animal.id ?? idx}
          className="w-[calc(50%-4px)]"
          onClick={() => router.push(`/list/animal/${animal.id}`)}
        >
          <PetCard
            pet={{
              id: animal.id,
              name: animal.name || "",
              breed: animal.breed || "",
              isFemale: animal.isFemale,
              protection_status: animal.protection_status || "보호중",
              adoption_status: animal.adoption_status || "입양가능",
              centerId: animal.centerId,
              animalImages: animal.animalImages || [],
              foundLocation: animal.foundLocation || "",
            }}
            variant="primary"
            imageSize="full"
            className="w-full"
          />
        </div>
      ))}
    </div>
  );

  // 로딩 상태 처리
  if (isLoading) {
    return renderLoadingState();
  }

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    [
      "breed",
      "weights",
      "regions",
      "ages",
      "genders",
      "protectionStatus",
      "expertOpinion",
    ].forEach((key) => params.delete(key));
    params.set("tab", "animals");
    const query = params.toString();
    router.push(`/list/center/${centerId}${query ? `?${query}` : ""}`);
  };

  return (
    <div className={`px-4 ${className}`}>
      {renderFilterOptions()}

      {filteredAnimals.length === 0
        ? renderEmptyState()
        : variant === "simple"
        ? renderSimpleView()
        : renderDetailedView()}
    </div>
  );
}
