import { useQuery } from "@tanstack/react-query";
import type { ContractTemplate } from "./useGetCenterProcedureSettings";
import instance from "@/lib/axios-instance";

export function useGetContractTemplate(templateId: string) {
  return useQuery({
    queryKey: ["contract-template", templateId],
    queryFn: async (): Promise<ContractTemplate> => {
      const response = await instance.get<ContractTemplate>(
        `/centers/procedures/contract-template/${templateId}`
      );
      return response.data;
    },
    enabled: !!templateId,
  });
}
