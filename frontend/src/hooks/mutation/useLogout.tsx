import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import instance from "@/lib/axios-instance";

interface LogoutResponse {
  message: string;
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (): Promise<LogoutResponse> => {
      const response = await instance.post<LogoutResponse>("/auth/logout");
      return response.data;
    },
    onSuccess: (data) => {
      console.log("로그아웃 성공:", data.message);
      
      // 쿠키에서 토큰 제거
      Cookies.remove("access");
      Cookies.remove("refresh");
      
      // 로컬 스토리지에서 토큰 제거 (혹시 남아있을 경우)
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      
      // 홈페이지로 리다이렉트
      router.push("/");
      
      // 페이지 새로고침하여 전역 상태 초기화
      window.location.reload();
    },
    onError: (error) => {
      console.error("로그아웃 오류:", error);
      
      // 에러가 발생해도 로컬에서 토큰을 제거하고 홈으로 이동
      Cookies.remove("access");
      Cookies.remove("refresh");
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
      
      router.push("/");
      window.location.reload();
    },
  });
}
