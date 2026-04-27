"use client";

import { useState, useEffect } from "react";

// import NextImage from "next/image";
import { Container } from "@/components/common/Container";
import { NavBar } from "@/components/common/NavBar";
import { HomeHeader } from "@/app/_components/HomeHeader";
import { PetSection } from "@/app/_components/PetSection";
import { TopPetSection } from "@/app/_components/TopPetSection";
//import { MatchingSection } from "@/app/_components/MatchingSection";
// import { CommunitySection } from "@/app/_components/CommunitySection";
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
import { useRouter, usePathname } from "next/navigation";
import { Banner } from "@/components/ui/Banner";
// import { BottomSheet } from "@/components/ui/BottomSheet";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// FCM 토큰 디버깅용 - 앱 시작 시점에 전역 리스너 등록
if (typeof window !== "undefined") {
  // 중복 등록 방지
  const windowWithFlag = window as Window & {
    __fcmTokenListenerAdded?: boolean;
  };
  if (!windowWithFlag.__fcmTokenListenerAdded) {
    const handleFCMToken = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const token = customEvent.detail;
        console.log("=== FCM 토큰 수신 (전역) ===");
        console.log("토큰:", token);
        console.log("이벤트 타입:", event.type);
        console.log("===================");
        // 토큰을 localStorage에 저장 (디버깅용)
        if (token && typeof token === "string") {
          localStorage.setItem("fcm_token_debug", token);
          console.log("✅ FCM 토큰을 localStorage에 저장했습니다");
        } else {
          console.warn("⚠️ 토큰이 유효하지 않습니다:", token);
        }
      } catch (error) {
        console.error("❌ FCM 토큰 이벤트 처리 오류:", error);
      }
    };

    window.addEventListener("fcmToken", handleFCMToken);
    windowWithFlag.__fcmTokenListenerAdded = true;
    console.log("✅ 전역 FCM 토큰 리스너 등록 완료");

    // 이미 저장된 토큰 확인
    const savedToken = localStorage.getItem("fcm_token_debug");
    if (savedToken) {
      console.log(
        "ℹ️ 이미 저장된 FCM 토큰 발견:",
        savedToken.substring(0, 30) + "..."
      );
    }
  }
}

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // const kakaoChannelUrl = "http://pf.kakao.com/_mbxbDn/chat";
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // 초기 진입 시 localStorage 무시 — 항상 "내 주변"으로 시작
  // (TopPetSection에서 isNearbyActive 기본값 true + GPS 자동 요청)
  // 메인 배너는 공통 로직 컴포넌트로 대체
  const [showMatchingNotification, setShowMatchingNotification] =
    useState(false);
  // const [showConsultModal, setShowConsultModal] = useState(false);
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
    protection_status: "보호중",
    adoption_status: "입양가능",
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
    protection_status: "보호중",
    adoption_status: "입양가능",
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

  // const handleConsultClick = () => {
  //   setShowConsultModal(true);
  // };

  // const handleConfirmConsult = () => {
  //   setShowConsultModal(false);
  //   if (typeof window !== "undefined") {
  //     window.open(kakaoChannelUrl, "_blank", "noopener,noreferrer");
  //   }
  // };

  // 앱 환경에서 홈 화면에서 뒤로가기 버튼 처리
  useEffect(() => {
    // 네이티브 앱에서만 실행
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 홈 화면에서만 뒤로가기 버튼 처리
    if (pathname !== "/") {
      return;
    }

    const handleBackButton = async () => {
      // 히스토리가 없으면 앱 종료
      if (typeof window !== "undefined") {
        // window.history.length가 1이면 히스토리가 없는 경우
        // (앱이 처음 시작되었거나 히스토리가 비어있는 경우)
        if (window.history.length <= 1) {
          await App.exitApp();
        } else {
          // 히스토리가 있으면 기본 뒤로가기 동작 수행
          router.back();
        }
      }
    };

    // 뒤로가기 버튼 이벤트 리스너 등록
    const listener = App.addListener("backButton", handleBackButton);

    // 클린업
    return () => {
      listener.then((l) => l.remove());
    };
  }, [pathname, router]);

  return (
    <Container>
      <div className="flex flex-col min-h-screen">
        <h1 className="sr-only">마펫쯔 - 유기동물 입양 플랫폼</h1>
        <HomeHeader isLoggedIn={isAuthenticated} isAuthLoading={authLoading} />

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
        <div className="mt-5">
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
        </div>

        {/* <MatchingSection
          variant="variant2"
          isLoading={isTopSectionLoading}
          error={topSectionError}
          isExpertAnalysis={true}
          aiMatchingResult={aiMatchingResult}
        /> */}

        {/* <CommunitySection /> */}

        <div className="mt-5">
          <PetSection
            title={`지금 주목받고 있는 \n아이들이에요`}
            animals={petSectionAnimals}
            isLoading={isPetSectionLoading}
            error={petSectionError}
          />
        </div>

        <div className="mt-5">
          <FooterSection />
        </div>
      </div>

      <NavBar />
      {/* <div className="max-w-[420px] mx-auto">
        <button
          type="button"
          onClick={handleConsultClick}
          className="fixed z-50 transition-transform right-4 rounded-full bg-transparent shadow-lg hover:scale-105"
          style={{
            bottom:
              "calc(var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 80px)",
          }}
          aria-label="상담 채널로 이동"
        >
          <NextImage
            src="/img/main_chat.png"
            alt="상담 채널 이동"
            width={150}
            height={50}
            className="object-contain"
            priority
          />
        </button>
      </div>
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
      /> */}
    </Container>
  );
}
