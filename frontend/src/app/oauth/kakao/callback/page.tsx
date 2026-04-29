"use client";

import { Loading } from "@/components/common/Loading";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import instance from "@/lib/axios-instance";
import { isIOSSafari } from "@/lib/storage-utils";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const isIOS = isIOSSafari();

        if (isIOS) {
          document.body.style.overflow = "hidden";

          const viewportMeta = document.querySelector(
            'meta[name="viewport"]'
          ) as HTMLMetaElement;
          if (viewportMeta) {
            viewportMeta.content =
              "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
          }

          const handleVisibilityChange = () => {};
          const handlePageFocus = () => {};

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

        if (error) {
          router.push("/login?error=kakao_oauth_error");
          return;
        }

        if (!code) {
          router.push("/login?error=no_auth_code");
          return;
        }

        const currentRedirectUri = `${window.location.origin}/oauth/kakao/callback`;

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
                await new Promise((resolve) => setTimeout(resolve, 2000));
                continue;
              }
            }

            if (axiosError?.response?.status === 503) {
              if (retryCount < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                continue;
              }
            }

            if (
              axiosError?.response?.status &&
              axiosError.response.status >= 400 &&
              axiosError.response.status < 500
            ) {
              throw new Error(
                `요청 오류 (${axiosError.response.status}): ${
                  axiosError.response.statusText || errorMessage
                }`
              );
            }

            if (retryCount >= maxRetries) {
              throw new Error(
                `Django 백엔드 연결 실패 (${retryCount}회 시도): ${errorMessage}`
              );
            }
          }
        }

        if (!response) {
          throw new Error("응답을 받지 못했습니다.");
        }

        if (response.status === 302 || response.status === 301) {
          await setUserFromToken();
        } else if (response.data && response.data.access_token) {
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

        document.cookie =
          "redirect_after_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        if (
          redirectUrl &&
          redirectUrl !== "/oauth/kakao/callback" &&
          redirectUrl.startsWith("/") &&
          !redirectUrl.startsWith("//")
        ) {
          router.push(redirectUrl);
        } else {
          router.push("/my");
        }
      } catch {
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
        <Loading fullScreen size="lg" />
      }
    >
      <KakaoCallbackContent />
    </Suspense>
  );
}
