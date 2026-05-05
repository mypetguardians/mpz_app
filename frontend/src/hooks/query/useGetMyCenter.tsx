import { useQuery, type QueryClient } from "@tanstack/react-query";
import axios from "axios";
import instance from "@/lib/axios-instance";
import {
  Center,
  transformRawCenterToCenter,
  RawCenterResponse,
} from "@/types/center";

interface UseGetMyCenterOptions {
  enabled?: boolean;
}

export const useGetMyCenter = (options?: UseGetMyCenterOptions) => {
  const { enabled = true } = options ?? {};
  return useQuery({
    queryKey: ["myCenter"],
    queryFn: async (): Promise<Center | null> => {
      try {
        const response = await instance.get("/centers/me");
        const rawData: RawCenterResponse = response.data;
        return transformRawCenterToCenter(rawData);
      } catch (error) {
        // 일반 사용자(센터 운영자 X)는 404가 정상 응답
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled,
    retry: false,
  });
};

// 센터 정보 업데이트 후 캐시 무효화를 위한 함수
export const invalidateMyCenter = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["myCenter"] });
};
