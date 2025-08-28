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
  status: "보호중" | "입양완료" | "무지개다리" | "임시보호중" | "반환" | "방사";
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

// API 요청 파라미터 타입
export interface GetAnimalsParams {
  status?:
    | "보호중"
    | "입양완료"
    | "무지개다리"
    | "임시보호중"
    | "반환"
    | "방사";
  centerId?: string;
  region?:
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
  weight?: "10kg_under" | "25kg_under" | "over_25kg";
  age?: "2_under" | "7_under" | "over_7";
  gender?: "male" | "female";
  hasTrainerComment?: "true" | "false";
  breed?: string;
  page?: number;
  limit?: number;
  sortBy?: "admission_date" | "waiting_days" | "created_at";
  sortOrder?: "asc" | "desc";
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
  status: "보호중" | "입양완료" | "무지개다리" | "임시보호중" | "반환" | "방사";
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

// 실제 API 응답 구조
export interface ActualGetAnimalsResponse {
  animals: RawAnimalResponse[];
  data?: RawAnimalResponse[]; // 실제 API 응답에서 사용되는 필드
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  // 실제 API 응답에 맞는 추가 필드들
  count?: number;
  totalCnt?: number;
  pageCnt?: number;
  curPage?: number;
  nextPage?: number;
  previousPage?: number | null;
}

// PetCard에서 사용하는 타입
export type PetCardAnimal = Pick<
  Animal,
  | "id"
  | "name"
  | "breed"
  | "isFemale"
  | "status"
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
    status: raw.status,
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

// RawAnimalResponse를 PetCardAnimal으로 변환하는 함수
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
    status: raw.status,
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
