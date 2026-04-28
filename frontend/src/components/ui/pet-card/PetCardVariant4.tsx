import React from "react";
import AnimalImage from "../AnimalImage";
import { cn, getRelativeTime } from "@/lib/utils";
import { StatusChip } from "./StatusChip";
import { GenderBadge } from "./GenderBadge";
import type { PetCardCommonData } from "./usePetCardData";

export function PetCardVariant4(data: PetCardCommonData) {
  const {
    pet, mainImageUrl, breed, imagePriority, isFemale,
    statusInfo, displayBreedName, foundLocation,
    showLocation, showUpdatedAt, adoptionStatus,
    handleCardClick, headingLevel, className,
  } = data;

  const HeadingTag = headingLevel;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 border border-bg rounded-lg cursor-pointer",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="relative w-[52px] h-[52px] rounded overflow-hidden flex-shrink-0">
        <GenderBadge isFemale={isFemale} size="sm" />
        <AnimalImage
          imageUrl={mainImageUrl}
          alt={breed || "동물"}
          fill
          priority={imagePriority}
          containerClassName="w-full h-full"
          imageClassName="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-[6px] gap-1 w-full">
          <StatusChip text={statusInfo.text} colorClass={statusInfo.colorClass} />
          {React.createElement(HeadingTag, {
            className: "text-bk truncate flex-1",
          }, displayBreedName)}
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
}
