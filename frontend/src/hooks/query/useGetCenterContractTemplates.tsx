import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface ContractTemplate {
  id: string;
  center_id: string;
  title: string;
  description: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useGetCenterContractTemplates(centerId: string) {
  return useQuery({
    queryKey: ["center-contract-templates", centerId],
    queryFn: async (): Promise<ContractTemplate[]> => {
      const response = await instance.get<ContractTemplate[]>(
        `/centers/procedures/contract-template/center/${centerId}`
      );
      return response.data;
    },
    enabled: !!centerId,
  });
}
