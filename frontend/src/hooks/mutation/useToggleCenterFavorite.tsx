import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface ToggleCenterFavoriteParams {
  centerId: string;
}

interface ToggleCenterFavoriteResponse {
  isFavorited: boolean;
  message: string;
  totalFavorites: number;
}

const toggleCenterFavorite = async ({
  centerId,
}: ToggleCenterFavoriteParams): Promise<ToggleCenterFavoriteResponse> => {
  const response = await instance.post<ToggleCenterFavoriteResponse>(
    `/favorites/centers/${centerId}/toggle`
  );
  return response.data;
};

export const useToggleCenterFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleCenterFavorite,
    onSuccess: (data, variables) => {
      // 찜한 센터 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["centerFavorites"],
      });

      // 센터 찜 상태 확인 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["center-favorite-status", variables.centerId],
      });

      // 센터 상세 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["center", variables.centerId],
      });

      // 전체 센터 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["centers"],
      });
    },
    onError: (error) => {
      console.error("센터 찜하기 토글 오류:", error);
    },
  });
};
