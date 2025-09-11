import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type {
  AdoptionApplicationRequest,
  AdoptionApplicationResponse,
  AdoptionFormData,
  UserSettingsIn,
  QuestionResponse,
} from "@/types/adoption-application";

// AdoptionFormData를 API 요청 형식으로 변환하는 함수
const transformFormDataToRequest = (
  formData: AdoptionFormData
): AdoptionApplicationRequest => {
  const userSettings: UserSettingsIn = {
    phone: formData.phone,
    phone_verification: formData.phoneVerification,
    name: formData.name,
    birth: formData.birth,
    address: formData.address,
    address_is_public: formData.addressIsPublic || false,
  };

  // Step6에서 전달된 questionResponses가 있으면 사용, 없으면 기존 방식으로 변환
  let questionResponses: QuestionResponse[] = [];

  if (formData.questionResponses && formData.questionResponses.length > 0) {
    // Step6에서 전달된 질문 응답 사용
    questionResponses = formData.questionResponses;
  } else {
    // 기존 방식으로 개별 필드들을 변환 (하위 호환성)
    if (formData.occupation) {
      questionResponses.push({
        question_id: "occupation",
        answer: formData.occupation,
        question_type: "text",
      });
    }

    if (formData.income) {
      questionResponses.push({
        question_id: "income",
        answer: formData.income,
        question_type: "text",
      });
    }

    if (formData.familyMembers) {
      questionResponses.push({
        question_id: "family_members",
        answer: formData.familyMembers,
        question_type: "text",
      });
    }

    if (formData.housingType) {
      questionResponses.push({
        question_id: "housing_type",
        answer: formData.housingType,
        question_type: "select",
      });
    }

    if (formData.hasYard !== undefined) {
      questionResponses.push({
        question_id: "has_yard",
        answer: formData.hasYard ? "yes" : "no",
        question_type: "boolean",
      });
    }

    if (formData.petExperience) {
      questionResponses.push({
        question_id: "pet_experience",
        answer: formData.petExperience,
        question_type: "text",
      });
    }

    if (formData.adoptionReason) {
      questionResponses.push({
        question_id: "adoption_reason",
        answer: formData.adoptionReason,
        question_type: "textarea",
      });
    }

    if (formData.preparedness && formData.preparedness.length > 0) {
      questionResponses.push({
        question_id: "preparedness",
        answer: formData.preparedness.join(", "),
        question_type: "multiple_select",
      });
    }

    if (formData.emergencyContact) {
      questionResponses.push({
        question_id: "emergency_contact",
        answer: JSON.stringify(formData.emergencyContact),
        question_type: "object",
      });
    }
  }

  return {
    animal_id: formData.animalId,
    user_settings: userSettings,
    question_responses: questionResponses,
    monitoring_agreement: formData.monitoringAgreement,
    guidelines_agreement: formData.guidelinesAgreement,
    is_temporary_protection: formData.isTemporaryProtection || false,
    notes: formData.notes || null,
  };
};

// 입양 신청 제출 함수
const submitAdoptionApplication = async (
  formData: AdoptionFormData
): Promise<AdoptionApplicationResponse> => {
  const requestData = transformFormDataToRequest(formData);

  const response = await instance.post<AdoptionApplicationResponse>(
    "/adoptions/apply",
    requestData
  );

  return response.data;
};

// 입양 신청 제출 훅
export const useSubmitAdoptionApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitAdoptionApplication,
    onSuccess: (data) => {
      // 성공 시 관련 쿼리들을 무효화하여 새로고침
      queryClient.invalidateQueries({
        queryKey: ["adoptions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-adoptions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["animal", data.animal_id],
      });
    },
    onError: (error) => {
      console.error("입양 신청 제출 실패:", error);
    },
  });
};

// 편의를 위한 타입 export
export type {
  AdoptionFormData,
  AdoptionApplicationRequest,
  AdoptionApplicationResponse,
};
