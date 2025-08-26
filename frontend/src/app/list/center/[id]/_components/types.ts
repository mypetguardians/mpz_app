import type {
  CenterResponseSchema,
  AnimalResponseSchema,
} from "@/server/openapi/routes";
import { z } from "zod";

export type Center = z.infer<typeof CenterResponseSchema>;
export type Animal = z.infer<typeof AnimalResponseSchema>;
export type TabType = "info" | "animals";

export interface CenterDetailProps {
  center: Center;
  animals: Animal[];
  animalsLoading: boolean;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}
