import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  Animal,
  GetAnimalsParams,
  RawAnimalResponse,
  ActualGetAnimalsResponse,
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
      const response = await instance.get<RawAnimalResponse>(
        `/animals/${animalId}/`
      );

      // API 응답의 snake_case를 camelCase로 변환
      const rawAnimal = response.data;
      return {
        id: rawAnimal.id,
        name: rawAnimal.name,
        isFemale: rawAnimal.is_female,
        age: rawAnimal.age,
        weight: rawAnimal.weight,
        color: rawAnimal.color,
        breed: rawAnimal.breed,
        description: rawAnimal.description,
        status: rawAnimal.status,
        waitingDays: rawAnimal.waiting_days,
        activityLevel: rawAnimal.activity_level,
        sensitivity: rawAnimal.sensitivity,
        sociability: rawAnimal.sociability,
        separationAnxiety: rawAnimal.separation_anxiety,
        specialNotes: rawAnimal.special_notes,
        healthNotes: rawAnimal.health_notes,
        basicTraining: rawAnimal.basic_training,
        trainerComment: rawAnimal.trainer_comment,
        announceNumber: rawAnimal.announce_number,
        announcementDate: rawAnimal.announcement_date,
        admissionDate: rawAnimal.admission_date,
        foundLocation: rawAnimal.found_location,
        personality: rawAnimal.personality,
        centerId: rawAnimal.center_id,
        animalImages: rawAnimal.animal_images || [],
        createdAt: rawAnimal.created_at,
        updatedAt: rawAnimal.updated_at,
      };
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
