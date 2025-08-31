"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

  const handleKakaoLogin = () => {
    try {
      setIsLoading(true);

      // 클라이언트 사이드에서 카카오 인증 URL 구성
      const clientId = "0ac4fb684d8e1e469976ec2b35f73857";
      const redirectUri =
        "https://mpzfullstack-production.up.railway.app/v1/kakao/login/callback";
      if (!clientId) {
        console.error("카카오 클라이언트 ID가 설정되지 않았습니다.");
        setIsLoading(false);
        return;
      }

      // state 파라미터 추가 (CSRF 보호)
      const state = crypto.randomUUID().replace(/-/g, "");
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&state=${state}`;

      console.log("카카오 인증 URL:", kakaoAuthUrl);

      // 카카오 인증 페이지로 리다이렉트
      window.location.href = kakaoAuthUrl;
    } catch (error) {
      console.error("카카오 로그인 시작 중 오류:", error);
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
