import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  GetAnimalsParams,
  RawAnimalResponse,
  ActualGetAnimalsResponse,
  RelatedAnimalsResponse,
} from "@/types/animal";

/** 필드 순서를 고정하여 동일 파라미터면 동일 키를 보장 */
function normalizeAnimalParams(params?: GetAnimalsParams) {
  if (!params) return null;
  return {
    status: params.status,
    center_id: params.center_id,
    gender: params.gender,
    weight_min: params.weight_min,
    weight_max: params.weight_max,
    age_min: params.age_min,
    age_max: params.age_max,
    breed: params.breed,
    search: params.search,
    region: params.region,
    city: params.city,
    has_trainer_comment: params.has_trainer_comment,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    page_size: params.page_size,
    protection_status: params.protection_status,
    adoption_status: params.adoption_status,
  };
}

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
    queryKey: ["animals", normalizeAnimalParams(params)],
    queryFn: ({ pageParam = 1 }) => {
      return getAnimals({ ...params, page: pageParam });
    },
    getNextPageParam: (lastPage) => {
      // 백엔드 CustomPageNumberPagination 응답 구조에 맞게 처리
      // nextPage가 명시적으로 제공되면 사용
      if (lastPage.nextPage !== null && lastPage.nextPage !== undefined) {
        return lastPage.nextPage;
      }

      // nextPage가 null이면 더 이상 페이지가 없음
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetBreeds = () => {
  return useQuery({
    queryKey: ["breeds"],
    queryFn: async () => {
      return instance.get("/breeds/");
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
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
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
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
    gcTime: 30 * 60 * 1000, // 30분
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
    enabled: !!animalId,
  });
};
