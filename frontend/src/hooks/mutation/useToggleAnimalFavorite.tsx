import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface ToggleAnimalFavoriteParams {
  animalId: string;
}

interface ToggleAnimalFavoriteResponse {
  isFavorited: boolean;
  message: string;
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
