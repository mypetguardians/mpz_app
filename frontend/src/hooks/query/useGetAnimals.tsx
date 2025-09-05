import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  GetAnimalsParams,
  RawAnimalResponse,
  ActualGetAnimalsResponse,
  RelatedAnimalsResponse,
} from "@/types/animal";

const getAnimals = async (
  params?: GetAnimalsParams
): Promise<ActualGetAnimalsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `/animals/?${searchParams.toString()}`;

  const response = await instance.get<ActualGetAnimalsResponse>(endpoint);

  return response.data;
};

export const useGetAnimals = (params?: GetAnimalsParams) => {
  return useInfiniteQuery({
    queryKey: ["animals", params],
    queryFn: ({ pageParam = 1 }) => {
      return getAnimals({ ...params, page: pageParam });
    },
    getNextPageParam: (lastPage) => {
      // 여러 가능한 필드 확인
      const hasNext =
        lastPage.hasNext ||
        (lastPage.nextPage !== null && lastPage.nextPage !== undefined) ||
        (lastPage.page &&
          lastPage.totalPages &&
          lastPage.page < lastPage.totalPages) ||
        (lastPage.curPage &&
          lastPage.pageCnt &&
          lastPage.curPage < lastPage.pageCnt);

      const nextPage =
        lastPage.nextPage ||
        (lastPage.page ? lastPage.page + 1 : undefined) ||
        (lastPage.curPage ? lastPage.curPage + 1 : undefined);

      if (hasNext && nextPage) {
        return nextPage;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useGetBreeds = () => {
  return useQuery({
    queryKey: ["breeds"],
    queryFn: async () => {
      return instance.get("/breeds/");
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

export const useGetAnimalById = (animalId: string | null) => {
  return useQuery({
    queryKey: ["animals", animalId],
    queryFn: async (): Promise<RawAnimalResponse> => {
      const response = await instance.get<RawAnimalResponse>(
        `/animals/${animalId}`
      );
      return response.data;
    },
    enabled: !!animalId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 거리 기반 관련 동물 조회 훅
export const useGetRelatedAnimalsByDistance = (
  animalId?: string,
  limit: number = 6
) => {
  return useQuery<RelatedAnimalsResponse[]>({
    queryKey: ["relatedAnimals", animalId, limit],
    queryFn: async () => {
      if (!animalId) {
        throw new Error("동물 ID가 필요합니다");
      }

      const searchParams = new URLSearchParams();
      if (limit) {
        searchParams.append("limit", limit.toString());
      }

      const endpoint = `/animals/${animalId}/related?${searchParams.toString()}`;
      const response = await instance.get<RelatedAnimalsResponse[]>(endpoint);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!animalId, // animalId가 있을 때만 실행
  });
};
