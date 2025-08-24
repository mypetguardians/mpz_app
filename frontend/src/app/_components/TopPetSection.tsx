import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { z } from "zod";
import type { AnimalResponseSchema } from "@/server/openapi/routes/animal";

type Animal = z.infer<typeof AnimalResponseSchema>;

interface PetSectionProps {
  title?: string;
  rightSlot?: string;
  animals: Animal[];
  variant: "primary" | "detail" | "variant3";
  showLocationFilter?: boolean;
  locations?: string[];
  isLoading?: boolean;
  error?: Error | null;
  isExpertAnalysis?: boolean;
  selectedLocation?: string;
  onLocationSelect?: (location: string) => void;
}

export function TopPetSection({
  title,
  rightSlot,
  animals,
  variant,
  showLocationFilter = false,
  locations = [],
  isLoading = false,
  error = null,
  isExpertAnalysis = false,
  selectedLocation,
  onLocationSelect,
}: PetSectionProps) {
  if (isLoading) {
    if (isExpertAnalysis) {
      return (
        <MainSection>
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">동물 정보를 불러오는 중...</div>
          </div>
          <MiniButton
            text="전문가 분석 모아보기"
            variant="filterOff"
            className="py-4"
            rightIcon={<CaretDown size={12} />}
          />
        </MainSection>
      );
    }

    return (
      <div className="mb-8 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Link href="/list/animal">
            {rightSlot && (
              <span className="text-sm text-gray-500 cursor-pointer">
                {rightSlot}
              </span>
            )}
          </Link>
        </div>

        {showLocationFilter && (
          <div className="flex items-center overflow-x-auto gap-[6px] -mx-4 px-4">
            {locations.map((loc) => (
              <MiniButton
                key={loc}
                text={loc}
                variant={selectedLocation === loc ? "filterOn" : "filterOff"}
                onClick={() => {
                  if (selectedLocation === loc) {
                    // 같은 버튼 재클릭 시 필터 해제
                    onLocationSelect?.("");
                  } else {
                    // 다른 지역 선택
                    onLocationSelect?.(loc);
                  }
                }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center h-32">
          <div className="text-lg">동물 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 에러가 발생했을 때는 에러 컴포넌트 표시
  if (error) {
    if (isExpertAnalysis) {
      return (
        <MainSection>
          <div className="flex items-center justify-center h-32">
            <div className="text-lg text-error">
              동물 정보를 불러오는데 실패했습니다.
            </div>
          </div>
          <MiniButton
            text="전문가 분석 모아보기"
            variant="filterOff"
            className="py-4"
            rightIcon={<CaretDown size={12} />}
          />
        </MainSection>
      );
    }

    return (
      <PetSectionError
        title={title || ""}
        rightSlot={rightSlot}
        showLocationFilter={showLocationFilter}
        locations={locations}
        variant={variant}
        selectedLocation={selectedLocation}
        onLocationSelect={onLocationSelect}
      />
    );
  }

  // 지역 필터링
  let filteredAnimals = animals || [];

  // 선택된 지역이 있으면 해당 지역에 포함된 동물만 필터링
  if (selectedLocation && selectedLocation !== "") {
    filteredAnimals = animals.filter((animal) => {
      const animalLocation = animal.foundLocation || "";
      const isMatch = animalLocation.includes(selectedLocation);
      return isMatch;
    });
  }

  const sortedAnimals = (filteredAnimals || [])
    .filter((animal) => animal?.status === "보호중")
    .sort((a, b) => (b.waitingDays || 0) - (a.waitingDays || 0))
    .slice(0, 10);

  // 필터가 적용된 경우 필터링된 결과를 모두 표시, 필터가 없는 경우 상위 10개만 표시
  const displayAnimals =
    selectedLocation && selectedLocation !== ""
      ? sortedAnimals
      : sortedAnimals.slice(0, 10);

  // ExpertAnalysis 모드일 때
  if (isExpertAnalysis) {
    const analysisAnimals = displayAnimals.slice(0, 3);

    return (
      <MainSection>
        <div className="flex flex-col gap-3">
          {analysisAnimals.map((animal) => (
            <PetCard key={animal.id} pet={animal} variant="detail" />
          ))}
        </div>
        <MiniButton
          text="전문가 분석 모아보기"
          variant="filterOff"
          className="py-4"
          rightIcon={<CaretDown size={12} />}
        />
      </MainSection>
    );
  }

  // 일반 PetSection 모드일 때
  return (
    <MainSection title={title} rightSlot={rightSlot}>
      {showLocationFilter && (
        <div className="flex items-center overflow-x-auto gap-[6px] -mx-4 px-4">
          {locations.map((loc) => (
            <MiniButton
              key={loc}
              text={loc}
              variant={selectedLocation === loc ? "filterOn" : "filterOff"}
              onClick={() => {
                if (selectedLocation === loc) {
                  // 같은 버튼 재클릭 시 필터 해제
                  onLocationSelect?.("");
                } else {
                  // 다른 지역 선택
                  onLocationSelect?.(loc);
                }
              }}
            />
          ))}
        </div>
      )}
      <div
        className={`flex gap-3 overflow-x-auto flex-nowrap -mx-4 px-4 ${
          variant === "detail" ? "flex-col" : ""
        } ${
          variant === "variant3"
            ? "grid grid-cols-3 gap-x-2 gap-y-3 flex-nowrap"
            : ""
        }`}
      >
        {displayAnimals.map((animal) => (
          <PetCard key={animal.id} pet={animal} variant={variant} />
        ))}
      </div>
    </MainSection>
  );
}
