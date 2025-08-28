import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  CheckCenterFavoriteParams,
  CheckCenterFavoriteResponse,
} from "@/types/center";

const checkCenterFavorite = async ({
  centerId,
}: CheckCenterFavoriteParams): Promise<CheckCenterFavoriteResponse> => {
  const response = await instance.get<CheckCenterFavoriteResponse>(
    `/favorites/centers/${centerId}/status`
  );
  return response.data;
};

export const useCheckCenterFavorite = (
  centerId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["center-favorite-status", centerId],
    queryFn: () => checkCenterFavorite({ centerId }),
    enabled: enabled && !!centerId,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
    retry: 1,
    refetchOnWindowFocus: true,
  });
};
