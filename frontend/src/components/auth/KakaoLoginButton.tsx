"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import instance from "@/lib/axios-instance";

export function KakaoLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);

      // 현재 페이지 URL을 쿠키에 저장 (로그인 후 돌아올 페이지)
      const currentUrl = pathname;
      if (
        currentUrl &&
        currentUrl !== "/kakao/login/callback" &&
        currentUrl !== "/login"
      ) {
        // 쿠키에 현재 URL 저장 (1시간 유효)
        document.cookie = `redirect_after_login=${encodeURIComponent(
          currentUrl
        )}; path=/; max-age=3600; SameSite=Lax`;
      }

      // Django API 호출하여 카카오 로그인 URL 가져오기
      const response = await instance.get("/kakao/login");

      console.log("Django API 응답:", response.data);

      if (response.data.authUrl) {
        // Django에서 받은 카카오 로그인 URL로 리다이렉트
        console.log("리다이렉트할 URL:", response.data.authUrl);
        window.location.href = response.data.authUrl;
      } else {
        throw new Error("카카오 로그인 URL을 받지 못했습니다.");
      }
    } catch (error) {
      console.error("카카오 로그인 시작 중 오류:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleKakaoLogin}
      disabled={isLoading}
      className="w-full bg-yellow-400 text-black hover:bg-yellow-500 border border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
      type="button"
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
          로그인 중...
        </div>
      ) : (
        <>
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 3C6.477 3 2 6.991 2 11.75c0 3.072 1.978 5.764 4.912 7.328l-1.048 3.797c-.077.281.193.544.465.448L10.87 21.85c.36.044.725.067 1.096.068h.069C17.523 21.918 22 17.927 22 13.168 22 8.409 17.523 4.418 12 3.836V3z" />
          </svg>
          카카오로 계속하기
        </>
      )}
    </Button>
  );
}

export default KakaoLoginButton;
