import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CenterAdminResponseSchema } from "@/server/openapi/routes/center-admin";
import instance from "@/lib/axios-instance";

interface CreateCenterAdminData {
  name: string;
  email: string;
  password: string;
}

export const useCreateCenterAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateCenterAdminData
    ): Promise<typeof CenterAdminResponseSchema> => {
      const response = await instance.post<typeof CenterAdminResponseSchema>(
        "/center-admin",
        data
      );
      return response.data;
    },
    onSuccess: (_data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["centerAdmins"] });
    },
  });
};
