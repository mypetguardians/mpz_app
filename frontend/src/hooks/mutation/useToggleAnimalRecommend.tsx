import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { Animal } from "@/types/animal";

interface ToggleAnimalRecommendParams {
  animalId: string;
}

interface ToggleAnimalRecommendResponse {
  is_megaphoned: boolean;
  megaphoneCount?: number;
  message: string;
}

const toggleAnimalRecommend = async ({
  animalId,
}: ToggleAnimalRecommendParams): Promise<ToggleAnimalRecommendResponse> => {
  const response = await instance.post(
    `/animals/${animalId}/megaphone`,
    {} // 빈 객체라도 요청 본문 포함
  );
  return response.data;
};

export const useToggleAnimalRecommend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleAnimalRecommend,
    onSuccess: (data, variables) => {
      // 동물 상세 정보 캐시 즉시 업데이트 (추천 상태 업데이트를 위해)
      queryClient.setQueryData(
        ["animals", variables.animalId],
        (oldData: unknown) => {
          if (oldData && typeof oldData === "object" && oldData !== null) {
            const animalData = oldData as Animal;
            return {
              ...animalData,
              isMegaphoned: data.is_megaphoned,
              megaphoneCount: data.megaphoneCount || animalData.megaphoneCount,
            };
          }
          return oldData;
        }
      );

      // 동물 상세 정보 캐시 무효화 (추천 상태 업데이트를 위해)
      queryClient.invalidateQueries({
        queryKey: ["animal", variables.animalId],
      });

      // 전체 동물 목록 캐시 무효화 (추천 개수 업데이트를 위해)
      queryClient.invalidateQueries({
        queryKey: ["animals"],
      });
    },
    onError: (error) => {
      console.error("동물 추천하기 토글 오류:", error);
    },
  });
};
