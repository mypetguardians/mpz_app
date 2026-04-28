import React from "react";
import Image from "next/image";
import AnimalImage from "../AnimalImage";
import { DotsIndicator } from "../DotsIndicator";
import { cn } from "@/lib/utils";
import { StatusChip } from "./StatusChip";
import { GenderBadge } from "./GenderBadge";
import type { PetCardCommonData } from "./usePetCardData";

export function PetCardVariant2(data: PetCardCommonData) {
  const {
    mainImageUrl, breed, imagePriority, isFemale, rank,
    statusInfo, displayBreedName, description,
    activityLevel, sensitivity, sociability,
    handleCardClick, headingLevel, className,
  } = data;

  const HeadingTag = headingLevel;

  return (
    <div
      className={cn("flex gap-4 items-center h-[154px] cursor-pointer", className)}
      onClick={handleCardClick}
    >
      <div className="flex-shrink-0">
        <div className="relative w-[120px] h-[154px] overflow-hidden rounded-[10px]">
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
          <GenderBadge isFemale={isFemale} />
          <AnimalImage
            imageUrl={mainImageUrl}
            alt={breed || "동물"}
            fill
            priority={imagePriority}
            containerClassName="w-full h-full"
            imageClassName="object-cover"
          />
        </div>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center mb-[6px] gap-1 w-full">
          <StatusChip text={statusInfo.text} colorClass={statusInfo.colorClass} />
          {React.createElement(HeadingTag, {
            className: "text-bk truncate flex-1",
          }, displayBreedName)}
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
}
