import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDisplayBreedName } from "@/lib/animal-utils";
import { PetCardAnimal } from "@/types/animal";
import { AdoptionStatus } from "@/types/adoption";

export interface PetCardCommonData {
  pet: PetCardAnimal;
  displayBreedName: string;
  currentWaitingDays: number;
  mainImageUrl: string;
  statusInfo: { text: string; colorClass: string };
  isFemale: boolean;
  foundLocation: string;
  description: string;
  breed: string;
  activityLevel: number | string | null;
  sensitivity: number | string | null;
  sociability: number | string | null;
  protection_status: string;
  adoption_status: string;
  handleCardClick: () => void;
  handleAdoptionClick: () => void;
  imageSizeClass: string;
  headingLevel: "h4" | "h5";
  rank?: number;
  showLocation: boolean;
  showUpdatedAt: boolean;
  imageOverlay?: React.ReactNode;
  headerAction?: React.ReactNode;
  imagePriority?: boolean;
  className?: string;
  adoptionStatus?: AdoptionStatus | string;
}

export function getStatusInfo(
  protectionStatus?: string,
  adoptionStatus?: string
): { text: string; colorClass: string } {
  switch (protectionStatus) {
    case "보호중":
      return { text: "보호중", colorClass: "bg-green/10 text-green" };
    case "임시보호":
      return { text: "임시보호", colorClass: "bg-blue/10 text-blue" };
    case "기증":
      return { text: "기증", colorClass: "bg-purple/10 text-purple" };
    case "안락사":
    case "자연사":
      return { text: "🌈", colorClass: "bg-orange-100/10" };
    case "반환":
      return { text: "반환", colorClass: "bg-gr/10 text-gr" };
    case "방사":
      return { text: "방사", colorClass: "bg-gray/10 text-gray" };
    case "입양완료":
      return { text: "입양완료", colorClass: "bg-brand-sub2 text-brand" };
    default:
      switch (adoptionStatus) {
        case "입양완료":
          return { text: adoptionStatus, colorClass: "bg-brand-sub2 text-brand" };
        case "입양진행중":
          return { text: "입양가능", colorClass: "bg-green/10 text-green" };
        case "입양불가":
          return { text: adoptionStatus, colorClass: "bg-red-100/10 text-red-600" };
        case "신청":
          return { text: "신청", colorClass: "bg-green/10 text-green" };
        case "미팅":
          return { text: "미팅", colorClass: "bg-green/10 text-green" };
        case "계약서작성":
          return { text: "계약서작성", colorClass: "bg-yellow/10 text-yellow" };
        case "모니터링":
          return { text: "모니터링", colorClass: "bg-blue/10 text-blue" };
        case "취소":
          return { text: "취소", colorClass: "bg-gray/10 text-gray" };
        case "입양가능":
        default:
          return { text: "입양가능", colorClass: "bg-green/10 text-green" };
      }
  }
}

function calculateWaitingDays(admissionDate?: string, waitingDays?: number): number {
  if (!admissionDate) return waitingDays || 0;
  const admission = new Date(admissionDate);
  const today = new Date();
  admission.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const timeDiff = today.getTime() - admission.getTime();
  return Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
}

function getImageUrl(animalImages?: PetCardAnimal["animalImages"]): string {
  if (!animalImages || animalImages.length === 0) return "/img/dummyImg.png";
  const firstImage = animalImages[0];
  return typeof firstImage === "string" ? firstImage : firstImage.imageUrl;
}

function getImageSizeClass(imageSize: "sm" | "md" | "lg" | "full"): string {
  switch (imageSize) {
    case "sm": return "h-[100px] w-[100px]";
    case "md": return "h-[146px] w-[146px]";
    case "lg": return "h-[200px] w-[200px]";
    case "full": return "h-auto w-full aspect-square";
    default: return "h-[146px] w-[146px]";
  }
}

interface UsePetCardDataProps {
  pet: PetCardAnimal;
  imageSize?: "sm" | "md" | "lg" | "full";
  headingLevel?: "h4" | "h5";
  onAdoptionClick?: (pet: PetCardAnimal) => void;
  rank?: number;
  showLocation?: boolean;
  showUpdatedAt?: boolean;
  disableNavigation?: boolean;
  adoptionStatus?: AdoptionStatus | string;
  imageOverlay?: React.ReactNode;
  headerAction?: React.ReactNode;
  imagePriority?: boolean;
  className?: string;
}

export function usePetCardData({
  pet,
  imageSize = "md",
  headingLevel = "h4",
  onAdoptionClick,
  rank,
  showLocation = true,
  showUpdatedAt = false,
  disableNavigation = false,
  adoptionStatus,
  imageOverlay,
  headerAction,
  imagePriority,
  className,
}: UsePetCardDataProps): PetCardCommonData {
  const router = useRouter();

  const displayBreedName = useMemo(
    () => getDisplayBreedName(pet.breed, pet.name),
    [pet.breed, pet.name]
  );

  const currentWaitingDays = useMemo(
    () => calculateWaitingDays(pet.admissionDate ?? undefined, pet.waitingDays ?? undefined),
    [pet.admissionDate, pet.waitingDays]
  );

  const mainImageUrl = useMemo(
    () => getImageUrl(pet.animalImages),
    [pet.animalImages]
  );

  const statusInfo = useMemo(
    () => getStatusInfo(pet.protection_status, adoptionStatus || pet.adoption_status),
    [pet.protection_status, pet.adoption_status, adoptionStatus]
  );

  const imageSizeClass = getImageSizeClass(imageSize);

  const handleCardClick = () => {
    if (disableNavigation) return;
    router.push(`/list/animal/${pet.id}`);
  };

  const handleAdoptionClick = () => {
    onAdoptionClick?.(pet);
  };

  return {
    pet,
    displayBreedName,
    currentWaitingDays,
    mainImageUrl,
    statusInfo,
    isFemale: pet.isFemale ?? false,
    foundLocation: pet.foundLocation || "",
    description: pet.description || "",
    breed: pet.breed || "",
    activityLevel: pet.activityLevel ?? null,
    sensitivity: pet.sensitivity ?? null,
    sociability: pet.sociability ?? null,
    protection_status: pet.protection_status || "",
    adoption_status: pet.adoption_status || "",
    handleCardClick,
    handleAdoptionClick,
    imageSizeClass,
    headingLevel,
    rank,
    showLocation,
    showUpdatedAt,
    imageOverlay,
    headerAction,
    imagePriority,
    className,
    adoptionStatus,
  };
}
