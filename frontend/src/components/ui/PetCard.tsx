import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GenderMale, GenderFemale, Link } from "@phosphor-icons/react";

import { DotsIndicator } from "@/components/ui/DotsIndicator";
import { MiniButton } from "./MiniButton";
import { Chip } from "./Chip";
import { cn, getRelativeTime } from "@/lib/utils";
// 기존 호환성을 위한 타입 사용
import { PetCardAnimal } from "@/types/animal";
import { AdoptionStatus } from "@/types/adoption";

// PetCard에서 실제로 사용하는 필드들만 포함하는 타입
type PetCardVariant = "primary" | "variant2" | "variant3" | "variant4" | "edit";
type PetCardHeadingLevel = "h4" | "h5";

interface PetCardProps {
  pet: PetCardAnimal;
  variant?: PetCardVariant;
  className?: string;
  imageSize?: "sm" | "md" | "lg" | "full";
  headingLevel?: PetCardHeadingLevel;
  onAdoptionClick?: (pet: PetCardAnimal) => void;
  rank?: number;
  showLocation?: boolean;
  showUpdatedAt?: boolean;
  disableNavigation?: boolean;
  adoptionStatus?: AdoptionStatus | string;
}

export function PetCard({
  pet,
  variant = "primary",
  className,
  imageSize = "md",
  headingLevel = "h4",
  onAdoptionClick,
  rank,
  showLocation = true,
  showUpdatedAt = false,
  disableNavigation = false,
  adoptionStatus,
}: PetCardProps) {
  const router = useRouter();

  const {
    animalImages,
    waitingDays,
    protection_status,
    adoption_status,
    isFemale,
    foundLocation,
    description,
    activityLevel,
    sensitivity,
    sociability,
    breed,
    admissionDate,
  } = pet;
  // admissionDate 기준으로 waitingDays 계산
  const calculateWaitingDays = () => {
    if (!admissionDate) return waitingDays || 0;

    const admission = new Date(admissionDate);
    const today = new Date();

    // 시간을 00:00:00으로 설정하여 날짜만 비교
    admission.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // 시간 차이를 밀리초로 계산
    const timeDiff = today.getTime() - admission.getTime();

    // 밀리초를 일 단위로 변환
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return Math.max(0, daysDiff);
  };

  const currentWaitingDays = calculateWaitingDays();

  // 이미지 URL 추출 헬퍼 함수
  const getImageUrl = () => {
    if (!animalImages || animalImages.length === 0) return "/img/dummyImg.png";
    const firstImage = animalImages[0];
    return typeof firstImage === "string" ? firstImage : firstImage.imageUrl;
  };

  const getImageSize = () => {
    switch (imageSize) {
      case "sm":
        return "h-[100px] w-[100px]";
      case "md":
        return "h-[146px] w-[146px]";
      case "lg":
        return "h-[200px] w-[200px]";
      case "full":
        return "h-auto w-full aspect-square";
      default:
        return "h-[146px] w-[146px]";
    }
  };

  // 동적으로 헤딩 태그를 생성하는 헬퍼 함수
  const createHeadingElement = (
    content: React.ReactNode,
    className?: string
  ) => {
    const HeadingTag = headingLevel;
    return React.createElement(HeadingTag, { className }, content);
  };

  const getStatusInfo = (
    protectionStatus?: string,
    adoptionStatus?: string
  ) => {
    // 보호 상태가 "안락사"나 "자연사"인 경우 우선 표시
    if (protectionStatus === "안락사" || protectionStatus === "자연사") {
      return {
        text: "🌈",
        colorClass: "bg-orange-100/10",
      };
    }

    // 보호 상태가 "반환"인 경우
    if (protectionStatus === "반환") {
      return {
        text: protectionStatus,
        colorClass: "bg-gr/10 text-gr",
      };
    }

    // 보호 상태가 "보호중"인 경우 → "공고중"으로 표시
    if (protectionStatus === "보호중") {
      return {
        text: "공고중",
        colorClass: "bg-green/10 text-green",
      };
    }

    // 입양 상태에 따른 표시
    switch (adoptionStatus) {
      case "입양완료":
        return {
          text: adoptionStatus,
          colorClass: "bg-brand-sub2 text-brand",
        };
      case "입양진행중":
        return {
          text: "입양가능",
          colorClass: "bg-green/10 text-green",
        };
        return {
          text: "입양가능",
          colorClass: "bg-green/10 text-green",
        };
      case "입양불가":
        return {
          text: adoptionStatus,
          colorClass: "bg-red-100/10 text-red-600",
        };
      // 입양 현황에서 사용하는 구체적인 상태들
      case "신청":
        return {
          text: "신청완료",
          colorClass: "bg-yellow/10 text-yellow",
        };
      case "미팅":
        return {
          text: "미팅예정",
          colorClass: "bg-blue/10 text-blue",
        };
      case "계약서작성":
        return {
          text: "계약진행",
          colorClass: "bg-purple/10 text-purple",
        };
      case "모니터링":
        return {
          text: "모니터링",
          colorClass: "bg-green/10 text-green",
        };
      case "취소":
        return {
          text: "취소됨",
          colorClass: "bg-gray/10 text-gray",
        };
      case "입양가능":
      default:
        return {
          text: adoptionStatus || "입양가능",
          colorClass: "bg-green/10 text-green",
        };
    }
  };

  const handleCardClick = () => {
    if (disableNavigation) return;
    router.push(`/list/animal/${pet.id}`);
  };

  const handleAdoptionClick = () => {
    if (onAdoptionClick) {
      onAdoptionClick(pet);
    }
  };

  if (variant === "variant2") {
    return (
      <div
        className={cn(
          "flex gap-4 items-center h-[154px] cursor-pointer",
          className
        )}
        onClick={handleCardClick}
      >
        <div className="flex-shrink-0">
          <div className="relative w-[120px] h-[154px] overflow-hidden">
            {rank && (
              <div className="absolute z-10 top-2 left-2">
                <Image
                  src={`/icon/Badge0${rank}.svg`}
                  alt={`순위 ${rank}`}
                  width={24}
                  height={24}
                />
              </div>
            )}
            <Image
              src={getImageUrl()}
              alt={breed || "동물"}
              fill
              className="object-cover"
              unoptimized={getImageUrl().includes("openapi.animal.go.kr")}
              onError={(e) => {
                console.warn("이미지 로딩 실패:", getImageUrl());
                // 에러 시 기본 이미지로 대체
                e.currentTarget.src = "/img/dummyImg.png";
              }}
            />
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center mb-[6px] gap-1">
            {(() => {
              const statusInfo = getStatusInfo(
                protection_status,
                adoption_status
              );
              return (
                <Chip className={statusInfo.colorClass}>{statusInfo.text}</Chip>
              );
            })()}
            {createHeadingElement(
              breed || "종 미등록",
              "text-bk truncate max-w-[80px]"
            )}
            {isFemale ? (
              <GenderFemale className="text-red" weight="bold" size={12} />
            ) : (
              <GenderMale className="text-brand" weight="bold" size={12} />
            )}
          </div>
          <div className="mb-3 text-sm text-gray-600 line-clamp-2">
            {description || "설명이 없습니다"}
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700">
            <div className="flex items-center">
              <span className="w-12 mr-2 font-medium">활동량</span>
              <DotsIndicator
                count={parseInt(activityLevel?.toString() || "0")}
                color="bg-brand"
              />
            </div>
            <div className="flex items-center">
              <span className="w-12 mr-2 font-medium">민감도</span>
              <DotsIndicator
                count={parseInt(sensitivity?.toString() || "0")}
                color="bg-yellow"
              />
            </div>
            <div className="flex items-center">
              <span className="w-12 mr-2 font-medium">사교성</span>
              <DotsIndicator
                count={parseInt(sociability?.toString() || "0")}
                color="bg-green"
              />
            </div>
          </div>
        </div>
      </div>
    );
  } // Variant 3
  else if (variant === "variant3") {
    return (
      <div
        className={cn("flex flex-col items-start cursor-pointer", className)}
        onClick={handleCardClick}
      >
        <div className={cn("relative mb-2", getImageSize())}>
          <Image
            src={getImageUrl()}
            alt={breed || "동물"}
            fill
            className="object-cover rounded-[10px]"
          />
        </div>
        <div className="flex items-center mb-[6px] gap-1">
          {(() => {
            const statusInfo = getStatusInfo(
              protection_status,
              adoption_status
            );
            return (
              <Chip className={statusInfo.colorClass}>{statusInfo.text}</Chip>
            );
          })()}
          <h6 className="text-dg">{currentWaitingDays || 0}일 째</h6>
        </div>
        <h6 className="text-dg">{foundLocation || "위치 정보 없음"}</h6>
      </div>
    );
  } else if (variant === "variant4") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 border border-bg rounded-lg cursor-pointer",
          className
        )}
        onClick={handleCardClick}
      >
        <div className="relative w-[52px] h-[52px] rounded overflow-hidden flex-shrink-0">
          <Image
            src={getImageUrl()}
            alt={breed || "동물"}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center mb-[6px] gap-1">
            {(() => {
              const statusInfo = getStatusInfo(protection_status);
              return (
                <Chip className={statusInfo.colorClass}>{statusInfo.text}</Chip>
              );
            })()}
            {createHeadingElement(breed || "종 미등록", "text-bk")}
            {isFemale ? (
              <GenderFemale className="text-red" weight="bold" size={12} />
            ) : (
              <GenderMale className="text-brand" weight="bold" size={12} />
            )}
          </div>
          <p className="text-xs text-gray-500">
            {showUpdatedAt && pet.updatedAt
              ? getRelativeTime(pet.updatedAt)
              : showLocation
              ? foundLocation || "위치 정보 없음"
              : null}
          </p>
        </div>
      </div>
    );
  } else if (variant === "edit") {
    return (
      <div
        className={cn(
          "flex flex-col items-start min-w-[146px] pb-3 cursor-pointer",
          className
        )}
      >
        <div className={cn("relative mb-2", getImageSize())}>
          <Image
            src={getImageUrl()}
            alt={breed || "동물"}
            fill
            className="object-cover rounded-[10px]"
          />
          {(currentWaitingDays || 0) > 21 && (
            <div className="absolute bottom-0 left-0 w-full bg-bk/50 text-white text-2xl px-2 py-1 rounded-b-[10px]">
              <h6>{currentWaitingDays || 0}일 째 기다리는 중</h6>
            </div>
          )}
        </div>
        <div className="flex items-center mb-[6px] gap-1">
          {(() => {
            const statusInfo = getStatusInfo(
              protection_status,
              adoption_status
            );
            return (
              <Chip className={statusInfo.colorClass}>{statusInfo.text}</Chip>
            );
          })()}
          {createHeadingElement(
            breed || "종 미등록",
            cn("text-bk truncate max-w-[80px]")
          )}
          {isFemale ? (
            <GenderFemale className="text-red" weight="bold" />
          ) : (
            <GenderMale className="text-brand" weight="bold" />
          )}
        </div>
        <h6 className="text-dg">{foundLocation || "위치 정보 없음"}</h6>
        <MiniButton
          variant="outline"
          leftIcon={<Link />}
          text="입양 신청서"
          className="w-full mt-[10px]"
          onClick={handleAdoptionClick}
        />
      </div>
    );
  }

  // Variant 1 - Primary
  return (
    <div
      className={cn("flex flex-col items-start pb-3 cursor-pointer", className)}
      onClick={handleCardClick}
    >
      <div className={cn("relative mb-2", getImageSize())}>
        <Image
          src={getImageUrl()}
          alt={breed || "동물"}
          fill
          className="object-cover rounded-[10px]"
        />
        {(currentWaitingDays || 0) > 21 && (
          <div className="absolute bottom-0 left-0 w-full bg-bk/50 text-white text-2xl px-2 py-1 rounded-b-[10px]">
            <h6>{currentWaitingDays || 0}일 째 기다리는 중</h6>
          </div>
        )}
      </div>
      <div className="flex items-center mb-[6px] gap-1">
        {(() => {
          // adoptionStatus prop이 전달된 경우 우선 사용, 없으면 기본 adoption_status 사용
          const statusToUse = adoptionStatus || adoption_status;
          const statusInfo = getStatusInfo(protection_status, statusToUse);
          return (
            <Chip className={statusInfo.colorClass}>{statusInfo.text}</Chip>
          );
        })()}
        {createHeadingElement(
          breed || "종 미등록",
          cn("text-bk truncate max-w-[60px]")
        )}
        {isFemale ? (
          <GenderFemale className="text-red" weight="bold" />
        ) : (
          <GenderMale className="text-brand" weight="bold" />
        )}
      </div>
      <h6 className="text-dg">{foundLocation || "위치 정보 없음"}</h6>
    </div>
  );
}
