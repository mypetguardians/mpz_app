// Center Admin 관련 타입 정의

// Center Admin 생성 요청 데이터
export interface CreateCenterAdminData {
  username: string;
  password: string;
  email: string;
  nickname: string;
  user_type: "일반사용자" | "센터관리자" | "슈퍼관리자";
  phone_number: string;
}

// Center Admin 응답 데이터
export interface CenterAdminResponse {
  id: string;
  username: string;
  email: string;
  name: string;
  nickname: string;
  phone_number: string;
  user_type: string;
  status: string;
  is_phone_verified: boolean;
  image: string;
  birth: string;
  address: string;
  address_is_public: boolean;
  created_at: string;
}

// Zod 스키마 (검증용)
export const CenterAdminResponseSchema = {
  id: "string",
  username: "string",
  email: "string",
  name: "string",
  nickname: "string",
  phone_number: "string",
  user_type: "string",
  status: "string",
  is_phone_verified: false,
  image: "string",
  birth: "string",
  address: "string",
  address_is_public: false,
  created_at: "string",
} as const;

// 공지사항 관련 타입
export interface NoticeResponse {
  id: string;
  centerId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
