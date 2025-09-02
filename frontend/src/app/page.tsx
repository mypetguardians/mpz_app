"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { HomeHeader } from "@/app/_components/HomeHeader";
import { PetSection } from "@/app/_components/PetSection";
import { TopPetSection } from "@/app/_components/TopPetSection";
import { MatchingSection } from "@/app/_components/MatchingSection";
import { CommunitySection } from "@/app/_components/CommunitySection";
import { FooterSection } from "@/app/_components/FooterSection";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import { useGetBanners } from "@/hooks/query/useGetBanners";
import { useMatchingStepStore } from "@/lib/stores/matchingStepStore";
import { useAuth } from "@/components/providers/AuthProvider";
import { RawAnimalResponse } from "@/types/animal";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { aiMatchingResult } = useMatchingStepStore();
  const { data: banners, isLoading: bannerLoading } = useGetBanners({
    type: "main",
  });

  const {
    data: animalsData,
    isLoading,
    error,
  } = useGetAnimals({
    limit: 100,
    sortBy: "admission_date",
    sortOrder: "desc",
  });

  const animals: RawAnimalResponse[] =
    animalsData?.pages?.flatMap((page) => {
      return (page as { data?: RawAnimalResponse[] }).data || [];
    }) || [];

  const totalPets = animals.length;

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
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
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{
                transform: `translateX(-${currentBannerIndex * 100}%)`,
              }}
            >
              {banners.data.map((banner, index) => (
                <div
                  key={banner.id || index}
                  className="relative min-w-full h-full cursor-pointer flex-shrink-0"
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
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
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
