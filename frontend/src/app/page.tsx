"use client";

import { useState } from "react";
import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { HomeHeader } from "@/app/_components/HomeHeader";
import { PetSection } from "@/app/_components/PetSection";
import { TopPetSection } from "@/app/_components/TopPetSection";
import { MatchingSection } from "@/app/_components/MatchingSection";
import { CommunitySection } from "@/app/_components/CommunitySection";
import { FooterSection } from "@/app/_components/FooterSection";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";

import { useAuth } from "@/components/providers/AuthProvider";
import { RawAnimalResponse } from "@/types/animal";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const { aiMatchingResult } = useMatchingStepStore();

  const {
    data: animalsData,
    isLoading,
    error,
  } = useGetAnimals({
    limit: 100,
    sortBy: "admission_date",
    sortOrder: "desc",
  });

  // page.data를 사용하여 데이터 추출 (실제 API 응답 구조)
  const animals: RawAnimalResponse[] =
    animalsData?.pages?.flatMap((page) => {
      return (page as { data?: RawAnimalResponse[] }).data || [];
    }) || [];

  const totalPets = animals.length;

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  return (
    <Container className="pb-20">
      <HomeHeader isLoggedIn={isAuthenticated} />

      <TopPetSection
        title="따듯한 손길을 기다려요"
        rightSlot="모두 보기"
        animals={animals}
        variant="primary"
        showLocationFilter={true}
        locations={[
          "서울",
          "부산",
          "대구",
          "인천",
          "광주",
          "대전",
          "울산",
          "세종",
          "경기",
          "강원",
          "충북",
          "충남",
          "전북",
          "전남",
          "경북",
          "경남",
          "제주",
        ]}
        isLoading={isLoading}
        error={error}
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
      />

      <MatchingSection
        animals={animals}
        variant="variant2"
        isLoading={isLoading}
        error={error}
        isExpertAnalysis={true}
        aiMatchingResult={aiMatchingResult}
      />

      <CommunitySection />

      <PetSection
        title={`총 ${totalPets}명의 아이들이 \n도움을 요청하고 있어요`}
        animals={animals}
        isLoading={isLoading}
        error={error}
      />

      <FooterSection />

      <NavBar />
    </Container>
  );
}
