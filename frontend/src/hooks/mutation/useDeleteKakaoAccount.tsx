import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { useAuth } from "@/components/providers/AuthProvider";

interface DeleteKakaoAccountResponse {
  message: string;
  deletedAt: string;
}

export function useDeleteKakaoAccount() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<DeleteKakaoAccountResponse> => {
      const response = await instance.delete<DeleteKakaoAccountResponse>(
        "/auth/deleteaccount"
      );
      return response.data;
    },
    onSuccess: async (data) => {
      console.log("계정 삭제 성공:", data.message);
      // 계정 삭제 후 로그아웃 처리 및 관련 쿼리 캐시 무효화
      await logout();
    },
    onError: (error) => {
      console.error("계정 삭제 오류:", error);
    },
  });
}
