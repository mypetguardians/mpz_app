import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface CenterProcedureSettings {
  has_monitoring: boolean;
  monitoring_period_months: number;
  monitoring_interval_days: number;
  monitoring_description: string | null;
  adoption_guidelines: string | null;
  adoption_procedure: string | null;
  contract_templates: ContractTemplate[];
}

export interface ContractTemplate {
  id: string;
  center_id: string;
  title: string;
  description: string | null;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useGetCenterProcedureSettings() {
  return useQuery({
    queryKey: ["center-procedure-settings"],
    queryFn: async (): Promise<CenterProcedureSettings> => {
      const response = await instance.get<CenterProcedureSettings>(
        "/centers/procedures/settings/"
      );
      return response.data;
    },
  });
}

// 센터 프로시저 설정 무효화 및 새로고침 함수
export function useInvalidateCenterProcedureSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 센터 프로시저 설정 쿼리 무효화
      await queryClient.invalidateQueries({
        queryKey: ["center-procedure-settings"],
      });
      // 연관된 계약서 템플릿 쿼리도 함께 무효화
      await queryClient.invalidateQueries({
        queryKey: ["contract-template"],
        exact: false,
      });
      // 동의서 쿼리도 함께 무효화
      await queryClient.invalidateQueries({
        queryKey: ["consents"],
      });
    },
    onSuccess: () => {
      // 무효화 후 자동으로 새로고침됨
      console.log("센터 프로시저 설정 쿼리가 무효화되었습니다.");
    },
  });
}
