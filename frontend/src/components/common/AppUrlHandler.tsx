"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function AppUrlHandler() {
  const router = useRouter();

  useEffect(() => {
    // 네이티브 앱에서만 실행
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 앱이 URL로 열릴 때 처리
    const handleAppUrl = async (event: { url: string }) => {
      console.log("앱 URL 이벤트:", event.url);

      // mpz://oauth/kakao/callback?code=xxx&state=xxx 형식 처리
      if (event.url.startsWith("mpz://oauth/kakao/callback")) {
        try {
          // URL 파싱 (mpz:// 스킴을 https://로 변환하여 파싱)
          const urlString = event.url.replace("mpz://", "https://");
          const url = new URL(urlString);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const error = url.searchParams.get("error");

          console.log("카카오 콜백 파라미터:", { code, state, error });

          if (error) {
            console.error("카카오 OAuth 에러:", error);
            router.push(`/login?error=kakao_oauth_error`);
            return;
          }

          if (code) {
            // 웹 콜백 페이지로 리다이렉트 (쿼리 파라미터 포함)
            const queryParams = new URLSearchParams();
            queryParams.set("code", code);
            if (state) {
              queryParams.set("state", state);
            }
            router.push(`/oauth/kakao/callback?${queryParams.toString()}`);
          } else {
            console.error("인증 코드가 없습니다.");
            router.push(`/login?error=no_auth_code`);
          }
        } catch (error) {
          console.error("URL 파싱 오류:", error);
          router.push(`/login?error=url_parse_error`);
        }
      }
    };

    // 앱이 URL로 열릴 때 이벤트 리스너 등록
    App.addListener("appUrlOpen", handleAppUrl);

    // 앱 시작 시 이미 열려있는 URL 처리
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleAppUrl({ url: result.url });
      }
    });

    // 클린업
    return () => {
      App.removeAllListeners();
    };
  }, [router]);

  return null;
}

