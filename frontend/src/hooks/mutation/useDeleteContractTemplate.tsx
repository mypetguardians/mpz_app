import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export function useDeleteContractTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<{ message: string }> => {
      const response = await instance.delete<{ message: string }>(
        `/centers/procedures/contract-template/${templateId}`
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
