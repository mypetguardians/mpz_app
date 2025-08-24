"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { InfoCard } from "@/components/ui/InfoCard";
import { location } from "@/app/mock";
import { FilterState } from "@/lib/filter-utils";

import BreedFilter from "./_components/BreedFilter";
import MultiSelectFilter from "./_components/MultiSelectFilter";
import {
  weightOptions,
  ageOptions,
  genderOptions,
  protectionStatusOptions,
  expertOpinionOptions,
} from "@/app/mock";
import { useGetMyCenter } from "@/hooks/query/useGetMyCenter";

function AnimalFilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: center } = useGetMyCenter();
  const isSubscriber = center?.isSubscriber;

  const [selectedBreed, setSelectedBreed] = useState("");
  const [breedSearchTerm, setBreedSearchTerm] = useState("");
  const [isBreedSheetOpen, setIsBreedSheetOpen] = useState(false);
  const [tempSelectedBreed, setTempSelectedBreed] = useState("");

  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedProtectionStatus, setSelectedProtectionStatus] = useState<
    string[]
  >([]);
  const [selectedExpertOpinion, setSelectedExpertOpinion] = useState<string[]>(
    []
  );

  // URL 파라미터에서 기존 필터 상태 읽기
  useEffect(() => {
    const breed = searchParams.get("breed") || "";
    const weights =
      searchParams.get("weights")?.split(",").filter(Boolean) || [];
    const regions =
      searchParams.get("regions")?.split(",").filter(Boolean) || [];
    const ages = searchParams.get("ages")?.split(",").filter(Boolean) || [];
    const genders =
      searchParams.get("genders")?.split(",").filter(Boolean) || [];
    const protectionStatus =
      searchParams.get("protectionStatus")?.split(",").filter(Boolean) || [];
    const expertOpinion =
      searchParams.get("expertOpinion")?.split(",").filter(Boolean) || [];

    setSelectedBreed(breed);
    setSelectedWeights(weights);
    setSelectedRegions(regions);
    setSelectedAges(ages);
    setSelectedGenders(genders);
    setSelectedProtectionStatus(protectionStatus);
    setSelectedExpertOpinion(expertOpinion);
  }, [searchParams]);

  // URL 업데이트 함수
  // URL 업데이트 함수
  const updateURL = useCallback(
    (filters: FilterState) => {
      const params = new URLSearchParams(searchParams.toString());

      if (filters.breed) params.set("breed", filters.breed);
      else params.delete("breed");

      if (filters.weights.length > 0)
        params.set("weights", filters.weights.join(","));
      else params.delete("weights");

      if (filters.regions.length > 0)
        params.set("regions", filters.regions.join(","));
      else params.delete("regions");

      if (filters.ages.length > 0) params.set("ages", filters.ages.join(","));
      else params.delete("ages");

      if (filters.genders.length > 0)
        params.set("genders", filters.genders.join(","));
      else params.delete("genders");

      if (filters.protectionStatus.length > 0)
        params.set("protectionStatus", filters.protectionStatus.join(","));
      else params.delete("protectionStatus");

      if (filters.expertOpinion.length > 0)
        params.set("expertOpinion", filters.expertOpinion.join(","));
      else params.delete("expertOpinion");

      const queryString = params.toString();
      const targetUrl = queryString
        ? `/list/animal/filter?${queryString}`
        : "/list/animal/filter";

      router.push(targetUrl, { scroll: false });
    },
    [searchParams, router]
  );

  // 필터 상태 변경 시 URL 업데이트
  useEffect(() => {
    const filters: FilterState = {
      breed: selectedBreed,
      weights: selectedWeights,
      regions: selectedRegions,
      ages: selectedAges,
      genders: selectedGenders,
      protectionStatus: selectedProtectionStatus,
      expertOpinion: selectedExpertOpinion,
    };

    updateURL(filters);
  }, [
    selectedBreed,
    selectedWeights,
    selectedRegions,
    selectedAges,
    selectedGenders,
    selectedProtectionStatus,
    selectedExpertOpinion,
    updateURL,
  ]);

  const handleBack = () => {
    router.back();
  };

  const handleApply = () => {
    const filters: FilterState = {
      breed: selectedBreed,
      weights: selectedWeights,
      regions: selectedRegions,
      ages: selectedAges,
      genders: selectedGenders,
      protectionStatus: selectedProtectionStatus,
      expertOpinion: selectedExpertOpinion,
    };

    // URL 파라미터로 필터 상태 저장
    const params = new URLSearchParams();

    if (filters.breed) params.set("breed", filters.breed);
    if (filters.weights.length > 0)
      params.set("weights", filters.weights.join(","));
    if (filters.regions.length > 0)
      params.set("regions", filters.regions.join(","));
    if (filters.ages.length > 0) params.set("ages", filters.ages.join(","));
    if (filters.genders.length > 0)
      params.set("genders", filters.genders.join(","));
    if (filters.protectionStatus.length > 0)
      params.set("protectionStatus", filters.protectionStatus.join(","));
    if (filters.expertOpinion.length > 0)
      params.set("expertOpinion", filters.expertOpinion.join(","));

    const queryString = params.toString();
    const targetUrl = queryString
      ? `/list/animal?${queryString}`
      : "/list/animal";

    router.push(targetUrl);
  };

  const handleReset = () => {
    setSelectedBreed("");
    setSelectedWeights([]);
    setSelectedRegions([]);
    setSelectedAges([]);
    setSelectedGenders([]);
    setSelectedProtectionStatus([]);
    setSelectedExpertOpinion([]);
  };

  const isRadiationSelected = selectedProtectionStatus.includes("방사");
  const isReturnSelected = selectedProtectionStatus.includes("반환");

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

      <div className="flex flex-col w-full px-4 py-3 gap-6 pb-20">
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

        {/* 지역 (Region) */}
        <MultiSelectFilter
          title="지역"
          options={location}
          selectedValues={selectedRegions}
          onSelectionChange={setSelectedRegions}
          layout="grid"
          gridCols={4}
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
          <InfoCard>원래 주인에게 돌아간 아이에요.</InfoCard>
        )}
        {isRadiationSelected && (
          <InfoCard>
            동물의 생존이나 구조 목적, 예외적 상황에 따라 자연으로 돌려보낸
            아이에요.
          </InfoCard>
        )}

        {/* 전문가 분석 의견 (Expert Analysis Opinion) */}
        {/* 구독자용 디자인 추가 필요 */}
        {isSubscriber && (
          <MultiSelectFilter
            title="전문가 분석 의견"
            options={expertOpinionOptions}
            selectedValues={selectedExpertOpinion}
            onSelectionChange={setSelectedExpertOpinion}
          />
        )}
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

export default function AnimalFilter() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <AnimalFilterContent />
    </Suspense>
  );
}
