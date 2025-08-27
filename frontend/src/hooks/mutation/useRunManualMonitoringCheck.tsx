import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface ManualMonitoringCheckResponse {
  success: boolean;
  checked: number;
  issues: number;
  timestamp: string;
}

export const useRunManualMonitoringCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ManualMonitoringCheckResponse> => {
      const response = await instance.post<ManualMonitoringCheckResponse>(
        "/center-admin/monitoring/manual-check"
      );
      return response.data;
    },
    onSuccess: () => {
      // 모니터링 관련 모든 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["monitoring-status"] });
      queryClient.invalidateQueries({ queryKey: ["center-adoptions"] });
    },
    onError: (error) => {
      console.error("수동 모니터링 체크 실행 실패:", error);
    },
  });
};
