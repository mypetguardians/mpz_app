"use client";

import { useEffect, useRef, useState } from "react";

interface KakaoMapProps {
  address: string;
  className?: string;
  height?: string;
}

// 카카오맵 타입 정의
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: kakaoMapOptions) => kakaoMap;
        LatLng: new (lat: number, lng: number) => kakaoLatLng;
        Marker: new (options: kakaoMarkerOptions) => kakaoMarker;
        services: {
          Geocoder: new () => kakaoGeocoder;
          Status: {
            OK: string;
          };
        };
      };
    };
  }
}

interface kakaoMapOptions {
  center: kakaoLatLng;
  level: number;
}

interface kakaoMap {
  setCenter: (latlng: kakaoLatLng) => void;
}

interface kakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface kakaoMarkerOptions {
  map: kakaoMap;
  position: kakaoLatLng;
}

interface kakaoMarker {
  setMap: (map: kakaoMap | null) => void;
}

interface kakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: kakaoGeocoderResult[], status: string) => void
  ) => void;
}

interface kakaoGeocoderResult {
  x: string;
  y: string;
}

export function KakaoMap({
  address,
  className = "",
  height = "h-48",
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !mapRef.current) return;

    const loadMap = () => {
      if (!mapRef.current) return;

      try {
        console.log("지도 로딩 시작:", address);
        console.log("카카오 맵 API 사용 가능 여부:", !!window.kakao?.maps);

        const mapOption = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978), // 서울 시청 기본 위치
          level: 3,
        };

        const map = new window.kakao.maps.Map(mapRef.current, mapOption);
        const geocoder = new window.kakao.maps.services.Geocoder();

        geocoder.addressSearch(
          address,
          (result: kakaoGeocoderResult[], status: string) => {
            console.log("주소 검색 결과:", { result, status });

            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(
                parseFloat(result[0].y),
                parseFloat(result[0].x)
              );
              map.setCenter(coords);
              new window.kakao.maps.Marker({
                map,
                position: coords,
              });
              setIsLoading(false);
              setError(null);
            } else {
              console.error("주소 검색 실패:", status);
              setError("주소를 찾을 수 없습니다");
              setIsLoading(false);
            }
          }
        );
      } catch (err) {
        console.error("지도 로딩 에러:", err);
        setError("지도를 불러올 수 없습니다");
        setIsLoading(false);
      }
    };

    // KakaoMapScript가 이미 로드되어 있는지 확인
    if (window.kakao?.maps?.load) {
      console.log("카카오 맵 API가 이미 로드됨, 지도 생성 시작");
      window.kakao.maps.load(() => {
        loadMap();
      });
    } else {
      console.log("카카오 맵 API 로드 대기 중...");
      // 스크립트가 로드될 때까지 기다림
      const interval = setInterval(() => {
        if (window.kakao?.maps?.load) {
          console.log("카카오 맵 API 로드 완료, 지도 생성 시작");
          clearInterval(interval);
          window.kakao.maps.load(() => {
            loadMap();
          });
        }
      }, 100);

      // 10초 후 타임아웃
      setTimeout(() => {
        clearInterval(interval);
        if (!window.kakao?.maps?.load) {
          console.error("카카오 맵 API 로드 타임아웃");
          setError("지도 API를 불러올 수 없습니다");
          setIsLoading(false);
        }
      }, 10000);
    }
  }, [address]);

  if (!address) {
    return (
      <div
        className={`w-full ${height} bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500 text-sm">위치 정보가 없습니다</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`w-full ${height} bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      >
        <span className="text-red-500 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div
      className={`w-full ${height} rounded-lg overflow-hidden border border-gray-200 ${className} relative`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <span className="text-gray-500 text-sm">지도 로딩 중...</span>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: "192px" }}
      />
    </div>
  );
}
