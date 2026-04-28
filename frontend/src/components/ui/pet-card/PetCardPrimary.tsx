import React from "react";
import AnimalImage from "../AnimalImage";
import { cn } from "@/lib/utils";
import { StatusChip } from "./StatusChip";
import { GenderBadge } from "./GenderBadge";
import type { PetCardCommonData } from "./usePetCardData";

export function PetCardPrimary(data: PetCardCommonData) {
  const {
    mainImageUrl, breed, imagePriority, isFemale, currentWaitingDays,
    imageOverlay, statusInfo, displayBreedName, headerAction,
    foundLocation, handleCardClick, imageSizeClass, headingLevel, className,
  } = data;

  const HeadingTag = headingLevel;

  return (
    <div
      className={cn("flex flex-col items-start cursor-pointer", className)}
      onClick={handleCardClick}
    >
      <div className={cn("relative mb-2", imageSizeClass)}>
        <AnimalImage
          imageUrl={mainImageUrl}
          alt={breed || "동물"}
          fill
          priority={imagePriority}
          containerClassName="w-full h-full"
          imageClassName="object-cover rounded-[10px]"
        />
        <GenderBadge isFemale={isFemale} />
        {(currentWaitingDays || 0) > 7 ? (
          <div className="absolute bottom-0 left-0 w-full bg-bk/50 text-white text-2xl px-2 py-1 rounded-b-[10px]">
            <h6>{currentWaitingDays || 0}일 째 기다리는 중</h6>
            {imageOverlay && (
              <div className="absolute right-2 bottom-1 z-10">
                {imageOverlay}
              </div>
            )}
          </div>
        ) : (
          imageOverlay && (
            <div className="absolute bottom-2 right-2 z-10">{imageOverlay}</div>
          )
        )}
      </div>
      <div className="flex items-center mb-[6px] gap-1 w-full justify-between">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <StatusChip text={statusInfo.text} colorClass={statusInfo.colorClass} />
          {React.createElement(HeadingTag, {
            className: cn("text-bk truncate flex-1"),
          }, displayBreedName)}
        </div>
        {headerAction && (
          <div className="ml-2 flex-shrink-0">{headerAction}</div>
        )}
      </div>
      <h6 className="text-dg">{foundLocation || "위치 정보 없음"}</h6>
    </div>
  );
}
