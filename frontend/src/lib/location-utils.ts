// 위도/경도를 기반으로 주변 지역을 계산하는 유틸리티

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
const REGIONS: RegionInfo[] = [
  {
    name: "서울",
    center: { latitude: 37.5665, longitude: 126.978 },
    radius: 50,
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
    name: "경기",
    center: { latitude: 37.4138, longitude: 127.5183 },
    radius: 60,
  },
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

// 주어진 위치에서 가장 가까운 지역을 찾는 함수
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

    // 반경 내에 있는지 확인
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
  return nearestRegion || "서울"; // 기본값으로 서울 반환
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
