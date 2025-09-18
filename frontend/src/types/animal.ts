// 프론트엔드에서 사용하는 Animal 타입 (자체 정의)
export interface Animal {
  id: string;
  name: string;
  isFemale: boolean;
  age: number;
  weight: number | null;
  color: string | null;
  breed: string | null;
  description: string | null;
  status:
    | "보호중"
    | "입양대기"
    | "입양완료"
    | "무지개다리"
    | "임시보호중"
    | "반환"
    | "방사";
  protection_status: "보호중" | "안락사" | "자연사" | "반환";
  adoption_status: "입양가능" | "입양진행중" | "입양완료" | "입양불가";
  waitingDays: number | null;
  activityLevel: string | null;
  sensitivity: string | null;
  sociability: string | null;
  separationAnxiety: string | null;
  specialNotes: string | null;
  healthNotes: string | null;
  basicTraining: string | null;
  trainerComment: string | null;
  announceNumber: string | null;
  announcementDate: string | null;
  noticeStartDate: string | null;
  noticeEndDate: string | null;
  admissionDate: string | null;
  foundLocation: string | null;
  personality: string | null;
  megaphoneCount: number;
  isMegaphoned: boolean;
  centerId: string;
  animalImages: Array<{
    id: string;
    imageUrl: string;
    orderIndex: number;
  }> | null;
  createdAt: string;
  updatedAt: string;
}

// API 요청 파라미터 타입 (백엔드 API 문서에 맞게 수정)
export interface GetAnimalsParams {
  status?:
    | "보호중"
    | "안락사"
    | "자연사"
    | "반환"
    | "입양가능"
    | "입양진행중"
    | "입양완료"
    | "입양불가";
  center_id?: string;
  gender?: "male" | "female";
  weight_min?: number;
  weight_max?: number;
  age_min?: number;
  age_max?: number;
  breed?: string;
  region?: string;
  has_trainer_comment?: "true" | "false";
  sort_by?: "created_at" | "admission_date" | "megaphone_count";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

// API 응답의 실제 snake_case 구조
export interface RawAnimalResponse {
  id: string;
  name: string;
  is_female: boolean;
  age: number;
  weight: number | null;
  color: string | null;
  breed: string | null;
  description: string | null;
  protection_status: "보호중" | "안락사" | "자연사" | "반환";
  adoption_status: "입양가능" | "입양진행중" | "입양완료" | "입양불가";
  waiting_days: number | null;
  activity_level: number | null;
  sensitivity: number | null;
  sociability: number | null;
  separation_anxiety: number | null;
  special_notes: string | null;
  health_notes: string | null;
  basic_training: number | null;
  trainer_comment: string | null;
  announce_number: string | null;
  announcement_date: string | null;
  notice_start_date: string | null;
  notice_end_date: string | null;
  admission_date: string | null;
  found_location: string | null;
  personality: string | null;
  megaphone_count: number;
  is_megaphoned: boolean;
  center_id: string;
  animal_images: Array<{
    id: string;
    image_url: string;
    order_index: number;
  }> | null;
  created_at: string;
  updated_at: string;
}

// 실제 API 응답 구조 (백엔드 CustomPageNumberPagination)
export interface ActualGetAnimalsResponse {
  data: RawAnimalResponse[]; // 실제 동물 데이터
  count: number; // 현재 페이지 아이템 수
  totalCnt: number; // 전체 아이템 수
  pageCnt: number; // 전체 페이지 수
  curPage: number; // 현재 페이지
  nextPage: number | null; // 다음 페이지 (없으면 null)
  previousPage: number | null; // 이전 페이지 (없으면 null)
}

// PetCard에서 사용하는 타입 (기존 호환성을 위해 유지)
// 새로운 PetCard 타입 사용을 권장합니다
export type PetCardAnimal = Pick<
  Animal,
  | "id"
  | "name"
  | "breed"
  | "isFemale"
  | "protection_status"
  | "adoption_status"
  | "centerId"
  | "animalImages"
  | "foundLocation"
> & {
  weight?: number | null;
  color?: string | null;
  waitingDays?: number | null;
  description?: string | null;
  activityLevel?: string | null;
  sensitivity?: string | null;
  sociability?: string | null;
  separationAnxiety?: string | null;
  specialNotes?: string | null;
  healthNotes?: string | null;
  basicTraining?: string | null;
  trainerComment?: string | null;
  announceNumber?: string | null;
  announcementDate?: string | null;
  admissionDate?: string | null;
  updatedAt?: string;
};

// RawAnimalResponse를 Animal으로 변환하는 함수
export function transformRawAnimalToAnimal(raw: RawAnimalResponse): Animal {
  return {
    id: raw.id,
    name: raw.name,
    isFemale: raw.is_female,
    age: raw.age,
    weight: raw.weight,
    color: raw.color,
    breed: raw.breed,
    description: raw.description,
    status: "보호중", // 기본값, 필요에 따라 로직 추가
    protection_status: raw.protection_status,
    adoption_status: raw.adoption_status,
    waitingDays: raw.waiting_days,
    activityLevel: raw.activity_level?.toString() || null,
    sensitivity: raw.sensitivity?.toString() || null,
    sociability: raw.sociability?.toString() || null,
    separationAnxiety: raw.separation_anxiety?.toString() || null,
    specialNotes: raw.special_notes,
    healthNotes: raw.health_notes,
    basicTraining: raw.basic_training?.toString() || null,
    trainerComment: raw.trainer_comment,
    announceNumber: raw.announce_number,
    announcementDate: raw.announcement_date,
    noticeStartDate: raw.notice_start_date,
    noticeEndDate: raw.notice_end_date,
    admissionDate: raw.admission_date,
    foundLocation: raw.found_location,
    personality: raw.personality,
    megaphoneCount: raw.megaphone_count,
    isMegaphoned: raw.is_megaphoned,
    centerId: raw.center_id,
    animalImages: raw.animal_images
      ? raw.animal_images.map((img) => ({
          id: img.id,
          imageUrl: img.image_url,
          orderIndex: img.order_index,
        }))
      : null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// RawAnimalResponse를 PetCardAnimal으로 변환하는 함수 (기존 호환성을 위해 유지)
// 새로운 PetCard 타입 사용을 권장합니다
export function transformRawAnimalToPetCard(
  raw: RawAnimalResponse | null | undefined
): PetCardAnimal {
  if (!raw) {
    throw new Error("Raw animal data is required");
  }

  return {
    id: raw.id,
    name: raw.name,
    isFemale: raw.is_female,
    breed: raw.breed,
    protection_status: raw.protection_status,
    adoption_status: raw.adoption_status,
    centerId: raw.center_id,
    animalImages: raw.animal_images
      ? raw.animal_images.map((img) => ({
          id: img.id,
          imageUrl: img.image_url,
          orderIndex: img.order_index,
        }))
      : [],
    foundLocation: raw.found_location,
    weight: raw.weight,
    color: raw.color,
    waitingDays: raw.waiting_days,
    description: raw.description,
    activityLevel: raw.activity_level?.toString() || null,
    sensitivity: raw.sensitivity?.toString() || null,
    sociability: raw.sociability?.toString() || null,
    separationAnxiety: raw.separation_anxiety?.toString() || null,
    specialNotes: raw.special_notes,
    healthNotes: raw.health_notes,
    basicTraining: raw.basic_training?.toString() || null,
    trainerComment: raw.trainer_comment,
    announceNumber: raw.announce_number,
    announcementDate: raw.announcement_date,
    admissionDate: raw.admission_date,
    updatedAt: raw.updated_at,
  };
}

// 새로운 PetCard 타입과의 호환성을 위한 변환 함수
export function transformRawAnimalToExtendedPetCard(
  raw: RawAnimalResponse | null | undefined
) {
  if (!raw) {
    throw new Error("Raw animal data is required");
  }

  // 새로운 PetCard 타입을 사용하려면 아래 import를 사용하세요:
  // import { defaultTransformRawAnimalToPetCard } from "@/types/petcard";
  // return defaultTransformRawAnimalToPetCard(raw);

  // 기존 호환성을 위해 기존 함수 사용
  return transformRawAnimalToPetCard(raw);
}

// 거리 기반 관련 동물 조회 API 응답 타입
export interface RelatedAnimalsResponse {
  id: string;
  name: string;
  is_female: boolean;
  age: number;
  weight: number;
  color: string;
  breed: string;
  description: string;
  protection_status: "보호중" | "안락사" | "자연사" | "반환";
  adoption_status: "입양가능" | "입양진행중" | "입양완료" | "입양불가";
  waiting_days: number;
  activity_level: number;
  sensitivity: number;
  sociability: number;
  separation_anxiety: number;
  special_notes: string;
  health_notes: string;
  basic_training: number;
  trainer_comment: string;
  announce_number: string;
  display_notice_number: string;
  announcement_date: string;
  notice_start_date: string;
  notice_end_date: string;
  found_location: string;
  admission_date: string;
  personality: string;
  megaphone_count: number;
  is_megaphoned: boolean;
  center_id: string;
  animal_images: Array<{
    id: string;
    image_url: string;
    order_index: number;
  }>;
  created_at: string;
  updated_at: string;
  is_public_data: boolean;
  public_notice_number: string;
  comment: string;
}
