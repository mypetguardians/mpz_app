"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import instance from "@/lib/axios-instance";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        console.log("카카오 콜백 파라미터:", { code, state, error });

        if (error) {
          console.error("카카오 OAuth 에러:", error);
          router.push("/login?error=kakao_oauth_error");
          return;
        }

        if (!code) {
          console.error("인증 코드가 없습니다.");
          router.push("/login?error=no_auth_code");
          return;
        }

        console.log("Django 백엔드로 토큰 교환 요청 시작...");

        let response:
          | { data: { access_token: string; refresh_token?: string } }
          | undefined;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            response = await instance.get("/kakao/login/callback", {
              params: {
                code: code,
                state: "kakao_oauth_state",
              },
            });
            break;
          } catch (error: unknown) {
            retryCount++;
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.log(`시도 ${retryCount}/${maxRetries}: ${errorMessage}`);

            const axiosError = error as { response?: { status?: number } };

            if (axiosError?.response?.status === 503) {
              if (retryCount < maxRetries) {
                console.log("서버 일시적 불가용 (503). 2초 후 재시도...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                continue;
              }
            }

            if (retryCount >= maxRetries) {
              console.error("모든 시도 실패:", {
                error: errorMessage,
                retryCount,
              });
              throw new Error(
                "Django 백엔드의 카카오 콜백 엔드포인트를 찾을 수 없습니다. 서버 상태를 확인해주세요."
              );
            }
          }
        }

        if (!response) {
          throw new Error("응답을 받지 못했습니다.");
        }

        console.log("토큰 교환 응답:", response.data);

        if (response.data.access_token) {
          localStorage.setItem("access_token", response.data.access_token);
          if (response.data.refresh_token) {
            localStorage.setItem("refresh_token", response.data.refresh_token);
          }

          console.log("토큰 저장 완료");
          await setUserFromToken();
        } else {
          throw new Error("토큰을 받지 못했습니다.");
        }

        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(";").shift();
          return null;
        };

        const redirectUrl = getCookie("redirect_after_login");

        console.log("전체 쿠키:", document.cookie);
        console.log("redirect_after_login 쿠키 값:", redirectUrl);

        document.cookie =
          "redirect_after_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        if (redirectUrl && redirectUrl !== "/oauth/kakao/callback") {
          console.log("원래 페이지로 리다이렉트:", redirectUrl);
          router.push(redirectUrl);
        } else {
          console.log("마이 페이지로 리다이렉트 (기본값)");
          router.push("/my");
        }
      } catch (error) {
        console.error("카카오 콜백 처리 중 오류:", error);
        router.push("/login?error=callback_error");
      }
    };

    handleCallback();
  }, [router, setUserFromToken, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg">카카오 로그인 처리 중...</p>
        <p className="text-sm text-gray-600 mt-2">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg">로딩 중...</p>
          </div>
        </div>
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
