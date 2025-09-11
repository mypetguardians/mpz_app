// PetCard 관련 타입 정의
// 다양한 상황에서 유동적으로 사용할 수 있도록 설계

// 기본 동물 이미지 타입
export interface AnimalImage {
  id: string;
  imageUrl: string;
  orderIndex: number;
}

// 동물 상태 타입
export type AnimalStatus =
  | "보호중"
  | "입양완료"
  | "무지개다리"
  | "임시보호중"
  | "반환"
  | "방사";

// 성별 타입
export type Gender = "male" | "female";

// PetCard 변형 타입
export type PetCardVariant =
  | "primary"
  | "variant2"
  | "variant3"
  | "variant4"
  | "edit";

// 이미지 크기 타입
export type ImageSize = "sm" | "md" | "lg" | "full";

// 기본 PetCard 동물 정보 (필수 필드)
export interface BasePetCardAnimal {
  id: string;
  name: string;
  isFemale: boolean;
  status: AnimalStatus;
  centerId: string;
  animalImages: AnimalImage[];
  foundLocation: string;
}

// 확장 가능한 PetCard 동물 정보 (선택적 필드들)
export interface ExtendedPetCardAnimal extends BasePetCardAnimal {
  // 기본 정보
  breed?: string | null;
  age?: number | null;
  weight?: number | null;
  color?: string | null;

  // 설명 및 메모
  description?: string | null;
  specialNotes?: string | null;
  healthNotes?: string | null;
  trainerComment?: string | null;

  // 날짜 정보
  admissionDate?: string | null;
  announcementDate?: string | null;
  announceNumber?: string | null;
  updatedAt?: string | null;

  // 대기 정보
  waitingDays?: number | null;

  // 성격 및 행동 특성
  activityLevel?: string | null;
  sensitivity?: string | null;
  sociability?: string | null;
  separationAnxiety?: string | null;
  basicTraining?: string | null;
  personality?: string | null;

  // 기타
  megaphoneCount?: number;
  isMegaphoned?: boolean;
}

// 커뮤니티에서 사용하는 확장 타입 (입양 ID 포함)
export interface CommunityPetCardAnimal extends ExtendedPetCardAnimal {
  adoptionId?: string;
}

// Variant별로 필요한 필드 정의
export interface VariantRequirements {
  primary: Pick<
    ExtendedPetCardAnimal,
    | "id"
    | "name"
    | "isFemale"
    | "status"
    | "centerId"
    | "animalImages"
    | "foundLocation"
    | "breed"
    | "admissionDate"
    | "waitingDays"
  >;

  variant2: Pick<
    ExtendedPetCardAnimal,
    | "id"
    | "name"
    | "isFemale"
    | "status"
    | "centerId"
    | "animalImages"
    | "foundLocation"
    | "breed"
    | "description"
    | "activityLevel"
    | "sensitivity"
    | "sociability"
  >;

  variant3: Pick<
    ExtendedPetCardAnimal,
    | "id"
    | "name"
    | "isFemale"
    | "status"
    | "centerId"
    | "animalImages"
    | "foundLocation"
    | "admissionDate"
    | "waitingDays"
  >;

  variant4: Pick<
    ExtendedPetCardAnimal,
    | "id"
    | "name"
    | "isFemale"
    | "status"
    | "centerId"
    | "animalImages"
    | "foundLocation"
    | "breed"
    | "updatedAt"
  >;

  edit: Pick<
    ExtendedPetCardAnimal,
    | "id"
    | "name"
    | "isFemale"
    | "status"
    | "centerId"
    | "animalImages"
    | "foundLocation"
    | "breed"
    | "admissionDate"
    | "waitingDays"
  >;
}

// Variant별로 필요한 필드만 포함하는 타입 생성
export type PetCardAnimalByVariant<T extends PetCardVariant> =
  VariantRequirements[T];

// 모든 variant를 지원하는 유니온 타입
export type PetCardAnimalUnion =
  | PetCardAnimalByVariant<"primary">
  | PetCardAnimalByVariant<"variant2">
  | PetCardAnimalByVariant<"variant3">
  | PetCardAnimalByVariant<"variant4">
  | PetCardAnimalByVariant<"edit">;

// PetCard Props 타입 - variant에 따라 필요한 필드만 요구
export interface PetCardProps<T extends PetCardVariant = "primary"> {
  pet: PetCardAnimalByVariant<T>;
  variant?: T;
  className?: string;
  imageSize?: ImageSize;
  onAdoptionClick?: (pet: PetCardAnimalByVariant<T>) => void;
  rank?: number;
  showLocation?: boolean;
  showUpdatedAt?: boolean;
}

// PetCard 스켈레톤 Props 타입
export interface PetCardSkeletonProps {
  variant?: PetCardVariant;
  className?: string;
  imageSize?: ImageSize;
}

// 동물 정보 변환 함수를 위한 타입
export interface RawAnimalData {
  id: string;
  name: string;
  is_female: boolean;
  status: AnimalStatus;
  center_id: string;
  animal_images?: Array<{
    id: string;
    image_url: string;
    order_index: number;
  }> | null;
  found_location?: string | null;
  breed?: string | null;
  age?: number | null;
  weight?: number | null;
  color?: string | null;
  description?: string | null;
  special_notes?: string | null;
  health_notes?: string | null;
  trainer_comment?: string | null;
  admission_date?: string | null;
  announcement_date?: string | null;
  announce_number?: string | null;
  updated_at?: string | null;
  waiting_days?: number | null;
  activity_level?: number | null;
  sensitivity?: number | null;
  sociability?: number | null;
  separation_anxiety?: number | null;
  basic_training?: number | null;
  personality?: string | null;
  megaphone_count?: number;
  is_megaphoned?: boolean;
}

// RawAnimalData를 ExtendedPetCardAnimal로 변환하는 함수 타입
export type TransformFunction<T extends RawAnimalData> = (
  raw: T
) => ExtendedPetCardAnimal;

// 기본 변환 함수
export const defaultTransformRawAnimalToPetCard: TransformFunction<
  RawAnimalData
> = (raw) => ({
  id: raw.id,
  name: raw.name,
  isFemale: raw.is_female,
  status: raw.status,
  centerId: raw.center_id,
  animalImages: raw.animal_images
    ? raw.animal_images.map((img) => ({
        id: img.id,
        imageUrl: img.image_url,
        orderIndex: img.order_index,
      }))
    : [],
  foundLocation: raw.found_location || "",
  breed: raw.breed,
  age: raw.age,
  weight: raw.weight,
  color: raw.color,
  description: raw.description,
  specialNotes: raw.special_notes,
  healthNotes: raw.health_notes,
  trainerComment: raw.trainer_comment,
  admissionDate: raw.admission_date,
  announcementDate: raw.announcement_date,
  announceNumber: raw.announce_number,
  updatedAt: raw.updated_at,
  waitingDays: raw.waiting_days,
  activityLevel: raw.activity_level?.toString() || null,
  sensitivity: raw.sensitivity?.toString() || null,
  sociability: raw.sociability?.toString() || null,
  separationAnxiety: raw.separation_anxiety?.toString() || null,
  basicTraining: raw.basic_training?.toString() || null,
  personality: raw.personality,
  megaphoneCount: raw.megaphone_count,
  isMegaphoned: raw.is_megaphoned,
});

// 커뮤니티용 변환 함수 (입양 ID 포함)
export const transformRawAnimalToCommunityPetCard = (
  raw: RawAnimalData,
  adoptionId?: string
): CommunityPetCardAnimal => ({
  ...defaultTransformRawAnimalToPetCard(raw),
  adoptionId,
});

// Variant별로 필요한 필드만 추출하는 유틸리티 함수들
export const createPetCardForVariant = {
  primary: (
    data: ExtendedPetCardAnimal
  ): PetCardAnimalByVariant<"primary"> => ({
    id: data.id,
    name: data.name,
    isFemale: data.isFemale,
    status: data.status,
    centerId: data.centerId,
    animalImages: data.animalImages,
    foundLocation: data.foundLocation,
    breed: data.breed,
    admissionDate: data.admissionDate,
    waitingDays: data.waitingDays,
  }),

  variant2: (
    data: ExtendedPetCardAnimal
  ): PetCardAnimalByVariant<"variant2"> => ({
    id: data.id,
    name: data.name,
    isFemale: data.isFemale,
    status: data.status,
    centerId: data.centerId,
    animalImages: data.animalImages,
    foundLocation: data.foundLocation,
    breed: data.breed,
    description: data.description,
    activityLevel: data.activityLevel,
    sensitivity: data.sensitivity,
    sociability: data.sociability,
  }),

  variant3: (
    data: ExtendedPetCardAnimal
  ): PetCardAnimalByVariant<"variant3"> => ({
    id: data.id,
    name: data.name,
    isFemale: data.isFemale,
    status: data.status,
    centerId: data.centerId,
    animalImages: data.animalImages,
    foundLocation: data.foundLocation,
    admissionDate: data.admissionDate,
    waitingDays: data.waitingDays,
  }),

  variant4: (
    data: ExtendedPetCardAnimal
  ): PetCardAnimalByVariant<"variant4"> => ({
    id: data.id,
    name: data.name,
    isFemale: data.isFemale,
    status: data.status,
    centerId: data.centerId,
    animalImages: data.animalImages,
    foundLocation: data.foundLocation,
    breed: data.breed,
    updatedAt: data.updatedAt,
  }),

  edit: (data: ExtendedPetCardAnimal): PetCardAnimalByVariant<"edit"> => ({
    id: data.id,
    name: data.name,
    isFemale: data.isFemale,
    status: data.status,
    centerId: data.centerId,
    animalImages: data.animalImages,
    foundLocation: data.foundLocation,
    breed: data.breed,
    admissionDate: data.admissionDate,
    waitingDays: data.waitingDays,
  }),
};

// 타입 가드 함수들
export const isExtendedPetCardAnimal = (
  obj: unknown
): obj is ExtendedPetCardAnimal => {
  if (!obj || typeof obj !== "object") return false;

  const animal = obj as Record<string, unknown>;

  return (
    typeof animal.id === "string" &&
    typeof animal.name === "string" &&
    typeof animal.isFemale === "boolean" &&
    typeof animal.status === "string" &&
    typeof animal.centerId === "string" &&
    Array.isArray(animal.animalImages) &&
    typeof animal.foundLocation === "string"
  );
};

export const isCommunityPetCardAnimal = (
  obj: unknown
): obj is CommunityPetCardAnimal => {
  return isExtendedPetCardAnimal(obj) && "adoptionId" in obj;
};

// 유틸리티 타입들
export type PetCardRequiredFields = keyof BasePetCardAnimal;
export type PetCardOptionalFields = keyof Omit<
  ExtendedPetCardAnimal,
  keyof BasePetCardAnimal
>;
export type PetCardAllFields = keyof ExtendedPetCardAnimal;

// 특정 필드만 포함하는 타입 생성 유틸리티
export type PickPetCardFields<T extends PetCardAllFields> = Pick<
  ExtendedPetCardAnimal,
  T
>;
export type OmitPetCardFields<T extends PetCardAllFields> = Omit<
  ExtendedPetCardAnimal,
  T
>;

// 예시: 최소한의 정보만 필요한 경우
export type MinimalPetCardAnimal = PickPetCardFields<
  "id" | "name" | "status" | "animalImages"
>;

// 예시: 상세 정보가 필요한 경우
export type DetailedPetCardAnimal = PickPetCardFields<
  | "id"
  | "name"
  | "isFemale"
  | "status"
  | "centerId"
  | "animalImages"
  | "foundLocation"
  | "breed"
  | "description"
  | "activityLevel"
  | "sensitivity"
  | "sociability"
>;
