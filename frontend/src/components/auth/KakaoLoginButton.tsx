"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import instance from "@/lib/axios-instance";
import {
  isIOSSafari,
  isKakaoTalkInstalled,
  setSafeCookie,
} from "@/lib/storage-utils";

export function KakaoLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);

      // iOS Safari 환경 감지
      const isIOS = isIOSSafari();
      console.log("iOS Safari 환경:", isIOS);

      // 현재 페이지 URL을 안전한 쿠키에 저장 (로그인 후 돌아올 페이지)
      const currentUrl = pathname;
      if (
        currentUrl &&
        currentUrl !== "/kakao/login/callback" &&
        currentUrl !== "/login"
      ) {
        // iOS Safari에 최적화된 쿠키 설정
        setSafeCookie("redirect_after_login", encodeURIComponent(currentUrl), {
          maxAge: 3600, // 1시간
          path: "/",
          sameSite: "None",
          secure: true,
        });
      }

      // iOS Safari에서 카카오톡 앱 설치 여부 확인
      if (isIOS) {
        try {
          const hasKakaoTalk = await isKakaoTalkInstalled();
          console.log("카카오톡 앱 설치 여부:", hasKakaoTalk);

          // 카카오톡 앱이 설치되어 있는 경우 앱으로 로그인 시도
          if (hasKakaoTalk) {
            console.log("카카오톡 앱으로 로그인 시도");
            // 카카오톡 앱 스키마를 통한 로그인 시도
            const kakaoAppUrl = `kakaotalk://oauth?client_id=${
              process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
            }&redirect_uri=${encodeURIComponent(
              window.location.origin + "/oauth/kakao/callback"
            )}&response_type=code`;
            window.location.href = kakaoAppUrl;

            // 앱 실행 실패 시 웹 로그인으로 폴백 (3초 후)
            setTimeout(() => {
              console.log("카카오톡 앱 실행 실패, 웹 로그인으로 전환");
              proceedWithWebLogin();
            }, 3000);
            return;
          }
        } catch (error) {
          console.warn("카카오톡 앱 감지 실패, 웹 로그인으로 진행:", error);
        }
      }

      // 웹 로그인 진행
      await proceedWithWebLogin();
    } catch (error) {
      console.error("카카오 로그인 시작 중 오류:", error);
      setIsLoading(false);
    }
  };

  const proceedWithWebLogin = async () => {
    try {
      // Django API 호출하여 카카오 로그인 URL 가져오기
      const response = await instance.get("/kakao/login");

      console.log("Django API 응답:", response.data);

      if (response.data.authUrl) {
        // Django에서 받은 카카오 로그인 URL로 리다이렉트
        console.log("리다이렉트할 URL:", response.data.authUrl);

        // iOS Safari에서는 window.location.href 대신 location.replace 사용 권장
        if (isIOSSafari()) {
          window.location.replace(response.data.authUrl);
        } else {
          window.location.href = response.data.authUrl;
        }
      } else {
        throw new Error("카카오 로그인 URL을 받지 못했습니다.");
      }
    } catch (error) {
      console.error("웹 로그인 처리 중 오류:", error);
      setIsLoading(false);
      throw error;
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
