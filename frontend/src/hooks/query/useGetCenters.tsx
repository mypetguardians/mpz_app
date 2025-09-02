import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  transformRawCenterToCenter,
  RawCenterResponse,
  Center,
} from "@/types/center";

// 전체 센터 목록 조회 훅
export const useGetCenters = () => {
  return useQuery({
    queryKey: ["centers"],
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
