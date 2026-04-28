import AnimalImage from "../AnimalImage";
import { cn } from "@/lib/utils";
import { StatusChip } from "./StatusChip";
import type { PetCardCommonData } from "./usePetCardData";

export function PetCardVariant3(data: PetCardCommonData) {
  const {
    mainImageUrl, breed, imagePriority, imageOverlay,
    statusInfo, currentWaitingDays, foundLocation,
    handleCardClick, imageSizeClass, className,
  } = data;

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
        {imageOverlay && (
          <div className="absolute bottom-2 right-2 z-10">{imageOverlay}</div>
        )}
      </div>
      <div className="flex items-center mb-[6px] gap-1">
        <StatusChip text={statusInfo.text} colorClass={statusInfo.colorClass} />
        <h6 className="text-dg">{currentWaitingDays || 0}일 째</h6>
      </div>
      <h6 className="text-dg">{foundLocation || "위치 정보 없음"}</h6>
    </div>
  );
}
