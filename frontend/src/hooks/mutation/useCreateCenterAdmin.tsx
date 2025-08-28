import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CenterAdminResponseSchema } from "@/server/openapi/routes/center-admin";
import instance from "@/lib/axios-instance";

interface CreateCenterAdminData {
  username: string;
  password: string;
  email: string;
  nickname: string;
  user_type: string;
  phone_number: string;
}

export const useCreateCenterAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateCenterAdminData
    ): Promise<typeof CenterAdminResponseSchema> => {
      const response = await instance.post<typeof CenterAdminResponseSchema>(
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
