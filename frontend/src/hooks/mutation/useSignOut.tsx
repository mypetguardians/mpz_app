import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import instance from "@/lib/axios-instance";

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const response = await instance.delete("/auth/logout");
      return response.data;
    },
    onSuccess: async () => {
      // 사용자 정보 클리어
      await logout();

      // 쿼리 캐시 클리어
      queryClient.clear();

      // 홈페이지로 리다이렉트
      router.push("/");

      // 로그아웃 성공 메시지 (선택사항)
      console.log("로그아웃되었습니다.");
    },
    onError: (error) => {
      console.error("로그아웃 오류:", error);
    },
  });
}
