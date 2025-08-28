import { useMutation, useQueryClient } from "@tanstack/react-query";
// import instance from "@/lib/axios-instance";

export const useWithdrawAdoption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adoptionId: string) => {
      try {
        // 실제 API 엔드포인트가 없으므로 성공 응답 시뮬레이션
        // 나중에 실제 API가 구현되면 아래 주석을 해제하고 사용
        // const response = await instance.patch(`/api/adoptions/${adoptionId}/withdraw`);
        // return response.data;

        // 임시로 성공 응답 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 지연

        return {
          id: adoptionId,
          status: "취소",
          updatedAt: new Date().toISOString(),
        };
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
    },
    onError: (error) => {
      console.error("입양 신청 철회 실패:", error);
    },
  });
};
