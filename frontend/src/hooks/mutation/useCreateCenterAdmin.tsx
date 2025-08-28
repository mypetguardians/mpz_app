import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { CenterAdminResponse, CreateCenterAdminData } from "@/types";

export const useCreateCenterAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateCenterAdminData
    ): Promise<CenterAdminResponse> => {
      const response = await instance.post<CenterAdminResponse>(
        "/admin/center-admin",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["centerAdmins"] });
    },
  });
};
