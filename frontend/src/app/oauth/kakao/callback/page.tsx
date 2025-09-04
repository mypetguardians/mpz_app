"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import instance from "@/lib/axios-instance";
import {
  safeGetItem,
  isIOSSafari,
  isPrivateMode,
  setSafeCookieForSafari,
} from "@/lib/storage-utils";
import Cookies from "js-cookie";

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // iOS Safari 및 Private 모드 감지
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
          // 1. 스크롤 방지 (키보드로 인한 레이아웃 변경 방지)
          document.body.style.overflow = "hidden";

          // 2. 뷰포트 메타 태그 동적 설정
          const viewportMeta = document.querySelector(
            'meta[name="viewport"]'
          ) as HTMLMetaElement;
          if (viewportMeta) {
            viewportMeta.content =
              "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
          }

          // 페이지 가시성 변경 이벤트 리스너 추가 (앱 전환 감지)
          const handleVisibilityChange = () => {
            if (!document.hidden) {
              console.log("앱에서 브라우저로 돌아옴");
              // iOS Safari에서 앱 전환 후 토큰 재검증
              setTimeout(() => {
                const token = safeGetItem("access_token");
                if (!token) {
                  console.warn("앱 전환 후 토큰 손실 감지");
                }
              }, 500);
            }
          };

          // iOS Safari에서 페이지 포커스 이벤트도 추가
          const handlePageFocus = () => {
            console.log("iOS Safari - 페이지 포커스 복원");
          };

          document.addEventListener("visibilitychange", handleVisibilityChange);
          window.addEventListener("focus", handlePageFocus);

          // 컴포넌트 언마운트 시 리스너 제거 및 스타일 복원
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
          // 쿠키와 로컬스토리지 모두에 저장 (사파리 호환성)
          Cookies.set("access_token", response.data.access_token, {
            secure: true,
            sameSite: "lax", // 사파리 호환성
            expires: 365, // 1년
          });
          localStorage.setItem("access_token", response.data.access_token);

          if (response.data.refresh_token) {
            Cookies.set("refresh_token", response.data.refresh_token, {
              secure: true,
              sameSite: "lax",
              expires: 730, // 2년
              httpOnly: false, // JS에서 접근 가능하도록 설정
            });
            localStorage.setItem("refresh_token", response.data.refresh_token);
          }

          // 저장 즉시 검증
          const storedAccessToken = safeGetItem("access_token");
          console.log(
            "💾 토큰 저장 검증:",
            storedAccessToken
              ? `${storedAccessToken.substring(0, 10)}...`
              : "저장 실패"
          );

          console.log("토큰 저장 완료");

          // iOS Safari에서 토큰 저장 후 즉시 검증 및 다중 재시도
          if (isIOS) {
            console.log("iOS Safari - 토큰 저장 검증 중...");

            // 다중 재시도 로직 (최대 3회)
            let retryCount = 0;
            const maxRetries = 3;

            const verifyAndRetryTokenStorage = async () => {
              const storedToken = safeGetItem("access_token");

              if (!storedToken && retryCount < maxRetries) {
                retryCount++;
                console.error(
                  `토큰 저장 실패 감지, 재시도 ${retryCount}/${maxRetries}...`
                );

                // 토큰 재저장 시도 (다양한 방법 사용)
                try {
                  // 1. localStorage 직접 시도
                  localStorage.setItem(
                    "access_token",
                    response.data.access_token
                  );

                  // 2. 쿠키 저장도 시도
                  setSafeCookieForSafari(
                    "access_token",
                    response.data.access_token,
                    86400
                  );

                  if (response.data.refresh_token) {
                    localStorage.setItem(
                      "refresh_token",
                      response.data.refresh_token
                    );
                    setSafeCookieForSafari(
                      "refresh_token",
                      response.data.refresh_token,
                      2592000
                    );
                  }

                  // 잠시 후 재검증
                  setTimeout(verifyAndRetryTokenStorage, 200);
                } catch (storageError) {
                  console.error("토큰 저장 재시도 실패:", storageError);
                  // 쿠키만으로라도 저장 시도
                  setSafeCookieForSafari(
                    "access_token",
                    response.data.access_token,
                    86400
                  );
                  if (response.data.refresh_token) {
                    setSafeCookieForSafari(
                      "refresh_token",
                      response.data.refresh_token,
                      2592000
                    );
                  }
                }
              } else if (storedToken) {
                console.log("토큰 저장 검증 완료");
              } else {
                console.error("토큰 저장 최종 실패 - 쿠키만 사용");
              }
            };

            // 초기 검증 시작
            setTimeout(verifyAndRetryTokenStorage, 100);
          }

          console.log("setUserFromToken 호출 전");
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
