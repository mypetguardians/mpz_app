import { useQuery } from "@tanstack/react-query";
import { AdoptionData } from "@/types/adoption";
import instance from "@/lib/axios-instance";

interface GetUserAdoptionDetailParams {
  userId: string;
  adoptionId: string;
}

// API 응답 타입 정의
interface UserAdoptionDetailResponse {
  adoption: {
    id: string;
    userId: string;
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

const getUserAdoptionDetail = async (
  params: GetUserAdoptionDetailParams
): Promise<AdoptionData> => {
  const { adoptionId } = params;

  const url = `/adoptions/my/${adoptionId}`;

  const response = await instance.get<UserAdoptionDetailResponse>(url);

  // API 응답을 AdoptionData 형식으로 변환
  const data = response.data;
  return {
    id: data.adoption.id,
    user_id: data.adoption.userId,
    user_name: "", // API에서 제공되지 않는 경우
    user_nickname: "", // API에서 제공되지 않는 경우
    animal_id: data.adoption.animalId,
    animal_name: data.adoption.animalName,
    animal_image: data.adoption.animalImage || "",
    animal_is_female: data.adoption.animalGender === "female",
    animal_status: data.adoption.status,
    center_id: data.adoption.centerId,
    center_name: data.adoption.centerName,
    status: data.adoption.status,
    notes: data.adoption.notes || "",
    center_notes: data.adoption.centerNotes || "",
    monitoring_agreement: data.adoption.monitoringAgreement,
    guidelines_agreement: data.adoption.guidelinesAgreement,
    meeting_scheduled_at: data.adoption.meetingScheduledAt || "",
    contract_sent_at: data.adoption.contractSentAt || "",
    adoption_completed_at: data.adoption.adoptionCompletedAt || "",
    monitoring_started_at: data.adoption.monitoringStartedAt || "",
    monitoring_next_check_at: data.adoption.monitoringNextCheckAt || "",
    monitoring_status: data.adoption.monitoringStatus || "",
    created_at: data.adoption.createdAt,
    updated_at: data.adoption.updatedAt,
    questionResponses: data.questionResponses,
    guidelines_content: data.contract?.guidelinesContent || "",
  };
};

export function useGetUserAdoptionDetail(params: GetUserAdoptionDetailParams) {
  const { adoptionId } = params;

  return useQuery<AdoptionData>({
    queryKey: ["user-adoption-detail", adoptionId],
    queryFn: () => getUserAdoptionDetail(params),
    enabled: !!adoptionId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
