// 입양 신청 데이터 타입
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
  // 질문 응답 정보 추가
  questionResponses?: Array<{
    id: string;
    questionId: string;
    questionContent: string;
    answer: string;
    createdAt: string;
  }>;
  // 동의서 내용 추가
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
