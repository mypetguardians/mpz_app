"use client";
import Script from "next/script";

let loaded = false;

export default function KakaoMapScript() {
  const mapKey = "06b1ee860fa3d10d88b67258d93243cf";

  if (!mapKey) {
    console.error("NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다.");
    return null;
  }

  return (
    <Script
      src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${mapKey}&libraries=services&autoload=false`}
      strategy="afterInteractive"
      onLoad={() => {
        console.log("카카오 맵 스크립트 로드됨");
        if (window.kakao?.maps?.load && !loaded) {
          window.kakao.maps.load(() => {
            loaded = true;
            console.log("카카오 맵 API 로드 완료");
          });
        }
      }}
      onError={(e) => {
        console.error("카카오 맵 스크립트 로드 실패:", e);
      }}
    />
  );
}
