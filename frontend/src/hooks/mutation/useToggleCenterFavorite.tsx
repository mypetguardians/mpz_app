import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  ToggleCenterFavoriteParams,
  ToggleCenterFavoriteResponse,
} from "@/types/center";

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

      // 센터 상세 정보 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["center", variables.centerId],
      });

      // 전체 센터 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["centers"],
      });

      // 즉시 UI 업데이트를 위한 optimistic update
      const isFavorited =
        data.isFavorited !== undefined ? data.isFavorited : data.is_favorited;
      queryClient.setQueryData(["center-favorite-status", variables.centerId], {
        isFavorited: isFavorited,
        totalFavorites: data.totalFavorites || data.total_favorites || 0,
      });

      // 센터 목록에서 해당 센터의 찜하기 상태도 즉시 업데이트
      queryClient.setQueriesData(
        { queryKey: ["centers"] },
        (
          oldData:
            | { data?: Array<{ id: string; [key: string]: unknown }> }
            | undefined
        ) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: oldData.data.map((center) =>
                center.id === variables.centerId
                  ? { ...center, is_fav: isFavorited }
                  : center
              ),
            };
          }
          return oldData;
        }
      );
    },
    onError: (error) => {
      // 에러 처리
      console.error("센터 찜하기 토글 오류:", error);
    },
  });
};
