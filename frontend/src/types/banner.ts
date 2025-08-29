// 배너 타입 정의
export type BannerType = "main" | "sub";

// 배너 아이템 타입
export interface Banner {
  id: string;
  type: BannerType;
  title: string;
  description: string;
  alt: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
  link_url: string;
  created_at: string;
  updated_at: string;
}

// 배너 목록 조회 응답 타입
export interface BannerListResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: Banner[];
}

// 배너 목록 조회 파라미터 타입
export interface BannerListParams {
  type?: BannerType | null;
  page?: number;
  page_size?: number;
}
