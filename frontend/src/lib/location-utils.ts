// 위도/경도를 기반으로 주변 지역을 계산하는 유틸리티

import { setKey, setLanguage, fromLatLng } from "react-geocode";

interface Location {
  latitude: number;
  longitude: number;
}

interface RegionInfo {
  name: string;
  center: Location;
  radius: number; // km 단위
}

// 한국의 주요 지역 정보 (위도, 경도, 반경)
// 경기도를 먼저 배치하여 우선순위를 높임
const REGIONS: RegionInfo[] = [
  {
    name: "경기",
    center: { latitude: 37.5, longitude: 127.3 }, // 경기도 중심을 더 북쪽으로 이동
    radius: 90, // 반경을 더 늘려서 경기도 전체를 커버
  },
  {
    name: "서울",
    center: { latitude: 37.5665, longitude: 126.978 },
    radius: 20,
  },
  {
    name: "부산",
    center: { latitude: 35.1796, longitude: 129.0756 },
    radius: 40,
  },
  {
    name: "대구",
    center: { latitude: 35.8714, longitude: 128.6014 },
    radius: 35,
  },
  {
    name: "인천",
    center: { latitude: 37.4563, longitude: 126.7052 },
    radius: 30,
  },
  {
    name: "광주",
    center: { latitude: 35.1595, longitude: 126.8526 },
    radius: 30,
  },
  {
    name: "대전",
    center: { latitude: 36.3504, longitude: 127.3845 },
    radius: 30,
  },
  {
    name: "울산",
    center: { latitude: 35.5384, longitude: 129.3114 },
    radius: 30,
  },
  { name: "세종", center: { latitude: 36.48, longitude: 127.289 }, radius: 25 },
  {
    name: "강원",
    center: { latitude: 37.8228, longitude: 128.1555 },
    radius: 80,
  },
  { name: "충북", center: { latitude: 36.8, longitude: 127.7 }, radius: 50 },
  { name: "충남", center: { latitude: 36.5184, longitude: 126.8 }, radius: 60 },
  {
    name: "전북",
    center: { latitude: 35.7175, longitude: 127.153 },
    radius: 50,
  },
  {
    name: "전남",
    center: { latitude: 34.8679, longitude: 126.991 },
    radius: 60,
  },
  {
    name: "경북",
    center: { latitude: 36.4919, longitude: 128.8889 },
    radius: 70,
  },
  {
    name: "경남",
    center: { latitude: 35.4606, longitude: 128.2132 },
    radius: 60,
  },
  {
    name: "제주",
    center: { latitude: 33.4996, longitude: 126.5312 },
    radius: 40,
  },
];

// 두 지점 간의 거리를 계산하는 함수 (Haversine 공식)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 주어진 위치에서 가장 가까운 지역을 찾는 함수 (거리 순 비교)
export function findNearestRegion(
  latitude: number,
  longitude: number
): string | null {
  let nearestRegion: string | null = null;
  let minDistance = Infinity;

  for (const region of REGIONS) {
    const distance = calculateDistance(
      latitude,
      longitude,
      region.center.latitude,
      region.center.longitude
    );

    if (distance <= region.radius && distance < minDistance) {
      minDistance = distance;
      nearestRegion = region.name;
    }
  }

  return nearestRegion;
}

// 주어진 위치에서 일정 반경 내의 모든 지역을 찾는 함수
export function findNearbyRegions(
  latitude: number,
  longitude: number,
  radius: number = 50
): string[] {
  const nearbyRegions: string[] = [];

  for (const region of REGIONS) {
    const distance = calculateDistance(
      latitude,
      longitude,
      region.center.latitude,
      region.center.longitude
    );

    if (distance <= radius) {
      nearbyRegions.push(region.name);
    }
  }

  return nearbyRegions.sort((a, b) => {
    const distanceA = calculateDistance(
      latitude,
      longitude,
      REGIONS.find((r) => r.name === a)!.center.latitude,
      REGIONS.find((r) => r.name === a)!.center.longitude
    );
    const distanceB = calculateDistance(
      latitude,
      longitude,
      REGIONS.find((r) => r.name === b)!.center.latitude,
      REGIONS.find((r) => r.name === b)!.center.longitude
    );
    return distanceA - distanceB;
  });
}

// 위치정보를 기반으로 주변 지역명을 반환하는 함수
export function getLocationBasedRegion(
  latitude: number,
  longitude: number
): string {
  const nearestRegion = findNearestRegion(latitude, longitude);

  return nearestRegion || "위치를 확인할 수 없습니다"; // 기본값 변경
}

// 위치정보가 유효한지 확인하는 함수
export function isValidLocation(latitude: number, longitude: number): boolean {
  return (
    latitude >= 33.0 &&
    latitude <= 38.6 && // 한국 위도 범위
    longitude >= 124.5 &&
    longitude <= 132.0 // 한국 경도 범위
  );
}

// -----------------------------
// Google Reverse Geocoding Utils
// -----------------------------

let geocodeConfigured = false;

function ensureGeocodeConfigured(): void {
  if (geocodeConfigured) return;
  if (typeof window === "undefined") return; // SSR 보호
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) return;
  setKey(apiKey);
  setLanguage("ko");
  geocodeConfigured = true;
}

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function extractAddressPart(
  components: GoogleAddressComponent[] | undefined,
  type: string
): string | null {
  if (!components) return null;
  const comp = components.find((c) => c.types.includes(type));
  return comp ? comp.long_name : null;
}

export type AdministrativeAddress = {
  sido: string | null; // administrative_area_level_1
  sigungu: string | null; // administrative_area_level_2 혹은 locality
  fullAddress: string | null; // formatted_address
};

export async function reverseGeocodeAdministrative(
  latitude: number,
  longitude: number
): Promise<AdministrativeAddress | null> {
  if (!isValidLocation(latitude, longitude)) return null;
  if (typeof window === "undefined") return null;
  ensureGeocodeConfigured();
  try {
    type GeocodeResponse = {
      results?: Array<{
        address_components?: GoogleAddressComponent[];
        formatted_address?: string;
      }>;
    };
    const result: GeocodeResponse = await fromLatLng(latitude, longitude);
    const top = result?.results?.[0];
    const components: GoogleAddressComponent[] | undefined =
      top?.address_components;
    const formatted: string | null = top?.formatted_address ?? null;

    // 행정구역 추출
    const level1 =
      extractAddressPart(components, "administrative_area_level_1") || null;
    let level2 =
      extractAddressPart(components, "administrative_area_level_2") || null;
    if (!level2) {
      // 일부 응답에서는 locality에 시/구가 담기는 경우가 있음
      level2 = extractAddressPart(components, "locality") || null;
    }

    return { sido: level1, sigungu: level2, fullAddress: formatted };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("reverseGeocodeAdministrative error", err);
    }
    return null;
  }
}

// Google 시/도 명칭을 내부 지역명으로 정규화
function normalizeSidoToRegionName(sido: string | null): string | null {
  if (!sido) return null;
  const map: Record<string, string> = {
    서울특별시: "서울",
    부산광역시: "부산",
    대구광역시: "대구",
    인천광역시: "인천",
    광주광역시: "광주",
    대전광역시: "대전",
    울산광역시: "울산",
    세종특별자치시: "세종",
    경기도: "경기",
    강원도: "강원",
    강원특별자치도: "강원",
    충청북도: "충북",
    충청남도: "충남",
    전라북도: "전북",
    전북특별자치도: "전북",
    전라남도: "전남",
    경상북도: "경북",
    경상남도: "경남",
    제주특별자치도: "제주",
  };
  return map[sido] ?? sido;
}

// 시/도 기준 내부 지역명 반환 (구글 우선, 실패 시 기존 근접 로직)
export async function getRegionNameByGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  const admin = await reverseGeocodeAdministrative(latitude, longitude);
  const normalized = normalizeSidoToRegionName(admin?.sido ?? null);
  if (normalized) return normalized;
  // fallback: 기존 근접 로직
  return getLocationBasedRegion(latitude, longitude);
}

export async function getSidoFromLatLng(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const admin = await reverseGeocodeAdministrative(latitude, longitude);
  return admin?.sido ?? null;
}

export async function getSigunguFromLatLng(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const admin = await reverseGeocodeAdministrative(latitude, longitude);
  return admin?.sigungu ?? null;
}

export async function getFormattedAddressFromLatLng(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const admin = await reverseGeocodeAdministrative(latitude, longitude);
  return admin?.fullAddress ?? null;
}
