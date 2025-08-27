import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { MonitoringStatusResponseSchema } from "@/server/openapi/routes/center-adoption";
import instance from "@/lib/axios-instance";

export type MonitoringStatus = z.infer<typeof MonitoringStatusResponseSchema>;

export const useGetMonitoringStatus = (adoptionId: string) => {
  return useQuery({
    queryKey: ["monitoring-status", adoptionId],
    queryFn: async (): Promise<MonitoringStatus> => {
      const response = await instance.get<MonitoringStatus>(
        `/center-admin/adoptions/${adoptionId}/monitoring-status`
      );
      return response.data;
    },
    enabled: !!adoptionId, // adoptionId가 있을 때만 활성화
  });
};
