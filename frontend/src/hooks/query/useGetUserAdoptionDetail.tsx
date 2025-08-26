import { useQuery } from "@tanstack/react-query";
import { AdoptionData, AdoptionDetailApiResponse } from "@/types/adoption";
import instance from "@/lib/axios-instance";

interface GetUserAdoptionDetailParams {
  userId: string;
  adoptionId: string;
}

const getUserAdoptionDetail = async (
  params: GetUserAdoptionDetailParams
): Promise<AdoptionData> => {
  const { adoptionId } = params;

  const url = `/adoptions/my/${adoptionId}`;

  const response = await instance.get<AdoptionDetailApiResponse>(url);

  // API 응답을 AdoptionData 형식으로 변환
  const data = response.data;
  return {
    id: data.adoption.id,
    user_id: data.adoption.userId,
    user_name: data.adoption.userName,
    user_nickname: data.adoption.userNickname,
    animal_id: data.adoption.animalId,
    animal_name: data.adoption.animalName,
    animal_image: data.adoption.animalImage || "",
    animal_is_female: data.adoption.animalGender === "female",
    animal_status: data.adoption.status,
    animal_breed: data.adoption.animalBreed || "종 미등록",
    center_id: data.adoption.centerId,
    center_name: data.adoption.centerName,
    center_phoneNumber: data.adoption.centerPhoneNumber || "",
    center_location: data.adoption.centerLocation || "",
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
