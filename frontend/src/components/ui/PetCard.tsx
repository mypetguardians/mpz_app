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

// PetCard에서 실제로 사용하는 필드들만 포함하는 타입
type PetCardVariant = "primary" | "variant2" | "variant3" | "variant4" | "edit";

interface PetCardProps {
  pet: PetCardAnimal;
  variant?: PetCardVariant;
  className?: string;
  imageSize?: "sm" | "md" | "lg" | "full";
  onAdoptionClick?: (pet: PetCardAnimal) => void;
  rank?: number;
  showLocation?: boolean;
  showUpdatedAt?: boolean;
  disableNavigation?: boolean;
}

export function PetCard({
  pet,
  variant = "primary",
  className,
  imageSize = "md",
  onAdoptionClick,
  rank,
  showLocation = true,
  showUpdatedAt = false,
  disableNavigation = false,
}: PetCardProps) {
  const router = useRouter();

  const {
    animalImages,
    waitingDays,
    status,
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
    if (!animalImages || animalImages.length === 0) return "/img/dummyImg.jpeg";
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

  const getStatusColorClass = (status?: string) => {
    switch (status) {
      case "보호중":
        return "bg-green/10 text-green";
      case "방사":
      case "반환":
        return "bg-bg text-gr";
      // @TODO 색 적용안됨
      case "입양완료":
        return "bg-brand/10 text-brand";
      default:
        return "bg-yellow/10 text-yellow";
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
              <div className="absolute top-2 left-2 z-10">
                <Image
                  src={`/icon/Badge0${rank}.svg`}
                  alt={`순위 ${rank}`}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </div>
            )}
            <Image
              src={getImageUrl()}
              alt={breed || "동물"}
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center mb-[6px] gap-1">
            <Chip className={getStatusColorClass(status || "보호중")}>
              {["보호중", "방사", "반환", "입양완료"].includes(
                status || "보호중"
              )
                ? status
                : "🌈"}
            </Chip>
            <h4 className="text-bk">
              {(breed || "종 미등록").length > 4
                ? (breed || "종 미등록").slice(0, 4) + "..."
                : breed || "종 미등록"}
            </h4>
            {isFemale ? (
              <GenderFemale
                className="text-red text-xl w-3 h-3"
                weight="bold"
              />
            ) : (
              <GenderMale
                className="text-brand text-xl w-3 h-3"
                weight="bold"
              />
            )}
          </div>
          <div className="text-gray-600 text-sm mb-3 line-clamp-2">
            {description || "설명이 없습니다"}
          </div>
          <div className="flex flex-col gap-1 text-gray-700 text-sm">
            <div className="flex items-center">
              <span className="font-medium mr-2 w-12">활동량</span>
              <DotsIndicator
                count={parseInt(activityLevel?.toString() || "0")}
                color="bg-brand"
              />
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2 w-12">민감도</span>
              <DotsIndicator
                count={parseInt(sensitivity?.toString() || "0")}
                color="bg-yellow"
              />
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2 w-12">사교성</span>
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
          <Chip className={getStatusColorClass(status || "보호중")}>
            {["보호중", "방사", "반환", "입양완료"].includes(status || "보호중")
              ? status
              : "🌈"}
          </Chip>
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
        <Image
          src={getImageUrl()}
          alt={breed || "동물"}
          width={48}
          height={48}
          className="w-13 h-13 object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center mb-[6px] gap-1">
            <Chip className={getStatusColorClass(status || "보호중")}>
              {["보호중", "방사", "반환", "입양완료"].includes(
                status || "보호중"
              )
                ? status
                : "🌈"}
            </Chip>
            <h4 className="text-bk">{breed || "종 미등록"}</h4>
            {isFemale ? (
              <GenderFemale
                className="text-red text-xl w-3 h-3"
                weight="bold"
              />
            ) : (
              <GenderMale
                className="text-brand text-xl w-3 h-3"
                weight="bold"
              />
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
          <Chip className={getStatusColorClass(status || "보호중")}>
            {["보호중", "방사", "반환", "입양완료"].includes(status || "보호중")
              ? status
              : "🌈"}
          </Chip>
          <h4 className="text-bk">
            {(breed || "종 미등록").length > 4
              ? (breed || "종 미등록").slice(0, 4) + "..."
              : breed || "종 미등록"}
          </h4>
          {isFemale ? (
            <GenderFemale className="text-red text-xl w-3 h-3" weight="bold" />
          ) : (
            <GenderMale className="text-brand text-xl w-3 h-3" weight="bold" />
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
      className={cn(
        "flex flex-col items-start min-w-[146px] pb-3 cursor-pointer",
        className
      )}
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
        <Chip className={getStatusColorClass(status || "보호중")}>
          {["보호중", "방사", "반환", "입양완료"].includes(status || "보호중")
            ? status
            : "🌈"}
        </Chip>
        <h4 className="text-bk">
          {(breed || "종 미등록").length > 4
            ? (breed || "종 미등록").slice(0, 4) + "..."
            : breed || "종 미등록"}
        </h4>
        {isFemale ? (
          <GenderFemale className="text-red text-xl w-3 h-3" weight="bold" />
        ) : (
          <GenderMale className="text-brand text-xl w-3 h-3" weight="bold" />
        )}
      </div>
      <h6 className="text-dg">{foundLocation || "위치 정보 없음"}</h6>
    </div>
  );
}
