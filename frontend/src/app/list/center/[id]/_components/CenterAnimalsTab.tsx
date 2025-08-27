"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PetCard } from "@/components/ui/PetCard";
import { MiniButton } from "@/components/ui/MiniButton";
import { CaretDown } from "@phosphor-icons/react";
import type { Animal } from "./types";

interface CenterAnimalsTabProps {
  animals: Animal[];
  isLoading: boolean;
  showFilters?: boolean;
  centerId?: string;
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
  animals,
  isLoading,
  showFilters = false,
  centerId,
  variant = "simple",
  className = "",
}: CenterAnimalsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);

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
        {variant === "simple"
          ? "현재 보호 중인 동물이 없습니다."
          : "등록된 동물이 없습니다"}
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
            pet={animal}
            variant="detail"
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
            pet={animal}
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

  // 데이터가 없는 경우
  if (filteredAnimals.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className={`px-4 ${className}`}>
      {renderFilterOptions()}

      {variant === "simple" ? renderSimpleView() : renderDetailedView()}
    </div>
  );
}
