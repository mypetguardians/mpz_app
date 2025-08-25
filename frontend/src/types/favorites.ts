// API 응답 구조에 맞춘 타입 정의
export interface ApiResponse<T> {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: T[];
}

export interface AnimalFavorite {
  id: string;
  name: string;
  breed: string | null;
  age: number;
  isFemale: boolean;
  status: "보호중" | "입양완료" | "무지개다리" | "임시보호중" | "반환" | "방사";
  personality: string | null;
  centerId: string;
  centerName: string;
  isFavorited: boolean;
  favoritedAt: string;
}

export interface CenterFavorite {
  id: string;
  name: string;
  location: string | null;
  region: string | null;
  phoneNumber: string | null;
  imageUrl: string | null;
  isFavorited: boolean;
  favoritedAt: string;
}

// API 응답에 맞춘 새로운 타입들
export interface ApiCenterFavorite {
  id: string;
  name: string;
  location: string;
  region: string;
  phone_number: string;
  image_url: string;
  is_favorited: boolean;
  favorited_at: string;
}

export interface ApiAnimalFavorite {
  id: string;
  name: string;
  breed: string | null;
  age: number;
  isFemale: boolean;
  status: "보호중" | "입양완료" | "무지개다리" | "임시보호중" | "반환" | "방사";
  personality: string | null;
  centerId: string;
  centerName: string;
  isFavorited: boolean;
  favoritedAt: string;
}

// 기존 응답 타입들 (하위 호환성을 위해 유지)
export interface AnimalFavoritesResponse {
  animals: AnimalFavorite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CenterFavoritesResponse {
  centers: CenterFavorite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 새로운 API 응답 타입들
export type CenterFavoritesApiResponse = ApiResponse<ApiCenterFavorite>;
export type AnimalFavoritesApiResponse = ApiResponse<ApiAnimalFavorite>;
