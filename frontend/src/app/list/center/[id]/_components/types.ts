import type { Center } from "@/types/center";
import type { Animal } from "@/types/animal";

export type { Center, Animal };
export type TabType = "info" | "animals";

export interface CenterDetailProps {
  center: Center;
  animals: Animal[];
  animalsLoading: boolean;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}
