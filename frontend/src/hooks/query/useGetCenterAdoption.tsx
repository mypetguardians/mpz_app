import { useQuery } from "@tanstack/react-query";
import type { CenterAdoptionData } from "@/types/center-adoption";
import instance from "@/lib/axios-instance";

export const useGetCenterAdoption = (id: string) => {
  return useQuery({
    queryKey: ["center-adoption", id],
    queryFn: async (): Promise<CenterAdoptionData> => {
      console.log("🔍 Debug - Fetching adoption with ID:", id);
      
      // 목록 조회 API를 사용하여 특정 ID의 데이터를 가져옴
      const response = await instance.get(`/adoptions/center-admin`);
      console.log("🔍 Debug - API response:", response.data);
      
      // 응답에서 특정 ID의 데이터를 찾음
      const adoption = response.data.data?.find((item: CenterAdoptionData) => item.id === id);
      console.log("🔍 Debug - Found adoption:", adoption);
      
      if (!adoption) {
        console.error("❌ Error - Adoption not found for ID:", id);
        throw new Error("입양 신청을 찾을 수 없습니다.");
      }
      
      return adoption;
    },
    enabled: !!id,
  });
};
