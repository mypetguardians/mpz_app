import React from "react";
import { Link } from "@phosphor-icons/react";
import AnimalImage from "../AnimalImage";
import { MiniButton } from "../MiniButton";
import { cn } from "@/lib/utils";
import { StatusChip } from "./StatusChip";
import { GenderBadge } from "./GenderBadge";
import type { PetCardCommonData } from "./usePetCardData";

export function PetCardEdit(data: PetCardCommonData) {
  const {
    mainImageUrl, breed, imagePriority, isFemale, currentWaitingDays,
    imageOverlay, statusInfo, displayBreedName, foundLocation,
    handleCardClick, handleAdoptionClick, imageSizeClass, headingLevel, className,
  } = data;

  const HeadingTag = headingLevel;

  return (
    <div
      className={cn(
        "flex flex-col items-start min-w-[146px] pb-3 cursor-pointer h-full",
        className
      )}
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
          <div className="absolute bottom-0 left-0 w-full bg-bk/50 text-white text-2xl px-2 py-1 rounded-b-[10px] flex items-center justify-between">
            <h6>{currentWaitingDays || 0}일 째 기다리는 중</h6>
            {imageOverlay && <div className="z-10">{imageOverlay}</div>}
          </div>
        ) : (
          imageOverlay && (
            <div className="absolute bottom-2 right-2 z-10">
              {imageOverlay}
            </div>
          )
        )}
      </div>
      <div className="flex items-center mb-[6px] gap-1 w-full">
        <StatusChip text={statusInfo.text} colorClass={statusInfo.colorClass} />
        {React.createElement(HeadingTag, {
          className: cn("text-bk truncate flex-1"),
        }, displayBreedName)}
      </div>
      <h6 className="text-dg min-h-[40px] max-h-[40px] overflow-hidden">
        {foundLocation || "위치 정보 없음"}
      </h6>
      <div
        className="w-full mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <MiniButton
          variant="outline"
          leftIcon={<Link />}
          text="입양 신청서"
          className="w-full mt-[10px]"
          onClick={handleAdoptionClick}
        />
      </div>
    </div>
  );
}
