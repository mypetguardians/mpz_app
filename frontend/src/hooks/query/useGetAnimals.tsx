import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AnimalResponseSchema } from "@/server/openapi/routes/animal";
import { z } from "zod";
import instance from "@/lib/axios-instance";

// 타입 별칭으로 한 번만 정의
type Animal = z.infer<typeof AnimalResponseSchema>;

interface GetAnimalsParams {
  status?:
    | "보호중"
    | "입양완료"
    | "무지개다리"
    | "임시보호중"
    | "반환"
    | "방사";
  centerId?: string;
  region?:
    | "서울"
    | "부산"
    | "대구"
    | "인천"
    | "광주"
    | "대전"
    | "울산"
    | "세종"
    | "경기"
    | "강원"
    | "충북"
    | "충남"
    | "전북"
    | "전남"
    | "경북"
    | "경남"
    | "제주";
  weight?: "10kg_under" | "25kg_under" | "over_25kg";
  age?: "2_under" | "7_under" | "over_7";
  gender?: "male" | "female";
  hasTrainerComment?: "true" | "false";
  breed?: string;
  page?: number;
  limit?: number;
}

interface GetAnimalsResponse {
  animals: Animal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const getAnimals = async (
  params?: GetAnimalsParams
): Promise<GetAnimalsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `/animals/?${searchParams.toString()}`;
  const response = await instance.get<GetAnimalsResponse>(endpoint);
  return response.data;
};

export const useGetAnimals = (params?: GetAnimalsParams) => {
  return useInfiniteQuery({
    queryKey: ["animals", params],
    queryFn: ({ pageParam = 1 }) => getAnimals({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
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

/** @TODO pet image GET query 추가 */

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

/** @TODO pet image GET query 추가 */

export const useGetAnimalById = (animalId: string) => {
  return useQuery({
    queryKey: ["animals", animalId],
    queryFn: async (): Promise<Animal> => {
      const response = await instance.get<Animal>(`/animals/${animalId}/`);
      return response.data;
    },
    enabled: !!animalId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 거리 기반 관련 동물 조회 훅
export const useGetRelatedAnimalsByDistance = (animalId?: string) => {
  return useQuery({
    queryKey: ["relatedAnimals", animalId],
    queryFn: async () => {
      if (!animalId) {
        throw new Error("동물 ID가 필요합니다");
      }

      return instance.get(`/animals/${animalId}/related_by_distance/?limit=6`);
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!animalId, // animalId가 있을 때만 실행
  });
};
