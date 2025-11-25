// 기존 center 타입들
export interface CenterBasic {
  id: string;
  name: string;
  centerNumber: string | null;
  description: string | null;
  location: string | null;
  region: string | null;
  phoneNumber: string | null;
  verified: boolean;
  adoptionPrice: number;
  imageUrl: string | null;
  isSubscriber: boolean;
  createdAt: string;
  updatedAt: string;
}

// 상세한 Center 타입 (useGetMyCenter에서 사용)
export interface Center extends CenterBasic {
  userId: string;
  adoptionProcedure: string | null;
  adoptionGuidelines: string | null;
  hasMonitoring: boolean;
  monitoringPeriodMonths: number | null;
  monitoringIntervalDays: number | null;
  monitoringDescription: string | null;
  isSubscriber: boolean;
  isPublic?: boolean;
  hasFosterCare?: boolean;
  hasVolunteer?: boolean;
  callAvailableTime?: string | null;
  isFavorited?: boolean; // 찜하기 상태 추가
}

// Center 생성/수정용 타입
export interface CreateCenterRequest {
  name: string;
  centerNumber?: string;
  description?: string;
  location?: string;
  region?: string;
  phoneNumber?: string;
  adoptionProcedure?: string;
  adoptionGuidelines?: string;
  hasMonitoring?: boolean;
  monitoringPeriodMonths?: number;
  monitoringIntervalDays?: number;
  monitoringDescription?: string;
  isPublic?: boolean;
  adoptionPrice?: number;
  imageUrl?: string;
}

export interface UpdateCenterRequest extends Partial<CreateCenterRequest> {
  id: string;
}

// Center 목록 조회용 타입
export interface CenterListResponse {
  centers: CenterBasic[];
  total: number;
  page: number;
  limit: number;
}

// Center 검색/필터링용 타입
export interface CenterSearchParams {
  name?: string; // 센터명 검색
  location?: string;
  region?: string;
  page?: number;
  page_size?: number;
  verified?: boolean;
  isPublic?: boolean;
  hasMonitoring?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// API 응답의 실제 snake_case 구조 (새로운 스키마 기반)
export interface RawCenterResponse {
  id: string;
  user_id: string;
  name: string;
  center_number: string;
  description: string;
  location: string;
  region: string;
  phone_number: string;
  adoption_procedure: string;
  adoption_guidelines: string;
  has_monitoring: boolean;
  monitoring_period_months: number;
  monitoring_interval_days: number;
  monitoring_description: string;
  verified: boolean;
  is_public: boolean;
  adoption_price: number;
  image_url: string;
  is_subscribed: boolean;
  has_volunteer: boolean;
  has_foster_care: boolean;
  call_available_time: string | null;
  created_at: string;
  updated_at: string;
  is_fav?: boolean; // 찜하기 상태 추가
}

// 센터 목록 API 응답 구조 (새로운 스키마 기반)
export interface GetCentersResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: RawCenterResponse[];
}

// RawCenterResponse를 Center로 변환하는 함수 (새로운 스키마 기반)
export function transformRawCenterToCenter(raw: RawCenterResponse): Center {
  return {
    id: raw.id,
    userId: raw.user_id,
    name: raw.name,
    centerNumber: raw.center_number,
    description: raw.description,
    location: raw.location,
    region: raw.region,
    phoneNumber: raw.phone_number,
    adoptionProcedure: raw.adoption_procedure,
    adoptionGuidelines: raw.adoption_guidelines,
    hasMonitoring: raw.has_monitoring,
    monitoringPeriodMonths: raw.monitoring_period_months,
    monitoringIntervalDays: raw.monitoring_interval_days,
    monitoringDescription: raw.monitoring_description,
    verified: raw.verified,
    isPublic: raw.is_public,
    adoptionPrice: raw.adoption_price,
    imageUrl: raw.image_url,
    hasFosterCare: raw.has_foster_care,
    hasVolunteer: raw.has_volunteer,
    callAvailableTime: raw.call_available_time,
    isSubscriber: raw.is_subscribed,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    isFavorited: raw.is_fav || false, // is_fav를 isFavorited로 변환
  };
}

// 좋아요 관련 타입들
export interface ToggleCenterFavoriteParams {
  centerId: string;
}

export interface ToggleCenterFavoriteResponse {
  is_favorited: boolean;
  total_favorites: number;
  message?: string;
}

export interface CheckCenterFavoriteParams {
  centerId: string;
}

export interface CheckCenterFavoriteResponse {
  is_favorited: boolean;
  total_favorites: number;
}

// 센터 설정 관련 타입들
export type CenterRegion =
  | "서울"
  | "부산"
  | "대구"
  | "인천"
  | "광주"
  | "대전"
  | "울산"
  | "세종"
  | "경기"
  | "강원"
  | "충북"
  | "충남"
  | "전북"
  | "전남"
  | "경북"
  | "경남"
  | "제주";

export interface UpdateCenterSettingsRequest {
  name?: string;
  center_number?: string;
  description?: string;
  location?: string;
  region?: CenterRegion;
  phone_number?: string;
  adoption_procedure?: string;
  adoption_guidelines?: string;
  has_monitoring?: boolean;
  monitoring_period_months?: number;
  monitoring_interval_days?: number;
  monitoring_description?: string;
  is_public?: boolean;
  adoption_price?: number;
  image_url?: string;
  has_foster_care?: boolean;
  has_volunteer?: boolean;
  call_available_time?: string;
}

export interface UpdateCenterSettingsResponse {
  id: string;
  name: string;
  center_number: string | null;
  description: string | null;
  location: string | null;
  region: CenterRegion | null;
  phone_number: string | null;
  adoption_procedure: string | null;
  adoption_guidelines: string | null;
  has_monitoring: boolean;
  monitoring_period_months: number | null;
  monitoring_interval_days: number | null;
  monitoring_description: string | null;
  verified: boolean;
  is_public: boolean;
  adoption_price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  call_available_time?: string;
}

// 센터별 절차 질문 관련 타입들
export interface CenterProcedureQuestion {
  id: string;
  center_id: string;
  question: string;
  type: string;
  options: string[];
  is_required: boolean;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface GetCenterProcedureQuestionsResponse {
  questions: CenterProcedureQuestion[];
}
