"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import instance from "@/lib/axios-instance";
import { useAuth } from "@/components/providers/AuthProvider";
import { KakaoNativeLogin } from "@/lib/capacitor/kakao-login";

interface KakaoButtonProps {
  onClick?: () => void;
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export function KakaoButton({
  onClick,
  href,
  className = "",
  children = "카카오로 시작하기",
}: KakaoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUserFromToken } = useAuth();

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    // iOS나 Android인 경우 네이티브로 간주
    const isIOS = platform === "ios";
    const isAndroid = platform === "android";
    const shouldUseNative = isIOS || isAndroid;

    console.log("카카오 로그인 시작", {
      platform,
      isNative,
      isIOS,
      isAndroid,
      shouldUseNative,
    });

    try {
      if (shouldUseNative) {
        // 플러그인 사용 가능 여부 확인
        console.log("🔍 플러그인 확인 중...", {
          KakaoNativeLogin,
          type: typeof KakaoNativeLogin,
          platform,
          isNative,
        });

        // 플러그인 존재 여부 확인 (없으면 바로 에러 안내)
        const hasInitialize =
          KakaoNativeLogin && typeof KakaoNativeLogin.initialize === "function";
        const hasLogin =
          KakaoNativeLogin &&
          typeof KakaoNativeLogin.login === "function" &&
          hasInitialize;

        console.log("🔍 플러그인 메서드 확인:", {
          hasInitialize,
          hasLogin,
          hasLogout: typeof KakaoNativeLogin.logout === "function",
          hasUnlink: typeof KakaoNativeLogin.unlink === "function",
          pluginKeys: KakaoNativeLogin ? Object.keys(KakaoNativeLogin) : [],
        });

        if (!hasLogin) {
          console.error(
            "❌ KakaoNativeLogin 플러그인이 없습니다 (iOS/Android)"
          );
          alert(
            "카카오톡 앱 연동을 위해 네이티브 플러그인이 필요합니다.\n앱을 다시 빌드하거나 플러그인 설치 상태를 확인해주세요."
          );
          throw new Error("KakaoNativeLogin 플러그인이 누락되었습니다.");
        }

        console.log("✅ 네이티브 카카오 로그인 호출 중...", {
          platform,
          plugin: KakaoNativeLogin,
          hasLogin: typeof KakaoNativeLogin.login === "function",
        });

        let result;
        try {
          result = await KakaoNativeLogin.login();
          console.log("✅ 네이티브 카카오 로그인 결과:", result);
        } catch (pluginError) {
          console.error("❌ 플러그인 호출 에러:", pluginError);
          console.error("에러 상세:", {
            message:
              pluginError instanceof Error
                ? pluginError.message
                : String(pluginError),
            stack: pluginError instanceof Error ? pluginError.stack : undefined,
            platform,
          });
          throw new Error(
            `네이티브 플러그인 호출 실패: ${
              pluginError instanceof Error
                ? pluginError.message
                : String(pluginError)
            }`
          );
        }

        if (!result?.accessToken) {
          console.error("❌ 액세스 토큰이 없습니다:", result);
          throw new Error("네이티브 카카오 액세스 토큰을 가져오지 못했습니다.");
        }

        console.log("서버에 토큰 전송 중...");
        await instance.post("kakao/native/login", {
          access_token: result.accessToken,
        });
        await setUserFromToken();
        router.replace("/");
        return;
      }

      // 웹 환경: 기존 OAuth 플로우 사용
      console.log("🌐 웹 환경에서 카카오 로그인 시작", { platform, isNative });
      const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "";
      if (!clientId) {
        console.error("카카오 클라이언트 ID가 설정되지 않았습니다.");
        return;
      }

      const redirectUri = "https://api.mpz.kr/v1/kakao/login/callback";
      const state = crypto.randomUUID().replace(/-/g, "");
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&state=${state}`;

      window.location.href = kakaoAuthUrl;
    } catch (error) {
      console.error("카카오 로그인 시작 중 오류:", error);
      console.error("에러 상세:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        isNative,
        platform,
      });

      // 네이티브 환경에서 에러가 발생했을 때는 웹으로 fallback하지 않음
      if (isNative) {
        alert(
          `네이티브 로그인에 실패했습니다: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } else {
        alert("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buttonContent = (
    <>
      <Image src="/img/kakaoLogo.svg" alt="kakao logo" width={20} height={20} />
      {isLoading ? "로그인 중..." : children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`flex items-center justify-center cursor-pointer gap-2 bg-[#FEE404] text-black text-base font-medium rounded-[10px] w-[80%] h-[48px] px-[14px] shadow transition ${className}`}
      >
        {buttonContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick || handleKakaoLogin}
      disabled={isLoading}
      className={`flex items-center justify-center cursor-pointer gap-2 bg-[#FEE404] text-black text-base font-medium rounded-[10px] w-[80%] h-[48px] px-[14px] shadow transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {buttonContent}
    </button>
  );
}
