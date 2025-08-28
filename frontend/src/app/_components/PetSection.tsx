import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { RawAnimalResponse, transformRawAnimalToPetCard } from "@/types/animal";
import { PetCardVariant } from "@/types/petcard";

interface PetSectionProps {
  title: string;
  rightSlot?: string;
  animals: RawAnimalResponse[];
  variant: PetCardVariant;
  showLocationFilter?: boolean;
  locations?: string[];
  isLoading?: boolean;
  error?: Error | null;
  isExpertAnalysis?: boolean;
}

export function PetSection({
  title,
  rightSlot,
  animals,
  variant,
  showLocationFilter = false,
  locations = [],
  isLoading = false,
  error = null,
  isExpertAnalysis = false,
}: PetSectionProps) {
  // 로딩 중일 때는 스켈레톤 표시
  if (isLoading) {
    if (isExpertAnalysis) {
      return (
        <MainSection>
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, index) => (
              <PetCardSkeleton key={index} variant="variant2" />
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

    return (
      <div className="mb-8 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Link href="/list/animal">
            {rightSlot && (
              <span className="text-sm text-gray-500">{rightSlot}</span>
            )}
          </Link>
        </div>

        {showLocationFilter && (
          <div className="flex items-center overflow-x-auto gap-[6px]">
            {locations.map((loc) => (
              <MiniButton key={loc} text={loc} variant="outline" />
            ))}
          </div>
        )}

        <div
          className={`flex gap-3 overflow-x-auto flex-nowrap -mx-4 px-4 ${
            variant === "variant2" ? "flex-col" : ""
          } ${
            variant === "variant3"
              ? "grid grid-cols-3 gap-x-2 gap-y-3 flex-nowrap"
              : ""
          }`}
        >
          {[...Array(6)].map((_, index) => (
            <PetCardSkeleton key={index} variant={variant} />
          ))}
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
      />
    );
  }

  // 보호중인 동물만 필터링하고 admission_date 높은 순서대로 정렬, 상위 6개만 표시
  const limitedAnimals = (animals || [])
    .filter((animal) => animal?.status === "보호중")
    .sort((a, b) => {
      // admission_date가 있으면 admission_date 기준으로 정렬, 없으면 waiting_days 기준
      if (a.admission_date && b.admission_date) {
        return (
          new Date(b.admission_date).getTime() -
          new Date(a.admission_date).getTime()
        );
      }
      // admission_date가 없는 경우 waiting_days 기준
      return (b.waiting_days || 0) - (a.waiting_days || 0);
    })
    .slice(0, 6);

  // ExpertAnalysis 모드일 때
  if (isExpertAnalysis) {
    const analysisAnimals = limitedAnimals.slice(0, 3);

    return (
      <MainSection>
        <div className="flex flex-col gap-3">
          {analysisAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              pet={transformRawAnimalToPetCard(animal)}
              variant="variant2"
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
  return (
    <MainSection title={title} rightSlot={rightSlot}>
      {showLocationFilter && (
        <div className="flex items-center overflow-x-auto gap-[6px] -mx-4 px-4">
          {locations.map((loc) => (
            <MiniButton
              key={loc}
              text={loc}
              variant="outline"
              className="flex-shrink-0"
            />
          ))}
        </div>
      )}
      <div
        className={`flex gap-3 overflow-x-auto flex-nowrap -mx-4 px-4 ${
          variant === "variant2" ? "flex-col" : ""
        } ${
          variant === "variant3"
            ? "grid grid-cols-3 gap-x-2 gap-y-3 flex-nowrap"
            : ""
        }`}
      >
        {limitedAnimals.map((animal) => (
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
