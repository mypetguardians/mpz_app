import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { RawAnimalResponse, transformRawAnimalToPetCard } from "@/types/animal";

interface PetSectionProps {
  title: string;
  rightSlot?: string;
  animals: RawAnimalResponse[];
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
  // ExpertAnalysis 모드일 때
  if (isExpertAnalysis) {
    if (isLoading) {
      return (
        <MainSection>
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, index) => (
              <PetCardSkeleton key={index} variant="detail" />
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

    if (error) {
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

    const analysisAnimals = (animals || [])
      .filter((animal) => animal?.status === "보호중")
      .sort((a, b) => {
        if (a.admission_date && b.admission_date) {
          return (
            new Date(b.admission_date).getTime() -
            new Date(a.admission_date).getTime()
          );
        }
        return (b.waiting_days || 0) - (a.waiting_days || 0);
      })
      .slice(0, 3);

    return (
      <MainSection>
        <div className="flex flex-col gap-3">
          {analysisAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              pet={transformRawAnimalToPetCard(animal)}
              variant="detail"
            />
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
  if (error) {
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

  // 보호중인 동물만 필터링하고 admission_date 높은 순서대로 정렬
  const limitedAnimals = (animals || [])
    .filter((animal) => animal?.status === "보호중")
    .sort((a, b) => {
      if (a.admission_date && b.admission_date) {
        return (
          new Date(b.admission_date).getTime() -
          new Date(a.admission_date).getTime()
        );
      }
      return (b.waiting_days || 0) - (a.waiting_days || 0);
    });

  // 지역 필터링
  let filteredAnimals = limitedAnimals;
  if (selectedLocation && selectedLocation !== "") {
    filteredAnimals = limitedAnimals.filter((animal) => {
      const animalLocation = animal.found_location || "";
      return animalLocation.includes(selectedLocation);
    });
  }

  // 필터가 적용된 경우 필터링된 결과를 모두 표시, 필터가 없는 경우 상위 10개만 표시
  const displayAnimals =
    selectedLocation && selectedLocation !== ""
      ? filteredAnimals
      : filteredAnimals.slice(0, 10);

  return (
    <MainSection title={title} rightSlot={rightSlot}>
      {/* 지역 필터 */}
      {showLocationFilter && (
        <div className="flex items-center overflow-x-auto gap-[6px] -mx-4 px-4">
          {locations.map((loc) => (
            <MiniButton
              key={loc}
              text={loc}
              variant={selectedLocation === loc ? "filterOn" : "filterOff"}
              onClick={() => {
                if (selectedLocation === loc) {
                  onLocationSelect?.("");
                } else {
                  onLocationSelect?.(loc);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* 동물 카드 목록 */}
      <div
        className={`flex gap-3 overflow-x-auto flex-nowrap -mx-4 px-4 ${
          variant === "detail" ? "flex-col" : ""
        } ${
          variant === "variant3"
            ? "grid grid-cols-3 gap-x-2 gap-y-3 flex-nowrap"
            : ""
        }`}
      >
        {isLoading
          ? // 스켈레톤 로딩 상태
            [...Array(10)].map((_, index) => (
              <PetCardSkeleton key={index} variant={variant} />
            ))
          : // 실제 데이터 표시
            displayAnimals.map((animal) => (
              <PetCard
                key={animal.id}
                pet={transformRawAnimalToPetCard(animal)}
                variant={variant}
              />
            ))}
      </div>
    </MainSection>
  );
}
