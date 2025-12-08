"use client";

import { Suspense, useState } from "react";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { InfoCard } from "@/components/ui/InfoCard";
import { FilterState } from "@/lib/filter-utils";
import { useAnimalFiltersStore } from "@/stores/animalFilters";
import { useAnimalFilterOverlayStore } from "@/stores/animalFilterOverlay";
import { SearchBreedList } from "@/data/breedList";

import BreedFilter from "./_components/BreedFilter";
import MultiSelectFilter from "./_components/MultiSelectFilter";
import {
  weightOptions,
  ageOptions,
  genderOptions,
  protectionStatusOptions,
  regionOptions,
} from "@/data/filterOptions";

export function AnimalFilterContent() {
  const { filters, setFilters, reset } = useAnimalFiltersStore();
  const { isOpen, close } = useAnimalFilterOverlayStore();

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
  // protectionStatus가 비어있으면 "입양가능"을 기본값으로 설정
  const defaultProtectionStatus =
    filters.protectionStatus && filters.protectionStatus.length > 0
      ? filters.protectionStatus
      : ["입양가능"];

  const [selectedProtectionStatus, setSelectedProtectionStatus] = useState<
    string[]
  >(defaultProtectionStatus);
  const [selectedExpertOpinion, setSelectedExpertOpinion] = useState<string[]>(
    filters.expertOpinion || []
  );

  const [lastSelectedProtectionStatus, setLastSelectedProtectionStatus] =
    useState<string>(
      defaultProtectionStatus[defaultProtectionStatus.length - 1] || ""
    );

  const handleClose = () => {
    if (isOpen) {
      close();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const handleApply = () => {
    const nextFilters: FilterState = {
      breed: selectedBreed,
      weights: selectedWeights,
      regions: selectedRegions,
      ages: selectedAges,
      genders: selectedGenders,
      protectionStatus: selectedProtectionStatus,
      expertOpinion: selectedExpertOpinion,
    };

    setFilters(nextFilters);
    handleClose();
  };

  const handleReset = () => {
    reset();
    setSelectedBreed("");
    setSelectedWeights([]);
    setSelectedRegions([]);
    setSelectedAges([]);
    setSelectedGenders([]);
    setSelectedProtectionStatus(["입양가능"]);
    setSelectedExpertOpinion([]);
    setLastSelectedProtectionStatus("입양가능");
  };

  const handleProtectionStatusChange = (values: string[]) => {
    const newValue = values.find((v) => !selectedProtectionStatus.includes(v));
    if (newValue) {
      setLastSelectedProtectionStatus(newValue);
    } else if (values.length === 0) {
      setLastSelectedProtectionStatus("");
    } else if (!values.includes(lastSelectedProtectionStatus)) {
      setLastSelectedProtectionStatus(values[values.length - 1]);
    }
    setSelectedProtectionStatus(values);
  };

  return (
    <Container className="min-h-screen bg-wh">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleClose}
            />
            <h4>필터</h4>
          </div>
        }
      />

      <div className="flex flex-col w-full gap-6 px-4 py-3 pb-40">
        <BreedFilter
          breedList={SearchBreedList}
          selectedBreed={selectedBreed}
          setSelectedBreed={setSelectedBreed}
          breedSearchTerm={breedSearchTerm}
          setBreedSearchTerm={setBreedSearchTerm}
          isBreedSheetOpen={isBreedSheetOpen}
          setIsBreedSheetOpen={setIsBreedSheetOpen}
          tempSelectedBreed={tempSelectedBreed}
          setTempSelectedBreed={setTempSelectedBreed}
        />

        <MultiSelectFilter
          title="체중"
          options={weightOptions}
          selectedValues={selectedWeights}
          onSelectionChange={setSelectedWeights}
        />

        <MultiSelectFilter
          title="지역"
          options={regionOptions}
          selectedValues={selectedRegions}
          onSelectionChange={setSelectedRegions}
          layout="grid"
          gridCols={4}
        />

        <MultiSelectFilter
          title="나이"
          options={ageOptions}
          selectedValues={selectedAges}
          onSelectionChange={setSelectedAges}
        />

        <MultiSelectFilter
          title="성별"
          options={genderOptions}
          selectedValues={selectedGenders}
          onSelectionChange={setSelectedGenders}
        />

        <MultiSelectFilter
          title="보호상태"
          options={protectionStatusOptions}
          selectedValues={selectedProtectionStatus}
          onSelectionChange={handleProtectionStatusChange}
        />

        {lastSelectedProtectionStatus === "입양가능" && (
          <InfoCard>가족을 기다리는 동물들입니다.</InfoCard>
        )}
        {lastSelectedProtectionStatus === "🌈" && (
          <InfoCard>안락사, 자연사로 무지개 다리를 건넌 동물들입니다.</InfoCard>
        )}
        {lastSelectedProtectionStatus === "반환" && (
          <InfoCard>원래 주인에게 돌아간 동물들입니다.</InfoCard>
        )}
        {lastSelectedProtectionStatus === "방사" && (
          <InfoCard>자연으로 방사된 동물들입니다.</InfoCard>
        )}
        {lastSelectedProtectionStatus === "입양완료" && (
          <InfoCard>가족을 만난 동물들입니다.</InfoCard>
        )}
      </div>

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

export function AnimalFilterContentWithSuspense() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <AnimalFilterContent />
    </Suspense>
  );
}
