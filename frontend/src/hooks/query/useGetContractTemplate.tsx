import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// 계약서 템플릿 무효화 및 새로고침 함수
export function useInvalidateContractTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 계약서 템플릿 관련 모든 쿼리 무효화
      await queryClient.invalidateQueries({
        queryKey: ["contract-template"],
        exact: false,
      });
      // 센터 프로시저 설정도 함께 무효화 (계약서 템플릿 포함)
      await queryClient.invalidateQueries({
        queryKey: ["center-procedure-settings"],
      });
    },
    onSuccess: () => {
      // 무효화 후 자동으로 새로고침됨
      console.log("계약서 템플릿 쿼리가 무효화되었습니다.");
    },
  });
}
