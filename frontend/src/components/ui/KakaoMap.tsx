"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (!address || !mapRef.current) return;

    const loadMap = () => {
      if (!mapRef.current) return;

      const mapOption = {
        center: new window.kakao.maps.LatLng(37.5665, 126.978), // 서울 시청 기본 위치
        level: 3,
      };

      const map = new window.kakao.maps.Map(mapRef.current, mapOption);
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(
        address,
        (result: kakaoGeocoderResult[], status: string) => {
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
          }
        }
      );
    };

    const scriptId = "kakao-map-script";
    const scriptExist = document.getElementById(scriptId);

    if (!scriptExist) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "//dapi.kakao.com/v2/maps/sdk.js?appkey=f6bb9e9986e477c7659509208fe268e6&autoload=false&libraries=services";
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          loadMap();
        });
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.kakao?.maps?.load) {
          clearInterval(interval);
          window.kakao.maps.load(() => {
            loadMap();
          });
        }
      }, 100);
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

  return (
    <div
      className={`w-full ${height} rounded-lg overflow-hidden border border-gray-200 ${className}`}
    >
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: "192px" }}
      />
    </div>
  );
}
