"use client";

import React, { useState, use, useEffect } from "react";

import {
  ArrowLeft,
  ShareNetwork,
  Heart,
  Megaphone,
} from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { CenterInfo } from "@/components/ui/CenterInfo";
import { Container } from "@/components/common/Container";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import AnimalBasicInfo from "./_components/AnimalBasicInfo";
import WaitingStatus from "./_components/WaitingStatus";
import AnimalDetails from "./_components/AnimalDetails";
import RelatedPosts from "./_components/RelatedPosts";
import { RelatedAnimals } from "@/components/ui/RelatedAnimals";
import { PetCard } from "@/components/ui/PetCard";
import SubscriberDetails from "./_components/SubscriberDetails";
import {
  useGetAnimalById,
  useGetRelatedAnimalsByDistance,
} from "@/hooks/query/useGetAnimals";
import { useGetCenterById } from "@/hooks/query/useGetCenters";
import {
  useCheckAnimalFavorite,
  useGetMyCenter,
  useToggleAnimalFavorite,
} from "@/hooks";
import { useAuth } from "@/components/providers/AuthProvider";
import { Toast } from "@/components/ui/Toast";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { CustomModal } from "@/components/ui/CustomModal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";

// Kakao 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      Link: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          };
          buttons: Array<{
            title: string;
            link: {
              mobileWebUrl: string;
              webUrl: string;
            };
          }>;
        }) => void;
      };
      Share: {
        sendScrap: (options: { requestUrl: string }) => void;
      };
    };
  }
}

interface AnimalDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AnimalDetailPage({ params }: AnimalDetailPageProps) {
  const { id } = use(params);
  const { isAuthenticated } = useAuth();
  const { data: animal, isLoading, error } = useGetAnimalById(id);
  const { data: myCenter } = useGetMyCenter();
  const subscriber = myCenter?.isSubscriber === true;

  // 동물의 보호소 정보 가져오기
  const { data: center, isLoading: centerLoading } = useGetCenterById(
    animal?.centerId
  );

  // 찜하기 관련 훅들
  const { data: favoriteData } = useCheckAnimalFavorite(id, isAuthenticated);
  const toggleFavorite = useToggleAnimalFavorite();

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 로그인 유도 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 바텀시트 상태
  const [showShareBottomSheet, setShowShareBottomSheet] = useState(false);
  const [showAdoptionBottomSheet, setShowAdoptionBottomSheet] = useState(false);

  // 공유 토스트 상태
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState("");
  const [shareToastType, setShareToastType] = useState<"success" | "error">(
    "success"
  );

  // 구독자 여부 확인
  const isSubscriber = subscriber;

  // 찜하기 토글 핸들러
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      await toggleFavorite.mutateAsync({ animalId: id });

      // 찜 상태에 따른 메시지 설정
      if (isFavorited) {
        setToastMessage("찜이 취소되었습니다");
      } else {
        setToastMessage("찜이 추가되었습니다");
      }

      setShowToast(true);
    } catch (error) {
      setToastMessage("찜하기 처리 중 오류가 발생했습니다");
      setShowToast(true);
      console.error("찜하기 토글 오류:", error);
    }
  };

  // 입양신청 버튼 핸들러
  const handleAdoptionClick = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // 로그인 상태인 경우 입양 신청 바텀시트 표시
    setShowAdoptionBottomSheet(true);
  };

  // 공유하기 버튼 클릭 핸들러
  const handleShareClick = () => {
    setShowShareBottomSheet(true);
  };

  // 링크 복사 핸들러
  const handleCopyLink = () => {
    const animalUrl = `${window.location.origin}/list/animal/${id}`;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(animalUrl)
        .then(() => {
          setShareToastMessage("링크가 복사되었습니다.");
          setShareToastType("success");
          setShowShareToast(true);
          setShowShareBottomSheet(false);
        })
        .catch(() => {
          fallbackCopyTextToClipboard(animalUrl);
        });
    } else {
      fallbackCopyTextToClipboard(animalUrl);
    }
  };

  // 카카오 공유하기 핸들러
  const handleKakaoShare = () => {
    if (typeof window !== "undefined" && window.Kakao) {
      const animalUrl = `${window.location.origin}/list/animal/${id}`;

      window.Kakao.Share.sendScrap({
        requestUrl: animalUrl,
      });

      setShareToastType("success");
      setShowShareToast(true);
      setShowShareBottomSheet(false);
    } else {
      setShareToastMessage("카카오톡 공유를 사용할 수 없습니다.");
      setShareToastType("error");
      setShowShareToast(true);
    }
  };

  // Fallback 링크 복사 함수
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      setShareToastMessage("링크가 복사되었습니다.");
      setShareToastType("success");
      setShowShareToast(true);
      setShowShareBottomSheet(false);
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
      setShareToastMessage("링크 복사에 실패했습니다.");
      setShareToastType("error");
      setShowShareToast(true);
    }

    document.body.removeChild(textArea);
  };

  // 토스트 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 거리 기반 관련 동물 데이터 가져오기
  const { data: relatedAnimalsData, isLoading: relatedAnimalsLoading } =
    useGetRelatedAnimalsByDistance(animal?.id);

  if (isLoading || centerLoading || relatedAnimalsLoading) {
    return (
      <Container>
        <div className="text-center py-8">로딩 중...</div>
      </Container>
    );
  }

  if (error || !animal) {
    return (
      <Container>
        <div className="text-center py-8">동물을 찾을 수 없습니다.</div>
      </Container>
    );
  }
  // 관련 동물들 (이미 현재 동물이 제외되어 있음)
  const relatedAnimals = relatedAnimalsData?.data?.animals || [];

  // 찜 상태 (기본값은 false)
  const isFavorited = favoriteData?.isFavorited || false;
  return (
    <>
      <Container className="min-h-screen bg-gray-50 pb-20">
        <TopBar
          variant="variant5"
          className="border-b border-lg"
          left={
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
            />
          }
          center={<h4>자세히 보기</h4>}
          right={
            <IconButton
              icon={({ size }) => <ShareNetwork size={size} weight="bold" />}
              size="iconM"
              onClick={handleShareClick}
            />
          }
        />

        <AnimalBasicInfo
          tag={animal.status}
          name={animal.name}
          isFemale={animal.isFemale}
          age={animal.age}
          weight={animal.weight || 0}
          color={animal.color || ""}
          imageUrls={animal.animalImages || []}
        />

        <WaitingStatus waitingDays={animal.waitingDays || 0} />

        <AnimalDetails
          announceNumber={animal.announceNumber || ""}
          announcementDate={animal.announcementDate || ""}
          description={animal.description || ""}
          foundLocation={animal.foundLocation || ""}
          center={animal.centerId}
          isSubscriber={isSubscriber}
          specialNotes={animal.specialNotes || undefined}
        />
        <div className="py-3" />

        {/* 구독자용 상세 정보 */}
        {isSubscriber && (
          <SubscriberDetails
            activityLevel={animal.activityLevel || 3}
            sensitivity={animal.sensitivity || 3}
            sociability={animal.sociability || 3}
            separationAnxiety={animal.separationAnxiety || undefined}
            healthNotes={animal.healthNotes ? [animal.healthNotes] : []}
            basicTraining={animal.basicTraining || undefined}
            trainerComment={animal.trainerComment || undefined}
          />
        )}
        <RelatedPosts currentPet={animal} />

        <CenterInfo
          variant={isSubscriber ? "subscriber" : "primary"}
          centerId={center?.id || ""}
          name={center?.name || "보호소 정보 없음"}
          location={center?.location || "주소 정보 없음"}
          phoneNumber={center?.phoneNumber || "연락처 정보 없음"}
          adoptionProcedure={
            isSubscriber && center?.adoptionProcedure
              ? center.adoptionProcedure
              : undefined
          }
          isVerified={center?.verified || false}
          className="border-t border-bg mt-6 mb-8"
        />

        {/* 거리 기반 가까운 공고 */}
        {relatedAnimals.length > 0 && (
          <RelatedAnimals
            pets={relatedAnimals}
            location={animal.foundLocation || ""}
          />
        )}
      </Container>

      {/* FixedBottomBar */}
      <FixedBottomBar
        variant="variant3"
        leftButtonText="임시 보호"
        onLeftButtonClick={() => {
          handleAdoptionClick();
        }}
        primaryButtonText="입양 신청"
        onPrimaryButtonClick={handleAdoptionClick}
        showDivider
        rightIcon1={<Megaphone size={20} weight="bold" />} //@TODO 추천하기 기능 추가 필요
        rightIcon2={
          <Heart
            size={20}
            weight={isFavorited ? "fill" : "bold"}
            className={isFavorited ? "text-brand" : "text-gr"}
          />
        }
        onRightIcon1Click={handleShareClick}
        onRightIcon2Click={handleFavoriteToggle}
      />

      {/* 토스트 메시지 */}
      {showToast && <Toast>{toastMessage}</Toast>}

      {/* 공유 모달 */}
      {showShareBottomSheet && animal && (
        <CustomModal
          open={showShareBottomSheet}
          onClose={() => setShowShareBottomSheet(false)}
          title="공고 공유"
          variant="variant4"
          onKakaoShare={handleKakaoShare}
          onCopyLink={handleCopyLink}
        >
          <div className="flex items-center justify-center w-full">
            <PetCard
              pet={{
                id: animal.id,
                name: animal.name || "",
                isFemale: animal.isFemale,
                status: animal.status,
                animalImages: animal.animalImages || [],
                foundLocation: animal.foundLocation || "",
              }}
              variant="variant4"
              imageSize="full"
              className="w-full max-w-sm"
            />
          </div>
        </CustomModal>
      )}

      {/* 로그인 유도 모달 */}
      <CustomModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="로그인이 필요합니다"
        description="이 기능을 사용하려면 로그인이 필요합니다."
        variant="variant2"
        ctaText="카카오톡으로 로그인하기"
        onCtaClick={() => {
          <KakaoLoginButton />;
          setShowLoginModal(false);
        }}
        subLinkText="나중에 하기"
        onSubLinkClick={() => setShowLoginModal(false)}
      />

      {/* 입양 신청 바텀시트 */}
      <BottomSheet
        open={showAdoptionBottomSheet}
        onClose={() => setShowAdoptionBottomSheet(false)}
        variant="variant6"
        title="입양 신청"
        description={`센터 전화번호: ${
          center?.phoneNumber || "연락처 정보 없음"
        }`}
        rightButtonText="전화 연결하기"
        onRightClick={() => {
          if (center?.phoneNumber) {
            window.location.href = `tel:${center.phoneNumber}`;
          }
          setShowAdoptionBottomSheet(false);
        }}
      />

      {/* 공유 토스트 알림 */}
      {showShareToast && (
        <NotificationToast
          message={shareToastMessage}
          type={shareToastType}
          onClose={() => setShowShareToast(false)}
        />
      )}
    </>
  );
}
