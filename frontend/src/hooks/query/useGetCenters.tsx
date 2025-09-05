import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  transformRawCenterToCenter,
  RawCenterResponse,
  Center,
  GetCentersResponse,
  CenterSearchParams,
} from "@/types/center";

const ITEMS_PER_PAGE = 20;

// 센터 목록 조회 API 함수
const getCenters = async (
  params?: CenterSearchParams
): Promise<GetCentersResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `/centers?${searchParams.toString()}`;
  console.log("Centers API Request:", endpoint);

  const response = await instance.get<GetCentersResponse>(endpoint);

  console.log("Centers Raw API Response:", response.data);

  return response.data;
};

// 무한스크롤을 지원하는 센터 목록 조회 훅
export const useGetCenters = (params?: Omit<CenterSearchParams, "page">) => {
  return useInfiniteQuery({
    queryKey: ["centers", params],
    queryFn: ({ pageParam = 1 }) => {
      console.log("Fetching centers page:", pageParam, "with params:", params);
      return getCenters({ ...params, page: pageParam, limit: ITEMS_PER_PAGE });
    },
    getNextPageParam: (lastPage) => {
      console.log("getNextPageParam - lastPage:", lastPage);

      // 여러 가능한 필드 확인
      const hasNext =
        (lastPage.nextPage !== null && lastPage.nextPage !== undefined) ||
        (lastPage.curPage &&
          lastPage.pageCnt &&
          lastPage.curPage < lastPage.pageCnt);

      const nextPage =
        lastPage.nextPage ||
        (lastPage.curPage ? lastPage.curPage + 1 : undefined);

      console.log("Centers hasNext:", hasNext, "nextPage:", nextPage);

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

// 기존 호환성을 위한 레거시 훅 (사용하지 않는 것을 권장)
export const useGetCentersLegacy = () => {
  return useQuery({
    queryKey: ["centers-legacy"],
    queryFn: async () => {
      const response = await instance.get("/centers");
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: true,
  });
};

// 센터 지역별 검색 훅
export const useGetCenterByLocation = (params?: {
  location?: string;
  region?: string;
}) => {
  return useQuery({
    queryKey: ["centers", "location", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            searchParams.append(key, value.toString());
          }
        });
      }

      const url = `/centers?${searchParams.toString()}`;
      const response = await instance.get(url);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: true,
  });
};

// 보호센터 ID로 특정 보호센터 조회 훅
export const useGetCenterById = (centerId?: string) => {
  return useQuery({
    queryKey: ["center", centerId],
    queryFn: async (): Promise<Center> => {
      if (!centerId) {
        throw new Error("보호센터 ID가 필요합니다");
      }

      const response = await instance.get(`/centers/${centerId}`);
      const rawData: RawCenterResponse = response.data;
      return transformRawCenterToCenter(rawData);
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!centerId, // centerId가 있을 때만 실행
  });
};
