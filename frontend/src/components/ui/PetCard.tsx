import { PetCardAnimal } from "@/types/animal";
import { AdoptionStatus } from "@/types/adoption";
import { usePetCardData } from "./pet-card/usePetCardData";
import { PetCardPrimary } from "./pet-card/PetCardPrimary";
import { PetCardVariant2 } from "./pet-card/PetCardVariant2";
import { PetCardVariant3 } from "./pet-card/PetCardVariant3";
import { PetCardVariant4 } from "./pet-card/PetCardVariant4";
import { PetCardEdit } from "./pet-card/PetCardEdit";

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
  imageOverlay?: React.ReactNode;
  headerAction?: React.ReactNode;
  imagePriority?: boolean;
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
  imageOverlay,
  headerAction,
  imagePriority,
}: PetCardProps) {
  const data = usePetCardData({
    pet,
    imageSize,
    headingLevel,
    onAdoptionClick,
    rank,
    showLocation,
    showUpdatedAt,
    disableNavigation,
    adoptionStatus,
    imageOverlay,
    headerAction,
    imagePriority,
    className,
  });

  switch (variant) {
    case "variant2": return <PetCardVariant2 {...data} />;
    case "variant3": return <PetCardVariant3 {...data} />;
    case "variant4": return <PetCardVariant4 {...data} />;
    case "edit":     return <PetCardEdit {...data} />;
    default:         return <PetCardPrimary {...data} />;
  }
}
