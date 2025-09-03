// 입양 신청 관련 타입 정의

export interface UserSettingsIn {
  phone: string;
  phone_verification: boolean;
  name: string;
  birth: string;
  address: string;
  address_is_public?: boolean;
}

export interface QuestionResponse {
  question_id: string;
  answer: string;
  question_type?: string;
}

export interface AdoptionApplicationRequest {
  animal_id: string;
  user_settings: UserSettingsIn | null;
  question_responses?: QuestionResponse[];
  monitoring_agreement: boolean;
  guidelines_agreement: boolean;
  is_temporary_protection?: boolean;
  notes?: string | null;
}

export interface AdoptionApplicationResponse {
  id: string;
  animal_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  application_date: string;
  is_temporary_protection: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Store와 연동하기 위한 변환 함수용 타입
export interface AdoptionFormData {
  // 기본 사용자 정보
  phone: string;
  phoneVerification: boolean;
  name: string;
  birth: string;
  address: string;
  addressIsPublic?: boolean;

  // 추가 질문 응답
  occupation?: string;
  income?: string;
  familyMembers?: string;
  housingType?: string;
  hasYard?: boolean;
  petExperience?: string;
  adoptionReason?: string;
  preparedness?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };

  // 동의 사항
  monitoringAgreement: boolean;
  guidelinesAgreement: boolean;
  isTemporaryProtection?: boolean;
  notes?: string;

  // 메타 정보
  animalId: string;
}
