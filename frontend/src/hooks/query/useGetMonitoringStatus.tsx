import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { MonitoringStatusResponse } from "@/types/adoption-monitoring";

export const useGetMonitoringStatus = (adoptionId: string) => {
  return useQuery({
    queryKey: ["monitoring-status", adoptionId],
    queryFn: async (): Promise<MonitoringStatusResponse> => {
      const response = await instance.get<MonitoringStatusResponse>(
        `/center-admin/adoptions/${adoptionId}/monitoring-status`
      );
      return response.data;
    },
    enabled: !!adoptionId, // adoptionId가 있을 때만 활성화
  });
};
