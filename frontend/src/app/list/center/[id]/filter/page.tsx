"use client";

import { useState, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { InfoCard } from "@/components/ui/InfoCard";
import { FilterState } from "@/lib/filter-utils";
import { useCenterFiltersStore } from "@/stores/centerFilters";

import BreedFilter from "./_components/BreedFilter";
import MultiSelectFilter from "./_components/MultiSelectFilter";
import {
  weightOptions,
  ageOptions,
  genderOptions,
  protectionStatusOptions,
  //expertOpinionOptions,
} from "@/data/filterOptions";

function CenterFilterContent() {
  const router = useRouter();
  const { filters, setFilters, reset } = useCenterFiltersStore();

  // 센터 ID 추출 (URL에서) - 컴포넌트 가장 시작에 선언
  const centerId = useMemo(() => {
    return window.location.pathname.split("/")[3];
  }, []);

  const [selectedBreed, setSelectedBreed] = useState(filters.breed || "");
  const [breedSearchTerm, setBreedSearchTerm] = useState("");
  const [isBreedSheetOpen, setIsBreedSheetOpen] = useState(false);
  const [tempSelectedBreed, setTempSelectedBreed] = useState(
    filters.breed || ""
  );

  const [selectedWeights, setSelectedWeights] = useState<string[]>(
    filters.weights || []
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    filters.regions || []
  );
  const [selectedAges, setSelectedAges] = useState<string[]>(
    filters.ages || []
  );
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    filters.genders || []
  );
  const [selectedProtectionStatus, setSelectedProtectionStatus] = useState<
    string[]
  >(filters.protectionStatus || []);
  const [selectedExpertOpinion, setSelectedExpertOpinion] = useState<string[]>(
    filters.expertOpinion || []
  );

  // URL/로컬스토리지 복원 로직 제거: zustand persist로 일원화

  // URL 동기화/디바운스 제거

  const handleBack = () => {
    router.push(`/list/center/${centerId}?tab=centers`);
  };

  const handleApply = () => {
    const next: FilterState = {
      breed: selectedBreed,
      weights: selectedWeights,
      regions: selectedRegions,
      ages: selectedAges,
      genders: selectedGenders,
      protectionStatus: selectedProtectionStatus,
      expertOpinion: selectedExpertOpinion,
    };
    setFilters(next);
    router.push(`/list/center/${centerId}?tab=centers`);
  };

  const handleReset = () => {
    // 전역 상태 및 로컬 상태 초기화
    reset();
    setSelectedBreed("");
    setSelectedWeights([]);
    setSelectedRegions([]);
    setSelectedAges([]);
    setSelectedGenders([]);
    setSelectedProtectionStatus([]);
    setSelectedExpertOpinion([]);
  };

  // 보호상태 선택 여부 확인
  const isReturnSelected = selectedProtectionStatus.includes("반환");
  const isRadiationSelected = selectedProtectionStatus.includes("방사");

  return (
    <Container className="min-h-screen bg-wh">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>필터</h4>
          </div>
        }
      />
      <div className="flex flex-col w-full gap-6 px-4 py-3 pb-24">
        {/* 품종 (Breed) */}
        <BreedFilter
          selectedBreed={selectedBreed}
          setSelectedBreed={setSelectedBreed}
          breedSearchTerm={breedSearchTerm}
          setBreedSearchTerm={setBreedSearchTerm}
          isBreedSheetOpen={isBreedSheetOpen}
          setIsBreedSheetOpen={setIsBreedSheetOpen}
          tempSelectedBreed={tempSelectedBreed}
          setTempSelectedBreed={setTempSelectedBreed}
        />

        {/* 체중 (Weight) */}
        <MultiSelectFilter
          title="체중"
          options={weightOptions}
          selectedValues={selectedWeights}
          onSelectionChange={setSelectedWeights}
        />

        {/* 나이 (Age) */}
        <MultiSelectFilter
          title="나이"
          options={ageOptions}
          selectedValues={selectedAges}
          onSelectionChange={setSelectedAges}
        />

        {/* 성별 (Gender) */}
        <MultiSelectFilter
          title="성별"
          options={genderOptions}
          selectedValues={selectedGenders}
          onSelectionChange={setSelectedGenders}
        />

        {/* 보호상태 (Protection Status) */}
        <MultiSelectFilter
          title="보호상태"
          options={protectionStatusOptions}
          selectedValues={selectedProtectionStatus}
          onSelectionChange={setSelectedProtectionStatus}
        />

        {/* 반환, 방사 선택 시 InfoCard 표시 */}
        {isReturnSelected && (
          <InfoCard>원래 주인에게 돌아간 센터에요.</InfoCard>
        )}
        {isRadiationSelected && (
          <InfoCard>
            동물의 생존이나 구조 목적, 예외적 상황에 따라 자연으로 돌려보낸
            센터에요.
          </InfoCard>
        )}

        {/* 전문가 분석 의견 (Expert Analysis Opinion) */}
        {/* <MultiSelectFilter
          title="전문가 분석 의견"
          options={expertOpinionOptions}
          selectedValues={selectedExpertOpinion}
          onSelectionChange={setSelectedExpertOpinion}
        /> */}
      </div>

      {/* Fixed Bottom Bar */}
      <FixedBottomBar
        variant="variant2"
        resetButtonText="재설정"
        resetButtonLeft={<ArrowsClockwise />}
        onResetButtonClick={handleReset}
        applyButtonText="적용하기"
        onApplyButtonClick={handleApply}
      />
    </Container>
  );
}

export default function CenterFilter() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <CenterFilterContent />
    </Suspense>
  );
}
