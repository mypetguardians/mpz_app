import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

// API 문서에 맞춘 요청 타입
interface UpdateAdoptionStatusRequest {
  status: "미팅" | "계약서작성" | "입양완료" | "모니터링" | "취소";
  center_notes?: string | null;
  meeting_scheduled_at?: string | null; // ISO 8601 형식
}

interface UpdateAdoptionStatusParams {
  adoptionId: string; // path parameter
  status: UpdateAdoptionStatusRequest["status"];
  center_notes?: string | null;
  meeting_scheduled_at?: string | null;
}

export const useUpdateAdoptionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateAdoptionStatusParams): Promise<void> => {
      const response = await instance.put(
        `/adoptions/center-admin/${params.adoptionId}/status`,
        {
          status: params.status,
          center_notes: params.center_notes,
          meeting_scheduled_at: params.meeting_scheduled_at,
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
      console.error("입양 상태 변경 실패:", error);
    },
  });
};
