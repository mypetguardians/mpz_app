import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CheckAnimalRecommendParams {
  animalId: string;
}

interface CheckAnimalRecommendResponse {
  isRecommended: boolean;
}

const checkAnimalRecommend = async ({
  animalId,
}: CheckAnimalRecommendParams): Promise<CheckAnimalRecommendResponse> => {
  const response = await instance.get<CheckAnimalRecommendResponse>(
    `/recommendations/animals/${animalId}/status`
  );
  return response.data;
};

export const useCheckAnimalRecommend = (
  animalId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["animal-recommend-status", animalId],
    queryFn: () => checkAnimalRecommend({ animalId }),
    enabled: enabled && !!animalId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
