import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CheckAnimalFavoriteParams {
  animalId: string;
}

interface CheckAnimalFavoriteResponse {
  isFavorited: boolean;
}

const checkAnimalFavorite = async ({
  animalId,
}: CheckAnimalFavoriteParams): Promise<CheckAnimalFavoriteResponse> => {
  const response = await instance.get<CheckAnimalFavoriteResponse>(
    `/favorites/animals/${animalId}/status`
  );
  return response.data;
};

export const useCheckAnimalFavorite = (
  animalId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["animal-favorite-status", animalId],
    queryFn: () => checkAnimalFavorite({ animalId }),
    enabled: enabled && !!animalId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
