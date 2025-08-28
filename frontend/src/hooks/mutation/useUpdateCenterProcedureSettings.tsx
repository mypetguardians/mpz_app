import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CenterProcedureSettings } from "@/hooks/query/useGetCenterProcedureSettings";
import instance from "@/lib/axios-instance";

export interface UpdateCenterProcedureSettingsData {
  has_monitoring?: boolean;
  monitoring_period_months?: number;
  monitoring_interval_days?: number;
  monitoring_description?: string;
  adoption_guidelines?: string;
  adoption_procedure?: string;
}

export function useUpdateCenterProcedureSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: UpdateCenterProcedureSettingsData
    ): Promise<CenterProcedureSettings> => {
      const response = await instance.put<CenterProcedureSettings>(
        "/centers/procedures/settings/",
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
