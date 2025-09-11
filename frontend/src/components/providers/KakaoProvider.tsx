"use client";

import Script from "next/script";

export function KakaoProvider() {
  const kakaoKey = "06b1ee860fa3d10d88b67258d93243cf";

  if (!kakaoKey) {
    console.error("NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY가 설정되지 않았습니다.");
    return null;
  }

  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js"
      integrity="sha384-WAtVcQYcmTO/N+C1N+1m6Gp8qxh+3NlnP7X1U7qP6P5dQY/MsRBNTh+e1ahJrkEm"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined" && window.Kakao) {
          console.log("카카오 JavaScript SDK 초기화 중...");
          window.Kakao.init(kakaoKey);
          console.log("카카오 JavaScript SDK 초기화 완료");
        }
      }}
      onError={(e) => {
        console.error("카카오 JavaScript SDK 로드 실패:", e);
      }}
    />
  );
}
