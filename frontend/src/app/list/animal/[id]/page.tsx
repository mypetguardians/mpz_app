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
import { RelatedAnimals } from "@/app/list/animal/[id]/_components/RelatedAnimals";
import { PetCard } from "@/components/ui/PetCard";
import SubscriberDetails from "./_components/SubscriberDetails";
import {
  useGetAnimalById,
  useGetRelatedAnimalsByDistance,
} from "@/hooks/query/useGetAnimals";
import { RawAnimalResponse } from "@/types/animal";
import { useGetCenterById } from "@/hooks/query/useGetCenters";
import {
  useCheckAnimalFavorite,
  useToggleAnimalFavorite,
  useToggleAnimalRecommend,
} from "@/hooks";
import { useGetMyProfile } from "@/hooks/query/useGetMyProfile";
import { useAdoptionVerificationStore } from "@/lib/stores";
import { useAuth } from "@/components/providers/AuthProvider";
import { useKakaoSDK } from "@/hooks/useKakaoSDK";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { CustomModal } from "@/components/ui/CustomModal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useRouter } from "next/navigation";

interface AnimalDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AnimalDetailPage({ params }: AnimalDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { isAuthenticated, user } = useAuth();
  const { isLoaded, isInitialized } = useKakaoSDK();
  const {
    data: animal,
    isLoading,
    error,
  } = useGetAnimalById(id) as {
    data: RawAnimalResponse | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  // 동물의 보호센터 정보 가져오기
  const { data: center, isLoading: centerLoading } = useGetCenterById(
    animal?.center_id
  );

  // 센터의 구독 상태 확인 (공고를 올린 센터가 구독자인지)
  const isCenterSubscriber = center?.isSubscriber === true;

  // 사용자 프로필 정보 가져오기 (전화번호 인증 상태 확인용)
  const { data: userProfile } = useGetMyProfile();

  // 입양 신청 스토어 초기화
  const adoptionStore = useAdoptionVerificationStore(user?.id);

  // 찜하기 관련
  const { data: favoriteData, isLoading: favoriteLoading } =
    useCheckAnimalFavorite(id, isAuthenticated);
  const toggleFavorite = useToggleAnimalFavorite();

  // 추천하기 관련
  const toggleRecommend = useToggleAnimalRecommend();

  // 로컬 상태
  const [isMegaphoned, setIsMegaphoned] = useState(false);
  const [localIsFavorited, setLocalIsFavorited] = useState<boolean | null>(
    null
  );

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

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

  // 찜하기 토글 핸들러
  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const currentState = localIsFavorited;

    // UI optimistic update
    setLocalIsFavorited(!currentState);

    toggleFavorite.mutate(
      { animalId: id },
      {
        onSuccess: (response) => {
          const isFavorited = response.is_favorited ?? false;
          setLocalIsFavorited(isFavorited);
          setToastMessage(
            isFavorited ? "찜이 추가되었습니다" : "찜이 취소되었습니다"
          );
          setToastType("success");
          setShowToast(true);
        },
        onError: (error) => {
          setLocalIsFavorited(currentState);
          setToastMessage("찜하기 처리 중 오류가 발생했습니다");
          setToastType("error");
          setShowToast(true);
          console.error(error);
        },
      }
    );
  };

  // 추천하기 핸들러
  const handleMegaphoneClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const currentState = isMegaphoned;

    // UI optimistic update
    setIsMegaphoned(!currentState);

    toggleRecommend.mutate(
      { animalId: id },
      {
        onSuccess: (response) => {
          const isMegaphonedFromApi = response.is_megaphoned ?? false;
          setIsMegaphoned(isMegaphonedFromApi);
          setToastMessage(
            isMegaphonedFromApi ? "추천되었습니다" : "추천이 취소되었습니다"
          );
          setToastType("success");
          setShowToast(true);
        },
        onError: (error) => {
          setIsMegaphoned(currentState);
          setToastMessage("추천하기 처리 중 오류가 발생했습니다");
          setToastType("error");
          setShowToast(true);
          console.error(error);
        },
      }
    );
  };

  // 입양신청 버튼 핸들러
  const handleAdoptionClick = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // 구독 센터인 경우 전화번호 인증 상태에 따라 다른 경로로 이동
    if (isCenterSubscriber) {
      // 스토어에 동물 정보 설정
      const centerId = animal?.center_id || center?.id || "";
      adoptionStore.setAnimalInfo(id, centerId);

      // 사용자 정보를 스토어에 로드
      if (userProfile) {
        adoptionStore.loadUserData({
          phone: userProfile.phoneNumber || undefined,
          phoneVerification: userProfile.isPhoneVerified || false,
          name: userProfile.name || undefined,
          birth: userProfile.birth || undefined,
          address: userProfile.address || undefined,
        });
      }

      const isPhoneVerified = userProfile?.isPhoneVerified === true;

      if (isPhoneVerified) {
        // 전화번호 인증이 완료된 경우 step5로 이동
        router.push(`/adoption/verification/5`);
      } else {
        // 전화번호 인증이 안된 경우 step1부터 시작
        router.push(`/adoption/verification/1`);
      }
      return;
    }

    // 일반 센터인 경우 기존 바텀시트 표시
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

  const handleKakaoShare = () => {
    if (!isLoaded || !isInitialized) {
      setShareToastMessage(
        "카카오톡을 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
      );
      setShareToastType("error");
      setShowShareToast(true);
      setShowShareBottomSheet(false);
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.Kakao &&
      window.Kakao.Share &&
      window.Kakao.Share.sendScrap
    ) {
      try {
        const animalUrl = `${window.location.origin}/list/animal/${id}`;
        window.Kakao.Share.sendScrap({ requestUrl: animalUrl });
        setShowShareBottomSheet(false);
      } catch (error) {
        console.error("카카오톡 공유 실패:", error);
        setShareToastMessage("카카오톡 공유에 실패했습니다.");
        setShareToastType("error");
        setShowShareToast(true);
        setShowShareBottomSheet(false);
      }
    } else {
      setShareToastMessage("카카오톡과 연결되어 있지 않습니다.");
      setShareToastType("error");
      setShowShareToast(true);
      setShowShareBottomSheet(false);
    }
  };

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
    } catch (error) {
      setShareToastMessage("링크 복사에 실패했습니다.");
      setShareToastType("error");
      setShowShareToast(true);
      console.error(error);
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

  // 초기 찜하기 상태 동기화 - 서버 데이터가 로드되면 즉시 반영
  useEffect(() => {
    if (!favoriteLoading && favoriteData?.is_favorited !== undefined) {
      setLocalIsFavorited(favoriteData.is_favorited);
    }
  }, [favoriteLoading, favoriteData?.is_favorited]);

  // 초기 추천하기 상태 동기화 - 서버 데이터가 로드되면 즉시 반영
  useEffect(() => {
    if (animal && animal.is_megaphoned !== undefined) {
      setIsMegaphoned(animal.is_megaphoned);
    }
  }, [animal?.is_megaphoned, animal]);

  // 거리 기반 관련 동물 데이터 가져오기
  const { data: relatedAnimalsData, isLoading: relatedAnimalsLoading } =
    useGetRelatedAnimalsByDistance(animal?.id);

  if (isLoading || centerLoading || relatedAnimalsLoading) {
    return (
      <Container>
        <div className="min-h-screen bg-gray-50">
          {/* TopBar 스켈레톤 */}
          <div className="border-b border-lg bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* 이미지 스켈레톤 */}
          <div className="w-full h-80 bg-gray-200 animate-pulse" />

          {/* 정보 스켈레톤 */}
          <div className="px-4 py-6 space-y-4">
            <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
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

  // RelatedAnimalsResponse를 RawAnimalResponse로 변환
  const relatedAnimals: RawAnimalResponse[] = (relatedAnimalsData || []).map(
    (item) => ({
      ...item,
      protection_status: item.protection_status,
      adoption_status: item.adoption_status,
      weight: item.weight,
      color: item.color,
      breed: item.breed,
      description: item.description,
      notice_sdt: item.notice_sdt,
      notice_edt: item.notice_edt,
    })
  );

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
              onClick={() => router.back()}
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
          protection_status={animal.protection_status}
          adoption_status={animal.adoption_status}
          name={animal.name}
          isFemale={animal.is_female}
          age={animal.age}
          weight={animal.weight || 0}
          color={animal.color || ""}
          breed={animal.breed || ""}
          imageUrls={
            animal.animal_images
              ? animal.animal_images.map((img) => img.image_url)
              : []
          }
        />

        <WaitingStatus admissionDate={animal.admission_date || ""} />

        <AnimalDetails
          announceNumber={animal.announce_number || ""}
          noticeStartDate={animal.notice_sdt || ""}
          noticeEndDate={animal.notice_edt || ""}
          description={animal.description || ""}
          foundLocation={animal.found_location || ""}
          center={center?.name || "보호센터 정보 없음"}
          isCenterSubscriber={isCenterSubscriber}
          specialNotes={animal.special_notes || undefined}
        />
        <div className="py-3" />

        {isCenterSubscriber && (
          <SubscriberDetails
            activityLevel={animal.activity_level || 3}
            sensitivity={animal.sensitivity || 3}
            sociability={animal.sociability || 3}
            separationAnxiety={animal.separation_anxiety || undefined}
            healthNotes={animal.health_notes ? [animal.health_notes] : []}
            basicTraining={animal.basic_training?.toString() || undefined}
            trainerComment={animal.trainer_comment || undefined}
          />
        )}

        <RelatedPosts
          currentPet={{
            ...animal,
            isFemale: animal.is_female,
            status:
              animal.protection_status === "보호중" ? "보호중" : "입양완료",
            animalImages:
              animal.animal_images?.map((img) => ({
                id: img.id,
                imageUrl: img.image_url,
                orderIndex: img.order_index,
              })) || [],
            foundLocation: animal.found_location,
            admissionDate: animal.admission_date,
            announceNumber: animal.announce_number,
            announcementDate: animal.announcement_date,
            noticeStartDate: animal.notice_sdt,
            noticeEndDate: animal.notice_edt,
            activityLevel: animal.activity_level?.toString() || null,
            sensitivity: animal.sensitivity?.toString() || null,
            sociability: animal.sociability?.toString() || null,
            separationAnxiety: animal.separation_anxiety?.toString() || null,
            specialNotes: animal.special_notes,
            healthNotes: animal.health_notes,
            basicTraining: animal.basic_training?.toString() || null,
            trainerComment: animal.trainer_comment,
            centerId: animal.center_id,
            waitingDays: animal.waiting_days,
            megaphoneCount: animal.megaphone_count,
            isMegaphoned: animal.is_megaphoned,
            createdAt: animal.created_at,
            updatedAt: animal.updated_at,
            breed: animal.breed,
          }}
        />

        <CenterInfo
          variant={isCenterSubscriber ? "subscriber" : "primary"}
          centerId={center?.id || ""}
          name={center?.name || "보호센터 정보 없음"}
          location={center?.location || "주소 정보 없음"}
          phoneNumber={center?.phoneNumber || "연락처 정보 없음"}
          adoptionProcedure={
            isCenterSubscriber && center?.adoptionProcedure
              ? center.adoptionProcedure
              : undefined
          }
          isVerified={center?.verified || false}
          className="border-y border-bg mt-6 mb-8 pb-5"
          isAuthenticated={isAuthenticated}
          onShowLoginModal={() => setShowLoginModal(true)}
        />

        <RelatedAnimals
          pets={relatedAnimals}
          location={animal.found_location || ""}
        />
      </Container>

      {isCenterSubscriber ? (
        <FixedBottomBar
          variant="variant3"
          leftButtonText="임시 보호"
          onLeftButtonClick={handleAdoptionClick}
          primaryButtonText="입양 신청"
          onPrimaryButtonClick={handleAdoptionClick}
          showDivider
          rightIcon1={
            <Megaphone
              size={20}
              weight={isMegaphoned ? "fill" : "bold"}
              className={isMegaphoned ? "text-brand" : "text-gr"}
            />
          }
          rightIcon2={
            <Heart
              size={20}
              weight={localIsFavorited ? "fill" : "bold"}
              className={localIsFavorited ? "text-brand" : "text-gr"}
              style={{ opacity: favoriteLoading ? 0.5 : 1 }}
            />
          }
          onRightIcon1Click={handleMegaphoneClick}
          onRightIcon2Click={handleFavoriteToggle}
        />
      ) : (
        <FixedBottomBar
          variant="variant1"
          primaryButtonText="입양 신청"
          onPrimaryButtonClick={handleAdoptionClick}
          showDivider
          rightIcon1={
            <Megaphone
              size={20}
              weight={isMegaphoned ? "fill" : "bold"}
              className={isMegaphoned ? "text-brand" : "text-gr"}
            />
          }
          rightIcon2={
            <Heart
              size={20}
              weight={localIsFavorited ? "fill" : "bold"}
              className={localIsFavorited ? "text-brand" : "text-gr"}
              style={{ opacity: favoriteLoading ? 0.5 : 1 }}
            />
          }
          onRightIcon1Click={handleMegaphoneClick}
          onRightIcon2Click={handleFavoriteToggle}
        />
      )}

      {showToast && (
        <NotificationToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

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
                isFemale: animal.is_female,
                protection_status: animal.protection_status,
                adoption_status: animal.adoption_status,
                breed: animal.breed || "",
                centerId: animal.center_id,
                animalImages:
                  animal.animal_images?.map((img) => ({
                    id: img.id,
                    imageUrl: img.image_url,
                    orderIndex: img.order_index,
                  })) || [],
                foundLocation: animal.found_location || "",
              }}
              variant="variant4"
              imageSize="full"
              className="w-full max-w-sm"
            />
          </div>
        </CustomModal>
      )}

      <CustomModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="로그인이 필요합니다"
        description="이 기능을 사용하려면 로그인이 필요합니다."
        variant="variant2"
        ctaText="카카오톡으로 로그인하기"
        onCtaClick={() => {
          setShowLoginModal(false);
          router.push("/login");
        }}
        subLinkText="나중에 하기"
        onSubLinkClick={() => setShowLoginModal(false)}
      />

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
