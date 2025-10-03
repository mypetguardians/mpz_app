import { useQuery } from "@tanstack/react-query";
import type { CenterAdoptionData } from "@/types/center-adoption";
import instance from "@/lib/axios-instance";

export const useGetCenterAdoption = (id: string) => {
  return useQuery({
    queryKey: ["center-adoption", id],
    queryFn: async (): Promise<CenterAdoptionData> => {
      console.log("🔍 Debug - Fetching adoption with ID:", id);
      
      // 개별 조회 API를 사용하여 특정 ID의 데이터를 가져옴
      const response = await instance.get(`/adoptions/center-admin/${id}`);
      console.log("🔍 Debug - API response:", response.data);
      
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};