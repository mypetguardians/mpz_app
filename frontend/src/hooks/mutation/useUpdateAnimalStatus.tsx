import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateAnimalStatusData {
  animal_id: string; // path parameter
  protection_status?: string | null; // 새로운 보호 상태
  adoption_status?: string | null; // 새로운 입양 상태
}

interface UpdateAnimalStatusResponse {
  id: string;
  protection_status: string;
  adoption_status: string;
  updated_at: string;
}

export const useUpdateAnimalStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAnimalStatusResponse, Error, UpdateAnimalStatusData>(
    {
      mutationFn: async (data: UpdateAnimalStatusData) => {
        const { animal_id, ...statusData } = data;
        const response = await instance.patch<UpdateAnimalStatusResponse>(
          `/v1/animals/${animal_id}/status`,
          statusData
        );
        return response.data;
      },
      onSuccess: (data) => {
        // 특정 동물 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ["animals", data.id] });

        // 모든 동물 관련 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ["animals"] });
        queryClient.invalidateQueries({ queryKey: ["myCenterAnimals"] });
        queryClient.invalidateQueries({ queryKey: ["relatedAnimals"] });

        // 센터 관련 캐시도 무효화 (통계 등)
        queryClient.invalidateQueries({ queryKey: ["center"] });

        console.log("동물 상태 변경 성공 - 캐시 무효화 완료");
      },
      onError: (error) => {
        console.error("동물 상태 변경 실패:", error);
      },
    }
  );
};
