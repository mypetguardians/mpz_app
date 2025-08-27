import React from "react";
import Image from "next/image";
import { GenderMale, GenderFemale, Link } from "@phosphor-icons/react";

import { DotsIndicator } from "@/components/ui/DotsIndicator";
import { MiniButton } from "./MiniButton";
import { Chip } from "./Chip";
import { cn, getRelativeTime } from "@/lib/utils";

// PetCard에서 실제로 사용하는 필드들만 포함하는 타입
type PetCardAnimal = {
  id: string;
  name?: string;
  isFemale?: boolean;
  age?: number;
  breed?: string | null;
  status?:
    | "보호중"
    | "입양완료"
    | "자연사"
    | "무지개다리"
    | "임시보호중"
    | "반환"
    | "방사";
  personality?: string | null;
  centerId?: string;
  createdAt?: string;
  updatedAt?: string;
  animalImages?:
    | Array<{
        id: string;
        imageUrl: string;
        orderIndex: number;
      }>
    | string[];
  waitingDays?: number | null;
  foundLocation?: string | null;
  description?: string | null;
  activityLevel?: number | null;
  sensitivity?: number | null;
  sociability?: number | null;
  weight?: number | null;
  color?: string | null;
  separationAnxiety?: number | null;
  specialNotes?: string | null;
  healthNotes?: string | null;
  basicTraining?: string | null;
  trainerComment?: string | null;
  announceNumber?: string | null;
  announcementDate?: string | null;
};

type PetCardVariant = "primary" | "detail" | "variant3" | "variant4" | "edit";

interface PetCardProps {
  pet: PetCardAnimal;
  variant?: PetCardVariant;
  className?: string;
  imageSize?: "sm" | "md" | "lg" | "full";
  onAdoptionClick?: (pet: PetCardAnimal) => void;
  rank?: number;
  showLocation?: boolean;
  showUpdatedAt?: boolean;
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
}: PetCardProps) {
  const {
    animalImages,
    waitingDays,
    status,
    name,
    isFemale,
    foundLocation,
    description,
    activityLevel,
    sensitivity,
    sociability,
    breed,
  } = pet;

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

  const handleAdoptionClick = () => {
    if (onAdoptionClick) {
      onAdoptionClick(pet);
    }
  };
  if (variant === "detail") {
    return (
      <div
        className={cn(
          "flex gap-4 items-center h-[154px] cursor-pointer",
          className
        )}
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
            <h4 className="text-bk">{breed || "이름 없음"}</h4>
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
              <DotsIndicator count={activityLevel || 0} color="bg-brand" />
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2 w-12">민감도</span>
              <DotsIndicator count={sensitivity || 0} color="bg-yellow" />
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2 w-12">사교성</span>
              <DotsIndicator count={sociability || 0} color="bg-green" />
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
      >
        <div className="relative h-[125px] w-[125px] mb-2 ">
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
          <h6 className="text-dg">{waitingDays || 0}일 째</h6>
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
            <h4 className="text-2xl font-extrabold">{name || "이름 없음"}</h4>
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
      >
        <div className={cn("relative mb-2", getImageSize())}>
          <Image
            src={getImageUrl()}
            alt={breed || "동물"}
            fill
            className="object-cover rounded-[10px]"
          />
          {(waitingDays || 0) > 21 && (
            <div className="absolute bottom-0 left-0 w-full bg-bk/50 text-white text-2xl px-2 py-1 rounded-b-[10px]">
              <h6>{waitingDays || 0}일 째 기다리는 중</h6>
            </div>
          )}
        </div>
        <div className="flex items-center mb-[6px] gap-1">
          <Chip className={getStatusColorClass(status || "보호중")}>
            {["보호중", "방사", "반환", "입양완료"].includes(status || "보호중")
              ? status
              : "🌈"}
          </Chip>
          <h4 className="text-2xl font-extrabold">{name || "이름 없음"}</h4>
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
    >
      <div className={cn("relative mb-2", getImageSize())}>
        <Image
          src={getImageUrl()}
          alt={breed || "동물"}
          fill
          className="object-cover rounded-[10px]"
        />
        {(waitingDays || 0) > 21 && (
          <div className="absolute bottom-0 left-0 w-full bg-bk/50 text-white text-2xl px-2 py-1 rounded-b-[10px]">
            <h6>{waitingDays || 0}일 째 기다리는 중</h6>
          </div>
        )}
      </div>
      <div className="flex items-center mb-[6px] gap-1">
        <Chip className={getStatusColorClass(status || "보호중")}>
          {["보호중", "방사", "반환", "입양완료"].includes(status || "보호중")
            ? status
            : "🌈"}
        </Chip>
        <h4 className="text-2xl font-extrabold">{name || "이름 없음"}</h4>
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
