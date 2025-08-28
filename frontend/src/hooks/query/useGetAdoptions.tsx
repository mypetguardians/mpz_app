import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface Animal {
  id: string;
  name: string;
  breed: string;
  age: number;
  isFemale: boolean;
  status: string;
  imageUrl?: string;
}

interface Center {
  id: string;
  name: string;
  region: string;
}

interface Adoption {
  id: string;
  status: "신청" | "미팅" | "계약서작성" | "입양완료" | "모니터링" | "취소";
  notes?: string;
  monitoringAgreement: boolean;
  guidelinesAgreement: boolean;
  meetingScheduledAt?: string;
  contractSentAt?: string;
  adoptionCompletedAt?: string;
  monitoringStartedAt?: string;
  monitoringNextCheckAt?: string;
  monitoringEndDate?: string;
  monitoringCompletedChecks: number;
  monitoringTotalChecks: number;
  monitoringStatus: "진행중" | "완료" | "지연" | "중단";
  centerNotes?: string;
  createdAt: string;
  updatedAt: string;
  animal: Animal;
  center: Center;
}

interface GetAdoptionsParams {
  userId: string;
  animalId?: string;
  centerId?: string;
  status?: Adoption["status"];
  page?: number;
  limit?: number;
}

interface GetAdoptionsResponse {
  adoptions: Adoption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

const getAdoptions = async (
  params: GetAdoptionsParams
): Promise<GetAdoptionsResponse> => {
  const { userId, ...otherParams } = params;
  const searchParams = new URLSearchParams();

  // userId는 URL 경로에 포함
  Object.entries(otherParams).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  const url = `/users/${userId}/adoption?${searchParams.toString()}`;
  const response = await instance.get<GetAdoptionsResponse>(url);
  return response.data;
};

export const useGetAdoptions = (params: GetAdoptionsParams) => {
  return useQuery<GetAdoptionsResponse>({
    queryKey: ["adoptions", params],
    queryFn: () => getAdoptions(params),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!params.userId, // userId가 있을 때만 쿼리 실행
  });
};

export const useGetAdoptionsInfinite = (params: GetAdoptionsParams) => {
  return useInfiniteQuery({
    queryKey: ["adoptions-infinite", params],
    queryFn: ({ pageParam = 1 }) =>
      getAdoptions({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!params.userId, // userId가 있을 때만 쿼리 실행
  });
};

// 특정 동물의 입양 목록을 가져오는 훅
export const useGetAnimalAdoptions = (animalId: string, userId: string) => {
  return useQuery<GetAdoptionsResponse>({
    queryKey: ["animal-adoptions", animalId, userId],
    queryFn: () => getAdoptions({ animalId, userId }),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!userId && !!animalId, // userId와 animalId가 모두 있을 때만 쿼리 실행
  });
};

// 특정 센터의 입양 목록을 가져오는 훅
export const useGetCenterAdoptions = (centerId: string, userId: string) => {
  return useQuery<GetAdoptionsResponse>({
    queryKey: ["center-adoptions", centerId, userId],
    queryFn: () => getAdoptions({ centerId, userId }),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!userId && !!centerId, // userId와 centerId가 모두 있을 때만 쿼리 실행
  });
};
