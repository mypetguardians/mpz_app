// 두 글자 지역명을 전체 이름으로 변환
export const getFullLocationName = (shortName: string): string => {
  const map: Record<string, string> = {
    충남: "충청남도",
    충북: "충청북도",
    전남: "전라남도",
    전북: "전라북도",
    경남: "경상남도",
    경북: "경상북도",
  };
  return map[shortName] || shortName;
};

// 전체 이름을 두 글자로 변환 (표시용)
export const getShortLocationName = (fullName: string): string => {
  const map: Record<string, string> = {
    충청남도: "충남",
    충청북도: "충북",
    전라남도: "전남",
    전라북도: "전북",
    경상남도: "경남",
    경상북도: "경북",
  };
  return map[fullName] || fullName;
};

// 지역명 비교 (두 글자 또는 전체 이름 모두 비교 가능)
export const isLocationMatch = (
  location1: string,
  location2: string
): boolean => {
  if (location1 === location2) return true;
  const short1 = getShortLocationName(location1);
  const short2 = getShortLocationName(location2);
  const full1 = getFullLocationName(location1);
  const full2 = getFullLocationName(location2);
  return (
    location1 === full2 ||
    location1 === short2 ||
    full1 === location2 ||
    short1 === location2 ||
    full1 === full2 ||
    short1 === short2
  );
};

// 지역명으로 검색 가능한 모든 변형 반환 (두 글자 + 전체 이름)
export const getRegionSearchVariants = (region: string): string[] => {
  const variants = [region];
  const short = getShortLocationName(region);
  const full = getFullLocationName(region);

  if (short !== region) variants.push(short);
  if (full !== region) variants.push(full);

  return [...new Set(variants)]; // 중복 제거
};

// 지역 리스트 (두 글자 + 전체 이름 모두 포함)
export const REGION_LIST: string[] = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  // 전체 이름 형식
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원도",
  "충청북도",
  "충청남도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

// 입력값이 지역명인지 판별 (두 글자와 전체 이름 모두 체크)
export const isRegionKeyword = (input: string): boolean => {
  const normalized = input.trim().toLowerCase();
  return REGION_LIST.some(
    (region) =>
      region.toLowerCase().includes(normalized) ||
      normalized.includes(region.toLowerCase())
  );
};
