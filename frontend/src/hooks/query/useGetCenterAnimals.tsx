import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { Animal } from "@/types/animal";

interface GetMyCenterAnimalsParams {
  center_id?: string | null;
  status?:
    | "보호중"
    | "입양대기"
    | "입양완료"
    | "무지개다리"
    | "임시보호중"
    | "반환"
    | "방사";
  breed?: string;
  gender?: "female" | "male";
  weight?: "10kg_under" | "25kg_under" | "over_25kg";
  age?: "2_under" | "7_under" | "over_7";
  has_trainer_comment?: "true" | "false";
  page?: number;
  page_size?: number;
}

// API 응답의 실제 구조
interface ApiAnimalResponse {
  id: string;
  name: string;
  is_female: boolean;
  age: number | null;
  weight: number | null;
  color: string | null;
  breed: string | null;
  description: string | null;
  status: string;
  waiting_days: number | null;
  activity_level: string | null;
  sensitivity: string | null;
  sociability: string | null;
  separation_anxiety: string | null;
  special_notes: string | null;
  health_notes: string | null;
  basic_training: string | null;
  trainer_comment: string | null;
  announce_number: string | null;
  announcement_date: string | null;
  found_location: string | null;
  admission_date: string | null;
  personality: string | null;
  center_id: string;
  created_at: string;
  updated_at: string;
  animal_images: Array<{
    id: string;
    image_url: string;
    order_index: number;
  }> | null;
}

interface GetMyCenterAnimalsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number | null;
  previousPage: number | null;
  data: ApiAnimalResponse[];
}

// API 응답을 Animal 타입으로 변환하는 함수
const transformApiResponseToAnimal = (apiAnimal: ApiAnimalResponse): Animal => {
  return {
    id: apiAnimal.id,
    name: apiAnimal.name,
    isFemale: apiAnimal.is_female,
    age: apiAnimal.age || 0,
    weight: apiAnimal.weight,
    color: apiAnimal.color,
    breed: apiAnimal.breed,
    description: apiAnimal.description,
    status: apiAnimal.status as Animal["status"],
    waitingDays: apiAnimal.waiting_days,
    activityLevel: apiAnimal.activity_level,
    sensitivity: apiAnimal.sensitivity,
    sociability: apiAnimal.sociability,
    separationAnxiety: apiAnimal.separation_anxiety,
    specialNotes: apiAnimal.special_notes,
    healthNotes: apiAnimal.health_notes,
    basicTraining: apiAnimal.basic_training,
    trainerComment: apiAnimal.trainer_comment,
    announceNumber: apiAnimal.announce_number,
    announcementDate: apiAnimal.announcement_date,
    admissionDate: apiAnimal.admission_date,
    foundLocation: apiAnimal.found_location,
    personality: apiAnimal.personality,
    megaphoneCount: 0, // API에서 제공되지 않는 필드
    isMegaphoned: false, // API에서 제공되지 않는 필드
    centerId: apiAnimal.center_id,
    animalImages: apiAnimal.animal_images
      ? apiAnimal.animal_images.map((img) => ({
          id: img.id,
          imageUrl: img.image_url,
          orderIndex: img.order_index,
        }))
      : null,
    createdAt: apiAnimal.created_at,
    updatedAt: apiAnimal.updated_at,
  };
};

const getMyCenterAnimals = async (
  params?: GetMyCenterAnimalsParams
): Promise<{
  animals: Animal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const url = `/centers/animals?${searchParams.toString()}`;
  const response = await instance.get<GetMyCenterAnimalsResponse>(url);

  // API 응답을 Animal 타입으로 변환
  const animals = response.data.data.map(transformApiResponseToAnimal);

  return {
    animals,
    total: response.data.totalCnt,
    page: response.data.curPage,
    pageSize: params?.page_size || 10,
    totalPages: response.data.pageCnt,
    hasNext: response.data.nextPage !== null,
    hasPrev: response.data.previousPage !== null,
  };
};

export const useGetMyCenterAnimals = (
  params?: GetMyCenterAnimalsParams,
  options?: { enabled?: boolean }
) => {
  const queryResult = useQuery({
    queryKey: ["myCenterAnimals", params],
    queryFn: () => getMyCenterAnimals(params),
    staleTime: 5 * 60 * 1000, // 5분
    enabled: options?.enabled ?? true,
  });

  return queryResult;
};

// 무한스크롤용 훅
export const useGetMyCenterAnimalsInfinite = (
  params?: Omit<GetMyCenterAnimalsParams, "page">,
  options?: { enabled?: boolean }
) => {
  return useInfiniteQuery({
    queryKey: ["myCenterAnimalsInfinite", params],
    queryFn: ({ pageParam = 1 }) =>
      getMyCenterAnimals({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });
};
