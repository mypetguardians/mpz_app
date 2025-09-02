import { useQuery, type QueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  Center,
  transformRawCenterToCenter,
  RawCenterResponse,
} from "@/types/center";

export const useGetMyCenter = () => {
  return useQuery({
    queryKey: ["myCenter"],
    queryFn: async (): Promise<Center> => {
      const response = await instance.get("/centers/me");
      const rawData: RawCenterResponse = response.data;
      return transformRawCenterToCenter(rawData);
    },
  });
};

// 센터 정보 업데이트 후 캐시 무효화를 위한 함수
export const invalidateMyCenter = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["myCenter"] });
};
