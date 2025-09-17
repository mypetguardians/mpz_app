import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface SignContractParams {
  contractId: string;
  signatureData: string; // Base64 인코딩된 서명 이미지 데이터
}

interface SignContractResponse {
  message: string;
  success: boolean;
}

export const useSignContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: SignContractParams
    ): Promise<SignContractResponse> => {
      const response = await instance.post<SignContractResponse>(
        "/adoptions/contract/sign",
        {
          contract_id: params.contractId,
          signature_data: params.signatureData,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // 사용자 입양 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["user-adoptions"] });

      // 특정 입양 신청 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["user-adoption-detail"],
      });
    },
    onError: (error) => {
      console.error("계약서 서명 실패:", error);
    },
  });
};
