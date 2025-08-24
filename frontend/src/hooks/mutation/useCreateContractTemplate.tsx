import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface CreateContractTemplateData {
  title: string;
  description?: string;
  content: string;
  isActive?: boolean;
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

export function useCreateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateContractTemplateData
    ): Promise<ContractTemplate> => {
      const response = await instance.post<ContractTemplate>(
        "/centers/procedures/contract-template",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 계약서 템플릿 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["contract-templates"],
      });
    },
  });
}
