// 백엔드 API 응답 구조에 맞춘 타입 정의

// 사용자 입양 신청 목록 조회 응답 타입 (GET /v1/adoptions/my)
export interface UserAdoptionOut {
  id: string;
  user_id: string;
  user_name: string;
  user_nickname: string;
  user_phoneNumber: string;
  animal_id: string;
  animal_name: string;
  animal_image: string;
  animal_breed: string;
  animal_is_female: boolean;
  animal_status: string;
  center_id: string;
  center_name: string;
  center_location: string;
  center_centerNumber: string;
  status: string;
  notes: string;
  center_notes: string;
  monitoring_agreement: boolean;
  guidelines_agreement: boolean;
  meeting_scheduled_at: string;
  contract_sent_at: string;
  adoption_completed_at: string;
  monitoring_started_at: string;
  monitoring_next_check_at: string;
  monitoring_status: string;
  created_at: string;
  updated_at: string;
}

// 사용자 입양 신청 상세 조회 응답 타입 (GET /adoptions/my/{adoption_id})
export interface UserAdoptionDetailOut {
  id: string;
  user_id: string;
  animal_id: string;
  animal_name: string;
  animal_image: string | null;
  animal_breed: string | null;
  animal_age: number | null;
  animal_gender: string | null;
  found_location: string | null;
  center_id: string;
  center_name: string;
  center_location: string | null;
  status: "신청" | "미팅" | "계약서작성" | "입양완료" | "모니터링" | "취소";
  notes: string | null;
  center_notes: string | null;
  monitoring_agreement: boolean;
  guidelines_agreement: boolean;
  meeting_scheduled_at: string | null;
  contract_sent_at: string | null;
  adoption_completed_at: string | null;
  monitoring_started_at: string | null;
  monitoring_next_check_at: string | null;
  monitoring_end_date: string | null;
  monitoring_status: string | null;
  monitoring_completed_checks: number;
  monitoring_total_checks: number;
  created_at: string;
  updated_at: string;
}

// 질문 응답 타입
export interface QuestionResponseOut {
  id: string;
  question_id: string;
  question_content: string;
  answer: string;
  created_at: string;
}

// 계약서 타입
export interface ContractOut {
  id: string;
  template_id: string;
  contract_content: string;
  guidelines_content: string | null;
  user_signature_url: string | null;
  user_signed_at: string | null;
  center_signature_url: string | null;
  center_signed_at: string | null;
  status: "대기중" | "사용자서명완료" | "센터서명완료" | "계약완료";
  created_at: string;
  updated_at: string;
}

// 모니터링 포스트 타입
export interface MonitoringPostOut {
  id: string;
  post_id: string;
  post_title: string | null;
  post_content: string | null;
  created_at: string;
}

// 사용자 입양 신청 상세 조회 전체 응답 타입
export interface UserAdoptionDetailResponse {
  adoption: UserAdoptionDetailOut;
  question_responses: QuestionResponseOut[];
  contract: ContractOut | null;
  monitoring_posts: MonitoringPostOut[];
}

// 사용자 입양 신청 필터 타입 (GET /adoptions/my 쿼리 파라미터)
export interface UserAdoptionFilterIn {
  status?: string;
  is_temporary_protection?: boolean;
}

// 기존 타입들 (하위 호환성을 위해 유지)
export interface AdoptionData {
  id: string;
  user_id: string;
  user_name: string;
  user_nickname: string;
  animal_id: string;
  animal_name: string;
  animal_image: string;
  animal_is_female: boolean;
  animal_breed: string;
  animal_status: string;
  center_id: string;
  center_name: string;
  center_phoneNumber: string;
  center_location: string;
  status: string;
  notes: string;
  center_notes: string;
  monitoring_agreement: boolean;
  guidelines_agreement: boolean;
  meeting_scheduled_at: string;
  contract_sent_at: string;
  adoption_completed_at: string;
  monitoring_started_at: string;
  monitoring_next_check_at: string;
  monitoring_status: string;
  created_at: string;
  updated_at: string;
  questionResponses?: Array<{
    id: string;
    questionId: string;
    questionContent: string;
    answer: string;
    createdAt: string;
  }>;
  guidelines_content?: string;
}

// 단건 입양 상세 API 응답 타입
export interface AdoptionDetailApiResponse {
  adoption: {
    id: string;
    userId: string;
    userName: string;
    userNickname: string;
    animalId: string;
    animalName: string;
    animalImage: string | null;
    animalBreed: string | null;
    animalAge: number | null;
    animalGender: string | null;
    foundLocation: string | null;
    centerId: string;
    centerName: string;
    centerLocation: string | null;
    centerPhoneNumber: string | null;
    status: string;
    notes: string | null;
    centerNotes: string | null;
    monitoringAgreement: boolean;
    guidelinesAgreement: boolean;
    meetingScheduledAt: string | null;
    contractSentAt: string | null;
    adoptionCompletedAt: string | null;
    monitoringStartedAt: string | null;
    monitoringNextCheckAt: string | null;
    monitoringStatus: string | null;
    createdAt: string;
    updatedAt: string;
  };
  questionResponses: Array<{
    id: string;
    questionId: string;
    questionContent: string;
    answer: string;
    createdAt: string;
  }>;
  contract?: {
    id: string;
    templateId: string;
    contractContent: string;
    guidelinesContent: string | null;
    userSignatureUrl: string | null;
    userSignedAt: string | null;
    centerSignatureUrl: string | null;
    centerSignedAt: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

// 사용자 입양 목록 응답 타입
export interface UserAdoptionsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: AdoptionData[];
}

// 입양 상태 타입
export type AdoptionStatus =
  | "신청"
  | "미팅"
  | "계약서작성"
  | "입양완료"
  | "모니터링"
  | "취소";

// 동물 상태 타입
export type AnimalStatus =
  | "보호중"
  | "입양완료"
  | "무지개다리"
  | "임시보호중"
  | "반환"
  | "방사"
  | "자연사";

// 계약서 전송 요청 타입
export interface SendContractRequest {
  templateId: string;
  customContent?: string;
  centerNotes?: string;
}
