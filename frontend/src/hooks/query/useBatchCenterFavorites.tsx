import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface BatchFavoriteStatusResponse {
  statuses: Record<string, boolean>;
}

const batchCheckCenterFavorites = async (
  centerIds: string[]
): Promise<Record<string, boolean>> => {
  const response = await instance.post<BatchFavoriteStatusResponse>(
    "/favorites/centers/batch-status",
    { animal_ids: centerIds }
  );
  return response.data.statuses;
};

export const useBatchCenterFavorites = (
  centerIds: string[],
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["center-favorite-batch", centerIds],
    queryFn: () => batchCheckCenterFavorites(centerIds),
    enabled: enabled && centerIds.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};
