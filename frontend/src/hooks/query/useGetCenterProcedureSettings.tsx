import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface CenterProcedureSettings {
  hasMonitoring: boolean;
  monitoringPeriodMonths: number;
  monitoringIntervalDays: number;
  monitoringDescription: string | null;
  adoptionGuidelines: string | null;
  adoptionProcedure: string | null;
  contractTemplates: ContractTemplate[];
}

export interface ContractTemplate {
  id: string;
  centerId: string;
  title: string;
  description: string | null;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useGetCenterProcedureSettings() {
  return useQuery({
    queryKey: ["center-procedure-settings"],
    queryFn: async (): Promise<CenterProcedureSettings> => {
      const response = await instance.get<CenterProcedureSettings>(
        "/centers/procedures/settings"
      );
      return response.data;
    },
  });
}
