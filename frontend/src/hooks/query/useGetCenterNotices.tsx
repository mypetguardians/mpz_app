import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { NoticeResponse } from "@/types/center-admin";

// 실제 경로 수정 필요
export const useGetCenterNotices = (centerId: string) => {
  return useQuery({
    queryKey: ["center-notices", centerId],
    queryFn: async (): Promise<NoticeResponse[]> => {
      const response = await instance.get<NoticeResponse[]>(
        `/centers/${centerId}/notices`
      );
      return response.data;
    },
    enabled: !!centerId,
  });
};
