"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showMatchingNotification, setShowMatchingNotification] =
    useState(false);
  //const { aiMatchingResult, setAIMatchingResult } = useMatchingStepStore();
  const { data: banners, isLoading: bannerLoading } = useGetBanners({
    type: "main",
  });

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

  // 자동 슬라이드 기능
  useEffect(() => {
    if (!banners || banners.data.length <= 1 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex(
        (prevIndex) => (prevIndex + 1) % banners.data.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [banners, isAutoPlaying]);

  // 배너 클릭 핸들러
  const handleBannerClick = () => {
    if (banners && banners.data[currentBannerIndex]?.link_url) {
      window.open(banners.data[currentBannerIndex].link_url, "_blank");
    }
  };

  // 인디케이터 클릭 핸들러
  const handleIndicatorClick = (index: number) => {
    setCurrentBannerIndex(index);
  };

  // 터치/스와이프 핸들러
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (!banners || banners.data.length <= 1) return;

    if (isLeftSwipe) {
      // 왼쪽 스와이프 - 다음 슬라이드
      setCurrentBannerIndex(
        (prevIndex) => (prevIndex + 1) % banners.data.length
      );
    } else if (isRightSwipe) {
      // 오른쪽 스와이프 - 이전 슬라이드
      setCurrentBannerIndex((prevIndex) =>
        prevIndex === 0 ? banners.data.length - 1 : prevIndex - 1
      );
    }
  };

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
        {bannerLoading && (
          <div className="w-full h-[232px] bg-gray-200 animate-pulse" />
        )}
        {!bannerLoading && banners && banners.data.length > 0 && (
          <div
            className="relative w-full h-[232px] overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* 캐러셀 컨테이너 */}
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentBannerIndex * 100}%)`,
              }}
            >
              {banners.data.map((banner, index) => (
                <div
                  key={banner.id || index}
                  className="relative flex-shrink-0 h-full min-w-full cursor-pointer"
                  onClick={handleBannerClick}
                >
                  <Image
                    src={banner.image_url}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>

            {/* 인디케이터 */}
            {banners.data.length > 1 && (
              <div className="absolute flex space-x-2 transform -translate-x-1/2 bottom-4 left-1/2">
                {banners.data.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentBannerIndex
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIndicatorClick(index);
                    }}
                    aria-label={`배너 ${index + 1}로 이동`}
                  />
                ))}
              </div>
            )}
          </div>
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
    </Container>
  );
}
