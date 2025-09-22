import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface SendContractParams {
  adoptionId: string;
  templateId: string;
  customContent?: string;
  centerNotes?: string;
}

interface SendContractResponse {
  message: string;
  contractId: string;
}

export const useSendContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: SendContractParams
    ): Promise<SendContractResponse> => {
      const response = await instance.post<SendContractResponse>(
        `/adoptions/center-admin/${params.adoptionId}/send-contract`,
        {
          template_id: params.templateId,
          custom_content: params.customContent,
          center_notes: params.centerNotes,
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 센터 입양 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["center-adoptions"] });

      // 특정 입양 신청 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["center-adoption", variables.adoptionId],
      });
    },
    onError: (error) => {
      console.error("계약서 전송 실패:", error);
    },
  });
};
