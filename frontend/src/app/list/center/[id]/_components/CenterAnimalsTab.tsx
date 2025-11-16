"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PetCard } from "@/components/ui/PetCard";
import { MiniButton } from "@/components/ui/MiniButton";
import { CaretDown } from "@phosphor-icons/react";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import type { Animal } from "./types";
import { transformRawAnimalToAnimal } from "@/types/animal";
import { useCenterFiltersStore } from "@/stores/centerFilters";

interface CenterAnimalsTabProps {
  showFilters?: boolean;
  centerId: string;
  variant?: "simple" | "detailed";
  className?: string;
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
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const { filters, reset } = useCenterFiltersStore();

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

  // 필터는 zustand 전역 상태에서 읽음
  const activeFilters = useMemo(() => {
    if (!showFilters) return null;
    return filters;
  }, [filters, showFilters]);

  // URL/로컬스토리지 동기화 제거 (zustand persist 사용)

  // 필터링 로직을 별도 함수로 분리
  const applyFilters = useMemo(() => {
    if (!animals || !activeFilters) return animals || [];

    return animals.filter((animal) => {
      // 품종 필터
      if (activeFilters.breed && animal.breed !== activeFilters.breed) {
        return false;
      }

      // 체중 필터
      if (activeFilters.weights.length > 0) {
        const weight = animal.weight;
        if (weight) {
          const weightValue = activeFilters.weights[0];
          if (weightValue === "10kg 이하" && weight > 10) return false;
          if (weightValue === "25kg 이하" && weight > 25) return false;
          if (weightValue === "그 이상" && weight <= 25) return false;
        }
      }

      // 나이 필터
      if (activeFilters.ages.length > 0) {
        const age = animal.age;
        if (age) {
          const ageValue = activeFilters.ages[0];
          if (ageValue === "2살 이하" && age > 2) return false;
          if (ageValue === "7살 이하" && age > 7) return false;
          if (ageValue === "그 이상" && age <= 7) return false;
        }
      }

      // 성별 필터
      if (activeFilters.genders.length > 0) {
        const isFemale = animal.isFemale;
        const gender = isFemale ? "여아" : "남아";
        if (!activeFilters.genders.includes(gender)) {
          return false;
        }
      }

      // 보호상태 필터
      if (activeFilters.protectionStatus.length > 0) {
        const status = animal.status;
        if (status && !activeFilters.protectionStatus.includes(status)) {
          return false;
        }
      }

      // 전문가 의견 필터
      if (activeFilters.expertOpinion.length > 0) {
        if (!animal.trainerComment) {
          return false;
        }
      }

      return true;
    });
  }, [animals, activeFilters]);

  // 필터링된 동물 목록 상태 업데이트
  useEffect(() => {
    setFilteredAnimals(applyFilters);
  }, [applyFilters]);

  // 필터 옵션들
  const filterOptions = useMemo((): FilterOption[] => {
    if (!showFilters || !activeFilters) return [];

    return [
      {
        label: "품종",
        path: `/list/center/${centerId}/filter`,
        count: activeFilters.breed ? 1 : 0,
        hasFilters: !!activeFilters.breed,
      },
      {
        label: "체중",
        path: `/list/center/${centerId}/filter`,
        count: activeFilters.weights.length,
        hasFilters: activeFilters.weights.length > 0,
      },
      {
        label: "성별",
        path: `/list/center/${centerId}/filter`,
        count: activeFilters.genders.length,
        hasFilters: activeFilters.genders.length > 0,
      },
      {
        label: "나이",
        path: `/list/center/${centerId}/filter`,
        count: activeFilters.ages.length,
        hasFilters: activeFilters.ages.length > 0,
      },
      {
        label: "보호상태",
        path: `/list/center/${centerId}/filter`,
        count: activeFilters.protectionStatus.length,
        hasFilters: activeFilters.protectionStatus.length > 0,
      },
    ];
  }, [showFilters, activeFilters, centerId]);

  const handleFilterClick = (path: string) => {
    // 전역 상태를 사용하므로 쿼리 전달 불필요
    router.push(path);
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
    reset();
    // 탭 유지하며 현재 페이지 새로고침 없이 상태만 반영
    // 필요 시 animals 탭으로 이동
    router.push(`/list/center/${centerId}?tab=animals`);
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
