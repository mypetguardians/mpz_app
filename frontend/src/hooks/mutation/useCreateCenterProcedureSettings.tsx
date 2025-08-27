import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CenterProcedureSettings } from "@/hooks/query/useGetCenterProcedureSettings";
import instance from "@/lib/axios-instance";

export interface CreateCenterProcedureSettingsData {
  hasMonitoring?: boolean;
  monitoringPeriodMonths?: number;
  monitoringIntervalDays?: number;
  monitoringDescription?: string;
  adoptionGuidelines?: string;
  adoptionProcedure?: string;
}

export function useCreateCenterProcedureSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateCenterProcedureSettingsData
    ): Promise<CenterProcedureSettings> => {
      const response = await instance.post<CenterProcedureSettings>(
        "/centers/procedures/settings",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 센터 프로시저 설정 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["center-procedure-settings"],
      });
    },
  });
}
