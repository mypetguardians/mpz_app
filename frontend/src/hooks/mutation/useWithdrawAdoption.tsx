import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

// API 응답 타입 정의
interface WithdrawAdoptionResponse {
  message: string;
  adoption_id: string;
  status: string;
}

export const useWithdrawAdoption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      adoptionId: string
    ): Promise<WithdrawAdoptionResponse> => {
      try {
        const response = await instance.delete(
          `/adoptions/${adoptionId}/withdraw`
        );
        return response.data;
      } catch (error) {
        console.error("입양 신청 철회 실패:", error);
        throw new Error("입양 신청 철회에 실패했습니다.");
      }
    },
    onSuccess: (data, adoptionId) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["adopter-detail", adoptionId],
      });
      queryClient.invalidateQueries({ queryKey: ["center-adoptions"] });
      queryClient.invalidateQueries({ queryKey: ["adoptions"] });
      queryClient.invalidateQueries({ queryKey: ["my-adoptions"] });
    },
    onError: (error) => {
      console.error("입양 신청 철회 실패:", error);
    },
  });
};
