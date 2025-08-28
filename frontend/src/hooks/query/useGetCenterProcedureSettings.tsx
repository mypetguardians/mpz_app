import { useQuery } from "@tanstack/react-query";
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
