import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type {
  CenterAdoptionResponseSchema,
  UpdateAdoptionStatusRequestSchema,
} from "@/server/openapi/routes/center-adoption";
import instance from "@/lib/axios-instance";

type CenterAdoption = z.infer<typeof CenterAdoptionResponseSchema>;
type UpdateAdoptionStatusRequest = z.infer<
  typeof UpdateAdoptionStatusRequestSchema
>;

interface UpdateAdoptionStatusParams extends UpdateAdoptionStatusRequest {
  adoptionId: string;
}

type UpdateAdoptionStatusResponse = CenterAdoption;

export const useUpdateAdoptionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: UpdateAdoptionStatusParams
    ): Promise<CenterAdoption> => {
      const response = await instance.put<UpdateAdoptionStatusResponse>(
        `/center-admin/adoptions/${params.adoptionId}/status`,
        {
          status: params.status,
          centerNotes: params.centerNotes,
          meetingScheduledAt: params.meetingScheduledAt,
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 센터 입양 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["center-adoptions"] });

      // 특정 입양 신청 캐시 업데이트
      queryClient.setQueryData(["center-adoption", variables.adoptionId], data);
    },
    onError: (error) => {
      console.error("입양 상태 변경 실패:", error);
    },
  });
};
