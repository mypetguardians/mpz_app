"use client";

import { useState } from "react";

import NextImage from "next/image";
import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { HomeHeader } from "@/app/_components/HomeHeader";
import { PetSection } from "@/app/_components/PetSection";
import { TopPetSection } from "@/app/_components/TopPetSection";
//import { MatchingSection } from "@/app/_components/MatchingSection";
import { CommunitySection } from "@/app/_components/CommunitySection";
import { FooterSection } from "@/app/_components/FooterSection";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import { useGetBanners } from "@/hooks/query/useGetBanners";
//import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { RawAnimalResponse } from "@/types/animal";
//import { AIRecommendResponse } from "@/types/ai-matching";
import {
  //checkMatchingCompletion,
  clearMatchingData,
} from "@/lib/storage-utils";
import { useRouter } from "next/navigation";
import { Banner } from "@/components/ui/Banner";
import { BottomSheet } from "@/components/ui/BottomSheet";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const kakaoChannelUrl = "http://pf.kakao.com/_mbxbDn/chat";
  const [selectedLocation, setSelectedLocation] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("homeLocationFilter") || "";
    }
    return "";
  });
  // 메인 배너는 공통 로직 컴포넌트로 대체
  const [showMatchingNotification, setShowMatchingNotification] =
    useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  //const { aiMatchingResult, setAIMatchingResult } = useMatchingStepStore();
  const { isLoading: bannerLoading } = useGetBanners({ type: "main" });

  // TopPetSection용 쿼리 - admission_date 오래된 순
  const {
    data: topSectionData,
    isLoading: isTopSectionLoading,
    error: topSectionError,
  } = useGetAnimals({
    page_size: 100,
    sort_by: "admission_date",
    sort_order: "asc",
    region: selectedLocation || undefined,
  });

  // PetSection용 쿼리 - megaphone_count 순
  const {
    data: petSectionData,
    isLoading: isPetSectionLoading,
    error: petSectionError,
  } = useGetAnimals({
    page_size: 100,
    sort_by: "megaphone_count",
    sort_order: "desc",
    region: selectedLocation || undefined,
  });

  const topSectionAnimals: RawAnimalResponse[] =
    topSectionData?.pages?.flatMap((page) => {
      return (page as { data?: RawAnimalResponse[] }).data || [];
    }) || [];

  const petSectionAnimals: RawAnimalResponse[] =
    petSectionData?.pages?.flatMap((page) => {
      return (page as { data?: RawAnimalResponse[] }).data || [];
    }) || [];

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    if (typeof window !== "undefined") {
      if (location) {
        localStorage.setItem("homeLocationFilter", location);
      } else {
        localStorage.removeItem("homeLocationFilter");
      }
    }
  };

  // 매칭 완료 상태 확인 및 알림 표시
  // useEffect(() => {
  //   const matchingStatus = checkMatchingCompletion();

  //   if (matchingStatus.isCompleted && matchingStatus.result) {
  //     // 매칭 결과를 스토어에 저장
  //     setAIMatchingResult(matchingStatus.result as AIRecommendResponse);
  //     setShowMatchingNotification(true);

  //     // 5초 후 알림 자동 숨김
  //     const timer = setTimeout(() => {
  //       setShowMatchingNotification(false);
  //       clearMatchingData(); // 스토리지 정리
  //     }, 5000);

  //     return () => clearTimeout(timer);
  //   } else if (matchingStatus.error) {
  //     // 매칭 실패 시 에러 알림
  //     console.error("매칭 처리 중 오류가 발생했습니다.");
  //     clearMatchingData();
  //   }
  // }, [setAIMatchingResult]);

  const handleMatchingNotificationClick = () => {
    setShowMatchingNotification(false);
    clearMatchingData();
    router.push("/matching/result");
  };

  const handleConsultClick = () => {
    setShowConsultModal(true);
  };

  const handleConfirmConsult = () => {
    setShowConsultModal(false);
    if (typeof window !== "undefined") {
      window.open(kakaoChannelUrl, "_blank", "noopener,noreferrer");
    }
  };

  // 캐러셀 로직 제거

  return (
    <Container>
      <HomeHeader isLoggedIn={isAuthenticated} />

      {/* 매칭 완료 알림 */}
      {showMatchingNotification && (
        <div className="fixed z-50 max-w-sm p-4 mx-auto bg-white border rounded-lg shadow-lg top-20 left-4 right-4 border-brand">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-brand animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                매칭이 완료되었어요!
              </p>
              <p className="text-xs text-gray-600">결과를 확인해보세요</p>
            </div>
            <button
              onClick={handleMatchingNotificationClick}
              className="text-sm font-medium transition-colors text-brand hover:text-brand-dark"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div>
        {bannerLoading ? (
          <div className="w-full h-[232px] bg-gray-200 animate-pulse" />
        ) : (
          <Banner variant="main" />
        )}
      </div>
      <TopPetSection
        title="내 근처에 있는 아이들"
        rightSlot="모두 보기"
        animals={topSectionAnimals}
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
        isLoading={isTopSectionLoading}
        error={topSectionError}
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
        sortBy="admission_date"
        sortOrder="asc"
      />

      {/* <MatchingSection
        variant="variant2"
        isLoading={isTopSectionLoading}
        error={topSectionError}
        isExpertAnalysis={true}
        aiMatchingResult={aiMatchingResult}
      /> */}

      <CommunitySection />

      <PetSection
        title={`지금 주목받고 있는 \n아이들이에요`}
        animals={petSectionAnimals}
        isLoading={isPetSectionLoading}
        error={petSectionError}
      />

      <FooterSection />

      <NavBar />

      <button
        type="button"
        onClick={handleConsultClick}
        className="fixed bottom-24 right-4 z-50 h-16 w-16 rounded-full shadow-lg overflow-hidden transition-transform hover:scale-105"
        aria-label="상담 채널로 이동"
      >
        <NextImage
          src="/img/main_chat.png"
          alt="상담 채널 이동"
          fill
          sizes="64px"
          className="object-cover"
          priority
        />
      </button>

      <BottomSheet
        open={showConsultModal}
        onClose={() => setShowConsultModal(false)}
        variant="primary"
        title="상담 채널로 이동하시겠어요?"
        description="카카오톡 채널로 이동합니다."
        leftButtonText="취소"
        rightButtonText="이동하기"
        onLeftClick={() => setShowConsultModal(false)}
        onRightClick={handleConfirmConsult}
      />
    </Container>
  );
}
