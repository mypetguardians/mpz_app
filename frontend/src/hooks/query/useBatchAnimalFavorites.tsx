import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface BatchFavoriteStatusResponse {
  statuses: Record<string, boolean>;
}

const batchCheckFavorites = async (
  animalIds: string[]
): Promise<Record<string, boolean>> => {
  const response = await instance.post<BatchFavoriteStatusResponse>(
    "/favorites/animals/batch-status",
    { animal_ids: animalIds }
  );
  return response.data.statuses;
};

export const useBatchAnimalFavorites = (
  animalIds: string[],
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["animal-favorite-batch", animalIds],
    queryFn: () => batchCheckFavorites(animalIds),
    enabled: enabled && animalIds.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};
