import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface BatchFavoriteStatusResponse {
  statuses: Record<string, boolean>;
}

const batchCheckFavorites = async (
  animalIds: string[]
): Promise<Record<string, boolean>> => {
  console.log("[batch-favorites] 요청:", { count: animalIds.length, ids: animalIds.slice(0, 3) });
  const response = await instance.post<BatchFavoriteStatusResponse>(
    "/favorites/animals/batch-status",
    { animal_ids: animalIds }
  );
  console.log("[batch-favorites] 응답:", { raw: response.data, statuses: response.data.statuses });
  const favoritedCount = Object.values(response.data.statuses || {}).filter(Boolean).length;
  console.log("[batch-favorites] 찜된 수:", favoritedCount);
  return response.data.statuses;
};

export const useBatchAnimalFavorites = (
  animalIds: string[],
  enabled: boolean = true
) => {
  console.log("[batch-favorites] hook:", { enabled, idsCount: animalIds.length, actualEnabled: enabled && animalIds.length > 0 });
  return useQuery({
    queryKey: ["animal-favorite-batch", animalIds],
    queryFn: () => batchCheckFavorites(animalIds),
    enabled: enabled && animalIds.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};
