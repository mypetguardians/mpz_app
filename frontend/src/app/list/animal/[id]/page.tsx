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
import { RawAnimalResponse } from "@/types/animal";
import { useGetCenterById } from "@/hooks/query/useGetCenters";
import {
  useCheckAnimalFavorite,
  useGetMyCenter,
  useToggleAnimalFavorite,
  useToggleAnimalRecommend,
} from "@/hooks";
import { useAuth } from "@/components/providers/AuthProvider";
import { Toast } from "@/components/ui/Toast";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { CustomModal } from "@/components/ui/CustomModal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const { id } = use(params);
  const { isAuthenticated } = useAuth();
  const {
    data: animal,
    isLoading,
    error,
  } = useGetAnimalById(id) as {
    data: RawAnimalResponse | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  const { data: myCenter } = useGetMyCenter();
  const subscriber = myCenter?.isSubscriber === true;

  // 동물의 보호소 정보 가져오기
  const { data: center, isLoading: centerLoading } = useGetCenterById(
    animal?.center_id
  );

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
          setShowToast(true);
        },
        onError: (error) => {
          setLocalIsFavorited(currentState);
          setToastMessage("찜하기 처리 중 오류가 발생했습니다");
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
          setShowToast(true);
        },
        onError: (error) => {
          setIsMegaphoned(currentState);
          setToastMessage("추천하기 처리 중 오류가 발생했습니다");
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
    if (typeof window !== "undefined" && window.Kakao) {
      const animalUrl = `${window.location.origin}/list/animal/${id}`;
      window.Kakao.Share.sendScrap({ requestUrl: animalUrl });

      setShowShareBottomSheet(false);
    } else {
      setShareToastMessage("카카오톡 공유를 사용할 수 없습니다.");
      setShareToastType("error");
      setShowShareToast(true);
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

  // 초기 찜하기 상태 동기화
  useEffect(() => {
    if (favoriteData?.isFavorited !== undefined) {
      setLocalIsFavorited(favoriteData.isFavorited);
    }
  }, [favoriteData?.isFavorited]);

  // 로딩 중이 아닐 때만 초기 상태 설정
  useEffect(() => {
    if (!favoriteLoading && favoriteData?.isFavorited !== undefined) {
      setLocalIsFavorited(favoriteData.isFavorited);
    }
  }, [favoriteLoading, favoriteData?.isFavorited]);

  // 초기 추천하기 상태 동기화
  useEffect(() => {
    if (animal?.is_megaphoned !== undefined) {
      setIsMegaphoned(animal.is_megaphoned);
    }
  }, [animal?.is_megaphoned]);

  // 거리 기반 관련 동물 데이터 가져오기
  const { data: relatedAnimalsData, isLoading: relatedAnimalsLoading } =
    useGetRelatedAnimalsByDistance(animal?.id);

  if (isLoading || centerLoading || relatedAnimalsLoading || favoriteLoading) {
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

  const relatedAnimals = relatedAnimalsData?.data?.animals || [];

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
          tag={animal.status}
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
          announcementDate={animal.announcement_date || ""}
          description={animal.description || ""}
          foundLocation={animal.found_location || ""}
          center={center?.name}
          isSubscriber={isSubscriber}
          specialNotes={animal.special_notes || undefined}
        />
        <div className="py-3" />

        {isSubscriber && (
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
          className="border-y border-bg mt-6 mb-8 pb-5"
          isAuthenticated={isAuthenticated}
          onShowLoginModal={() => setShowLoginModal(true)}
        />

        <RelatedAnimals
          pets={relatedAnimals}
          location={animal.found_location || ""}
        />
      </Container>

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

      {showToast && <Toast>{toastMessage}</Toast>}

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
                status: animal.status,
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
