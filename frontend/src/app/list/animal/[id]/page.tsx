"use client";

import React, { useState, use, useEffect } from "react";
import type { ReactElement } from "react";

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
import { AnimalDetailSkeleton } from "./_components/AnimalDetailSkeleton";
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
import { ImageCarouselModal } from "@/components/ui/ImageCarouselModal";
import { useRouter, usePathname } from "next/navigation";

interface AnimalDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AnimalDetailPage({
  params,
}: AnimalDetailPageProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
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
  const centerQuery = useGetCenterById(animal?.center_id);
  const center = centerQuery.data;
  const centerLoading = centerQuery.isLoading;

  // 센터의 구독 상태 확인 (공고를 올린 센터가 구독자인지)
  const isCenterSubscriber = center?.isSubscriber === true;

  // 센터의 임시보호 제공 여부 확인
  const isFosterCareAvailable = center?.hasFosterCare === true;

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
  const [showFosterBottomSheet, setShowFosterBottomSheet] = useState(false);
  const [showAdoptionProcedureModal, setShowAdoptionProcedureModal] =
    useState(false);

  // 공유 토스트 상태
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState("");
  const [shareToastType, setShareToastType] = useState<"success" | "error">(
    "success"
  );

  // 이미지 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalData, setImageModalData] = useState<{
    images: string[];
    initialIndex: number;
  }>({ images: [], initialIndex: 0 });

  // 이미지 클릭 핸들러
  const handleImageClick = (images: string[], initialIndex: number) => {
    setImageModalData({ images, initialIndex });
    setShowImageModal(true);
  };

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
        onSuccess: (response: { is_megaphoned: boolean }) => {
          const isMegaphonedFromApi = response.is_megaphoned ?? false;
          setIsMegaphoned(isMegaphonedFromApi);
          setToastMessage(
            isMegaphonedFromApi ? "추천되었습니다" : "추천이 취소되었습니다"
          );
          setToastType("success");
          setShowToast(true);
        },
        onError: (error: Error) => {
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

    // 센터 회원인 경우 토스트 메시지 표시
    if (user?.userType !== "일반사용자") {
      setToastMessage("일반회원계정으로 로그인해주세요");
      setToastType("error");
      setShowToast(true);
      return;
    }

    // 구독 센터인 경우 입양 절차 모달을 먼저 보여줌
    if (isCenterSubscriber) {
      if (center?.adoptionProcedure || center?.callAvailableTime) {
        setShowAdoptionProcedureModal(true);
      } else {
        handleAdoptionProcedureConfirm();
      }
      return;
    }

    // 일반 센터인 경우 기존 바텀시트 표시
    setShowAdoptionBottomSheet(true);
  };

  // 임시보호 버튼 핸들러
  const handleFosterClick = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // 센터 회원인 경우 토스트 메시지 표시
    if (user?.userType !== "일반사용자") {
      setToastMessage("일반회원계정으로 로그인해주세요");
      setToastType("error");
      setShowToast(true);
      return;
    }
    // 임시보호 신청도 입양 신청과 동일한 절차를 거치되,
    // 스토어에 임시보호 플래그를 함께 저장한다.
    const centerId = animal?.center_id || center?.id || "";
    adoptionStore.setAnimalInfo(id, centerId);
    adoptionStore.updateField("isTemporaryProtection", true);

    if (userProfile) {
      adoptionStore.loadUserData({
        phone: userProfile.phone_number || undefined,
        phoneVerification: userProfile.is_phone_verified || false,
        name: userProfile.name || undefined,
        birth: userProfile.birth || undefined,
        address: userProfile.address || undefined,
      });
    }

    const isPhoneVerified = userProfile?.is_phone_verified === true;

    if (isPhoneVerified) {
      router.push(`/adoption/verification/5?directAccess=true`);
    } else {
      // 전화번호 인증이 안된 경우 step1부터 시작
      router.push(`/adoption/verification/1`);
    }
  };

  // 입양 절차 모달에서 입양 신청하기 버튼 클릭 핸들러
  const handleAdoptionProcedureConfirm = () => {
    // 스토어에 동물 정보 설정
    const centerId = animal?.center_id || center?.id || "";
    adoptionStore.setAnimalInfo(id, centerId);

    // 사용자 정보를 스토어에 로드
    if (userProfile) {
      adoptionStore.loadUserData({
        phone: userProfile.phone_number || undefined,
        phoneVerification: userProfile.is_phone_verified || false,
        name: userProfile.name || undefined,
        birth: userProfile.birth || undefined,
        address: userProfile.address || undefined,
      });
    }

    const isPhoneVerified = userProfile?.is_phone_verified === true;

    if (isPhoneVerified) {
      router.push(`/adoption/verification/5?directAccess=true`);
    } else {
      // 전화번호 인증이 안된 경우 step1부터 시작
      router.push(`/adoption/verification/1`);
    }

    setShowAdoptionProcedureModal(false);
  };

  const handleCenterPhoneCall = () => {
    if (center?.phoneNumber) {
      window.location.href = `tel:${center.phoneNumber}`;
    }
    setShowAdoptionProcedureModal(false);
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

    if (typeof window !== "undefined" && window.Kakao && window.Kakao.Share) {
      try {
        const animalUrl = `${window.location.origin}/list/animal/${id}`;

        // 이미지 URL을 절대 URL로 변환하는 함수
        const getAbsoluteImageUrl = (
          url: string | null | undefined
        ): string => {
          if (!url) return `${window.location.origin}/illust/logo.svg`;
          if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
          }
          if (url.startsWith("/")) {
            return `${window.location.origin}${url}`;
          }
          return `${window.location.origin}/${url}`;
        };

        // 동물 정보 기반 제목 생성: "마펫쯔: 믹스견(3살 추정)"
        const breed = animal?.breed || "믹스견";
        // 나이는 개월 단위이므로 12로 나누어 살 단위로 변환
        const ageText = animal?.age
          ? (() => {
              const ageInYears = animal.age / 12;
              // 1살 미만이면 개월로 표시, 1살 이상이면 살로 표시
              if (ageInYears < 1) {
                return `${animal.age}개월 추정`;
              } else {
                // 소수점 첫째자리까지 표시 (예: 1.5살, 3살)
                const roundedAge = Math.round(ageInYears * 10) / 10;
                return roundedAge % 1 === 0
                  ? `${Math.round(roundedAge)}살 추정`
                  : `${roundedAge}살 추정`;
              }
            })()
          : "";
        const shareTitle = `${breed}${ageText ? `(${ageText})` : ""}`;

        // 설명
        const shareDescription = "유기동물 입양하기! 마펫쯔와 편하게";

        // 동물 이미지가 있으면 첫 번째 이미지 사용, 없으면 기본 이미지
        let shareImageUrl = `${window.location.origin}/illust/logo.svg`;

        if (animal?.animal_images && animal.animal_images.length > 0) {
          shareImageUrl = getAbsoluteImageUrl(
            animal.animal_images[0].image_url
          );
        }

        // sendDefault 메서드 사용 (더 상세한 정보 포함)
        const kakaoShare = window.Kakao.Share as {
          sendScrap?: (options: { requestUrl: string }) => void;
          sendDefault?: (options: {
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

        if (kakaoShare.sendDefault) {
          kakaoShare.sendDefault({
            objectType: "feed",
            content: {
              title: shareTitle,
              description: shareDescription,
              imageUrl: shareImageUrl,
              link: {
                mobileWebUrl: animalUrl,
                webUrl: animalUrl,
              },
            },
            buttons: [
              {
                title: "자세히 보기",
                link: {
                  mobileWebUrl: animalUrl,
                  webUrl: animalUrl,
                },
              },
            ],
          });
        } else if (kakaoShare.sendScrap) {
          // sendDefault가 없으면 sendScrap 사용 (fallback)
          kakaoShare.sendScrap({ requestUrl: animalUrl });
        }

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

  // 이전 경로 추적 (adoption/verification, 현재 동물 상세는 제외)
  useEffect(() => {
    if (typeof window !== "undefined" && pathname) {
      if (
        !pathname.startsWith("/adoption/verification/") &&
        !pathname.startsWith(`/list/animal/${id}`)
      ) {
        sessionStorage.setItem("lastNonVerificationPath", pathname);
      }
    }
  }, [pathname, id]);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const lastPath = sessionStorage.getItem("lastNonVerificationPath");

      if (!lastPath) {
        router.push("/list/animal");
        return;
      }

      if (lastPath && !lastPath.includes("/adoption/")) {
        router.push(lastPath);
        return;
      }
    }

    // 이전 경로가 없거나 입양 경로뿐이면 리스트로 이동 (입양 절차로는 가지 않도록)
    router.push("/list/animal");
  };

  // 거리 기반 관련 동물 데이터 가져오기
  const { data: relatedAnimalsData, isLoading: relatedAnimalsLoading } =
    useGetRelatedAnimalsByDistance(animal?.id);

  if (isLoading || centerLoading || relatedAnimalsLoading) {
    return <AnimalDetailSkeleton />;
  }

  if (error || !animal) {
    return (
      <Container>
        <div className="py-8 text-center">동물을 찾을 수 없습니다.</div>
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
      <Container className="min-h-screen pb-20 bg-gray-50">
        <TopBar
          variant="variant5"
          className="border-b border-lg"
          left={
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
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
          neutering={animal.neutering || false}
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
          onImageClick={handleImageClick}
        />

        <WaitingStatus admissionDate={animal.admission_date || ""} />

        <AnimalDetails
          announceNumber={animal.announce_number || ""}
          noticeStartDate={animal.notice_sdt || ""}
          noticeEndDate={animal.notice_edt || ""}
          description={animal.description || ""}
          foundLocation={animal.found_location || ""}
          center={center?.name || "-"}
          isCenterSubscriber={isCenterSubscriber}
          specialNotes={animal.special_notes || undefined}
          healthNotes={animal.health_notes ? [animal.health_notes] : []}
        />
        <div className="py-3" />

        {isCenterSubscriber && (
          <SubscriberDetails
            activityLevel={animal.activity_level || 3}
            sensitivity={animal.sensitivity || 3}
            sociability={animal.sociability || 3}
            separationAnxiety={animal.separation_anxiety || undefined}
            basicTraining={animal.basic_training?.toString() || undefined}
            trainerName={animal.trainer_name || undefined}
            trainerComment={animal.trainer_comment || undefined}
          />
        )}
        <div className="py-3" />
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
            trainerName: animal.trainer_name,
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
          name={center?.name || "-"}
          phoneNumber={center?.phoneNumber || "-"}
          location={center?.location || center?.region || undefined}
          adoptionProcedure={
            isCenterSubscriber && center?.adoptionProcedure
              ? center.adoptionProcedure
              : undefined
          }
          isVerified={center?.verified || false}
          className="pb-5 mt-6 mb-8 border-y border-bg"
          isAuthenticated={isAuthenticated}
          onShowLoginModal={() => setShowLoginModal(true)}
        />

        <RelatedAnimals
          pets={relatedAnimals}
          location={((): string => {
            if (!center?.location) return center?.region || "";

            // 행정구역 표기 규칙:
            // - 서울은 "서울특별시"
            // - 6대 광역시는 "OO광역시" (부산/대구/인천/광주/대전/울산)
            // - 그 외는 "도 시" 형태 (예: "경기도 수원시")
            // - 약어(경기/충남/충북/전남/전북/경남/경북/강원), 세종/제주 예외 처리
            const loc = center.location.replace(/\s+/g, " ").trim();
            const firstToken = loc.split(" ")[0] || "";

            // 1) 서울특별시
            if (/^서울/.test(loc)) {
              return "서울특별시";
            }

            // 2) 광역시들
            const metroMap: Record<string, string> = {
              부산: "부산광역시",
              대구: "대구광역시",
              인천: "인천광역시",
              광주: "광주광역시",
              대전: "대전광역시",
              울산: "울산광역시",
            };
            for (const key in metroMap) {
              if (new RegExp(`^${key}`).test(loc)) {
                return metroMap[key];
              }
            }

            // 3) 세종/제주 특별자치
            if (/^세종/.test(loc)) {
              return "세종특별자치시";
            }
            if (/^제주/.test(loc)) {
              return "제주특별자치도";
            }

            // 4) 도/시 추출 및 약어 보정
            const provinceMatch = loc.match(/([가-힣]+도)/);
            const cityMatch = loc.match(/([가-힣]+시)/);
            let provinceName = provinceMatch ? provinceMatch[1] : "";

            // 약어 보정: 경기도/충청남도/충청북도/전라남도/전라북도/경상남도/경상북도/강원도
            const provinceShortMap: Record<string, string> = {
              경기: "경기도",
              충남: "충청남도",
              충북: "충청북도",
              전남: "전라남도",
              전북: "전라북도",
              경남: "경상남도",
              경북: "경상북도",
              강원: "강원도",
            };
            if (!provinceName && provinceShortMap[firstToken]) {
              provinceName = provinceShortMap[firstToken];
            }

            if (provinceName && cityMatch) {
              return `${provinceName} ${cityMatch[1]}`;
            }

            // 4) 도 없이 시만 있는 경우: 시만 반환
            if (cityMatch) {
              return cityMatch[1];
            }

            // 5) 군 단위만 있는 경우: (도 + 군) 또는 군만 반환
            const countyMatch = loc.match(/([가-힣]+군)/);
            if (countyMatch) {
              return provinceName
                ? `${provinceName} ${countyMatch[1]}`
                : countyMatch[1];
            }

            // 6) 도만 있는 경우: 도만 반환
            if (provinceName) {
              return provinceName;
            }

            return center?.region || "";
          })()}
        />
      </Container>

      {isFosterCareAvailable ? (
        <FixedBottomBar
          variant="variant3"
          leftButtonText="임시 보호"
          onLeftButtonClick={handleFosterClick}
          primaryButtonText="입양 문의"
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
          primaryButtonText="입양 문의"
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
          title="공유"
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
          const currentUrl =
            typeof window !== "undefined"
              ? window.location.pathname + (window.location.search || "")
              : `/list/animal/${id}`;
          router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        }}
        subLinkText="나중에 하기"
        onSubLinkClick={() => setShowLoginModal(false)}
      />

      <BottomSheet
        open={showAdoptionBottomSheet}
        onClose={() => setShowAdoptionBottomSheet(false)}
        variant="variant6"
        title="전화 연결"
        description={`보호센터로 전화를 연결합니다.\n운영 시간 외에는 연결이 어려울 수 있습니다.`}
        rightButtonText="전화 연결하기"
        onRightClick={() => {
          if (center?.phoneNumber) {
            window.location.href = `tel:${center.phoneNumber}`;
          }
          setShowAdoptionBottomSheet(false);
        }}
      />

      <BottomSheet
        open={showFosterBottomSheet}
        onClose={() => setShowFosterBottomSheet(false)}
        variant="variant6"
        title="전화 연결"
        description={`보호센터로 전화를 연결합니다.\n운영 시간 외에는 연결이 어려울 수 있습니다.`}
        rightButtonText="전화 연결하기"
        onRightClick={() => {
          if (center?.phoneNumber) {
            window.location.href = `tel:${center.phoneNumber}`;
          }
          setShowFosterBottomSheet(false);
        }}
      />

      {showShareToast && (
        <NotificationToast
          message={shareToastMessage}
          type={shareToastType}
          onClose={() => setShowShareToast(false)}
        />
      )}

      <ImageCarouselModal
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={imageModalData.images}
        initialIndex={imageModalData.initialIndex}
      />

      {/* 입양 절차 모달: 전화 가능 시간이 등록된 센터만 노출 */}
      {center?.callAvailableTime && (
        <CustomModal
          open={showAdoptionProcedureModal}
          onClose={() => setShowAdoptionProcedureModal(false)}
          title="입양 절차 안내"
          description={
            center?.adoptionProcedure || "입양 절차 정보가 없습니다."
          }
          variant="variant1"
          subText={`전화 가능시간: ${center.callAvailableTime}`}
          leftButtonText="전화 문의"
          onLeftClick={handleCenterPhoneCall}
          rightButtonText="입양 신청"
          onRightClick={handleAdoptionProcedureConfirm}
        />
      )}
    </>
  );
}
