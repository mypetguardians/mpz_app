import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { BannerListResponse, BannerListParams } from "@/types/banner";

// 배너 목록 조회 훅
export const useGetBanners = (params?: BannerListParams) => {
  return useQuery({
    queryKey: ["banners", params],
    queryFn: async (): Promise<BannerListResponse> => {
      const searchParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const url = `/banners?${searchParams.toString()}`;
      const response = await instance.get(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
