import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { SendContractRequestSchema } from "@/server/openapi/routes/center-adoption";
import instance from "@/lib/axios-instance";

type SendContractRequest = z.infer<typeof SendContractRequestSchema>;

interface SendContractParams extends SendContractRequest {
  adoptionId: string;
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
        `/center-admin/adoptions/${params.adoptionId}/send-contract`,
        {
          templateId: params.templateId,
          customContent: params.customContent,
          centerNotes: params.centerNotes,
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
