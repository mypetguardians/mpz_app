export const weightOptions = ["10kg 이하", "25kg 이하", "그 이상"];

export const ageOptions = ["2살 이하", "7살 이하", "그 이상"];

export const genderOptions = ["남아", "여아"];

// 필터용 보호상태 (사용자가 보는 그룹)
export const protectionStatusOptions = [
  "입양가능",
  "🌈",
  "반환",
  "방사",
  "입양완료",
];

export const protectionStatusToRawMap: Record<string, string[]> = {
  입양가능: ["임시보호", "보호중"],
  "🌈": ["안락사", "자연사"],
};

// 동물 업로드용 보호상태 (실제 DB 상태)
export const animalProtectionStatusOptions = [
  "보호중",
  "임시보호",
  "안락사",
  "자연사",
  "반환",
  "기증",
  "방사",
  "입양완료",
];

export const expertOpinionOptions = ["포함"];

export const regionOptions = [
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
];
