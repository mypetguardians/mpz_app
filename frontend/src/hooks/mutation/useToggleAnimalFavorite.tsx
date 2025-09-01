import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface ToggleAnimalFavoriteParams {
  animalId: string;
}

interface ToggleAnimalFavoriteResponse {
  is_favorited: boolean;
  total_favorites: number;
  message?: string;
}

const toggleAnimalFavorite = async ({
  animalId,
}: ToggleAnimalFavoriteParams): Promise<ToggleAnimalFavoriteResponse> => {
  const response = await instance.post<ToggleAnimalFavoriteResponse>(
    `/favorites/animals/${animalId}/toggle`
  );
  return response.data;
};

export const useToggleAnimalFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleAnimalFavorite,
    onSuccess: (data, variables) => {
      // 찜한 동물 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["animal-favorites"],
      });

      // 찜하기 상태 캐시 즉시 업데이트
      queryClient.setQueryData(["animal-favorite-status", variables.animalId], {
        is_favorited: data.is_favorited,
        total_favorites: data.total_favorites,
      });

      // 동물 상세 정보 캐시 무효화 (찜 개수 업데이트를 위해)
      queryClient.invalidateQueries({
        queryKey: ["animal", variables.animalId],
      });

      // 전체 동물 목록 캐시 무효화 (찜 개수 업데이트를 위해)
      queryClient.invalidateQueries({
        queryKey: ["animals"],
      });
    },
    onError: (error) => {
      console.error("동물 찜하기 토글 오류:", error);
    },
  });
};
