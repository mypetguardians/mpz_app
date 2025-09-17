"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import instance from "@/lib/axios-instance";
import { isIOSSafari, isPrivateMode } from "@/lib/storage-utils";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const isIOS = isIOSSafari();
        const isPrivate = await isPrivateMode();

        console.log("브라우저 환경:", { isIOS, isPrivate });

        if (isIOS && isPrivate) {
          console.warn(
            "iOS Safari Private 모드에서 실행 중 - 쿠키 기반 저장 사용"
          );
        }

        // iOS Safari에서 앱에서 돌아온 경우 추가 처리
        if (isIOS) {
          console.log("iOS Safari 환경에서 카카오 콜백 처리");

          // iOS Safari 특화 설정
          document.body.style.overflow = "hidden";

          const viewportMeta = document.querySelector(
            'meta[name="viewport"]'
          ) as HTMLMetaElement;
          if (viewportMeta) {
            viewportMeta.content =
              "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
          }

          const handleVisibilityChange = () => {
            if (!document.hidden) {
              console.log("앱에서 브라우저로 돌아옴");
              console.log("HttpOnly 쿠키는 자동으로 전송됨");
            }
          };

          const handlePageFocus = () => {
            console.log("iOS Safari - 페이지 포커스 복원");
          };

          document.addEventListener("visibilitychange", handleVisibilityChange);
          window.addEventListener("focus", handlePageFocus);

          return () => {
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange
            );
            window.removeEventListener("focus", handlePageFocus);
            document.body.style.overflow = "";
          };
        }

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
        console.log("요청 파라미터:", { code, state });

        // 현재 페이지의 redirect_uri 구성
        const currentRedirectUri = `${window.location.origin}/oauth/kakao/callback`;
        console.log("현재 redirect_uri:", currentRedirectUri);

        let response:
          | {
              status: number;
              data: { access_token?: string; refresh_token?: string };
            }
          | undefined;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            response = await instance.get("/kakao/login/callback", {
              params: {
                code: code,
                state: state || "kakao_oauth_state",
                redirect_uri: currentRedirectUri,
              },
              maxRedirects: 0, // 리다이렉트를 따라가지 않음
              validateStatus: function (status) {
                return status >= 200 && status < 400;
              },
            });
            break;
          } catch (error: unknown) {
            retryCount++;
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            console.log(`시도 ${retryCount}/${maxRetries}: ${errorMessage}`);

            const axiosError = error as {
              response?: {
                status?: number;
                data?: unknown;
                statusText?: string;
              };
              code?: string;
              message?: string;
            };

            // 네트워크 에러 처리
            if (
              axiosError.code === "NETWORK_ERROR" ||
              axiosError.code === "ECONNREFUSED"
            ) {
              if (retryCount < maxRetries) {
                console.log("네트워크 연결 오류. 2초 후 재시도...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                continue;
              }
            }

            // 서버 에러 처리
            if (axiosError?.response?.status === 503) {
              if (retryCount < maxRetries) {
                console.log("서버 일시적 불가용 (503). 2초 후 재시도...");
                await new Promise((resolve) => setTimeout(resolve, 2000));
                continue;
              }
            }

            // 4xx 클라이언트 에러는 재시도하지 않음
            if (
              axiosError?.response?.status &&
              axiosError.response.status >= 400 &&
              axiosError.response.status < 500
            ) {
              console.error("클라이언트 에러 (재시도 안함):", {
                status: axiosError.response.status,
                statusText: axiosError.response.statusText,
                data: axiosError.response.data,
              });
              throw new Error(
                `요청 오류 (${axiosError.response.status}): ${
                  axiosError.response.statusText || errorMessage
                }`
              );
            }

            if (retryCount >= maxRetries) {
              console.error("모든 시도 실패:", {
                error: errorMessage,
                retryCount,
                status: axiosError?.response?.status,
                statusText: axiosError?.response?.statusText,
              });
              throw new Error(
                `Django 백엔드 연결 실패 (${retryCount}회 시도): ${errorMessage}`
              );
            }
          }
        }

        if (!response) {
          throw new Error("응답을 받지 못했습니다.");
        }

        console.log("토큰 교환 응답:", response.status, response.data);

        // 백엔드에서 리다이렉트(302)를 반환하는 경우
        if (response.status === 302 || response.status === 301) {
          console.log("서버에서 리다이렉트 응답 - HttpOnly 쿠키로 토큰 저장됨");
          // 쿠키가 설정되었으므로 사용자 정보를 가져옴
          await setUserFromToken();
          console.log("setUserFromToken 호출 완료");
        } else if (response.data && response.data.access_token) {
          console.log("서버에서 JSON 응답으로 토큰 받음");
          await setUserFromToken();
          console.log("setUserFromToken 호출 완료");
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
