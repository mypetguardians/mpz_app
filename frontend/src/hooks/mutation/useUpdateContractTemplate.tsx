import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContractTemplate } from "./useCreateContractTemplate";
import instance from "@/lib/axios-instance";

export interface UpdateContractTemplateData {
  title?: string;
  description?: string;
  content?: string;
  isActive?: boolean;
}

export function useUpdateContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: string;
      data: UpdateContractTemplateData;
    }): Promise<ContractTemplate> => {
      const response = await instance.put<ContractTemplate>(
        `/centers/procedures/contract-template/${templateId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 계약서 템플릿 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["contract-templates"],
      });
      // 센터 프로시저 설정도 무효화 (계약서 템플릿이 포함되어 있음)
      queryClient.invalidateQueries({
        queryKey: ["center-procedure-settings"],
      });
    },
  });
}
