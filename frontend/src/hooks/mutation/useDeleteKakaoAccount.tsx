import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import instance from "@/lib/axios-instance";

interface DeleteKakaoAccountResponse {
  message: string;
  deletedAt: string;
}

export function useDeleteKakaoAccount() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (): Promise<DeleteKakaoAccountResponse> => {
      const response = await instance.delete<DeleteKakaoAccountResponse>(
        "/auth/deleteaccount"
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log("계정 삭제 성공:", data.message);
      router.push("/");
    },
    onError: (error) => {
      console.error("계정 삭제 오류:", error);
    },
  });
}
