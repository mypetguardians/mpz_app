import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface DeleteCenterAdminResponse {
  message: string;
}

const deleteCenterAdmin = async (
  adminId: string
): Promise<DeleteCenterAdminResponse> => {
  const response = await instance.delete(`/admin/center-admin/${adminId}`);
  return response.data;
};

export const useDeleteCenterAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCenterAdmin,
    onSuccess: () => {
      // 성공 시 센터 관리자 목록을 다시 불러옴
      queryClient.invalidateQueries({
        queryKey: ["centerAdmins"],
      });
    },
  });
};
