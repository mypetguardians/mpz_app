import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { CenterNoticesResponse } from "@/types/notifications";

interface UseCenterNoticesParams {
  centerId: string;
  enabled?: boolean;
}

export function useCenterNotices({
  centerId,
  enabled = true,
}: UseCenterNoticesParams) {
  return useQuery({
    queryKey: ["centerNotices", centerId],
    queryFn: async (): Promise<CenterNoticesResponse> => {
      const response = await instance.get<CenterNoticesResponse>(
        `/centers/${centerId}/notices`
      );
      return response.data;
    },
    enabled: enabled && !!centerId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}
