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
      queryClient.invalidateQueries({
        queryKey: ["centerFavorites"],
      });

      queryClient.invalidateQueries({
        queryKey: ["center", variables.centerId],
      });

      queryClient.invalidateQueries({
        queryKey: ["centers"],
      });

      queryClient.setQueryData(["center-favorite-status", variables.centerId], {
        is_favorited: data.is_favorited,
        total_favorites: data.total_favorites,
      });

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
                  ? { ...center, is_fav: data.is_favorited }
                  : center
              ),
            };
          }
          return oldData;
        }
      );
    },
    onError: (error) => {
      console.error("센터 찜하기 토글 오류:", error);
    },
  });
};
