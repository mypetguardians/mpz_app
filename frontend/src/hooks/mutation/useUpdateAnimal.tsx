import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateAnimalData {
  id: string; // required - path parameter
  name?: string | null; // 동물 이름
  is_female?: boolean | null; // 암컷 여부
  age?: number | null; // 나이 (개월 단위, 0-300개월)
  weight?: number | string | null; // 체중 (kg, 0.01-999.99kg)
  color?: string | null; // 색상
  breed?: string | null; // 품종
  description?: string | null; // 동물 설명
  protection_status?: string | null; // 보호 상태
  adoption_status?: string | null; // 입양 상태
  activity_level?: string | null; // 활동량 수준
  sensitivity?: string | null; // 예민함 정도
  sociability?: string | null; // 사회성
  separation_anxiety?: string | null; // 분리불안 정도
  // 사회성 세부 항목들
  confidence?: string | null;
  independence?: string | null;
  physical_contact?: string | null;
  handling_acceptance?: string | null;
  strangers_attitude?: string | null;
  objects_attitude?: string | null;
  environment_attitude?: string | null;
  dogs_attitude?: string | null;
  // 분리불안 세부 항목들
  coping_ability?: string | null;
  playfulness_level?: string | null;
  walkability_level?: string | null;
  grooming_acceptance_level?: string | null;
  special_notes?: string | null; // 특이사항
  health_notes?: string | null; // 건강 정보
  trainer_comment?: string | null; // 훈련사 코멘트
  announce_number?: string | null; // 공고번호
  admission_date?: string | null; // 공고일 (YYYY-MM-DD 형식)
  found_location?: string | null; // 발견 장소
  personality?: string | null; // 성격
}

interface UpdateAnimalResponse {
  id: string;
  name: string;
  is_female: boolean;
  age: number;
  weight: number | null;
  color: string | null;
  breed: string | null;
  description: string | null;
  protection_status: string;
  adoption_status: string;
  activity_level: string | null;
  sensitivity: string | null;
  sociability: string | null;
  separation_anxiety: string | null;
  special_notes: string | null;
  health_notes: string | null;
  basic_training: string | null;
  trainer_comment: string | null;
  announce_number: string | null;
  admission_date: string | null;
  found_location: string | null;
  personality: string | null;
  created_at: string;
  updated_at: string;
}

export const useUpdateAnimal = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAnimalResponse, Error, UpdateAnimalData>({
    mutationFn: async (data: UpdateAnimalData) => {
      const { id, ...updateData } = data;
      const response = await instance.put<UpdateAnimalResponse>(
        `/animals/${id}`,
        updateData
      );
      return response.data;
    },
    onSuccess: (data) => {
      // 특정 동물 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["animals", data.id] });

      // 모든 동물 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      queryClient.invalidateQueries({ queryKey: ["myCenterAnimals"] });
      queryClient.invalidateQueries({ queryKey: ["relatedAnimals"] });

      // 센터 관련 캐시도 무효화 (통계 등)
      queryClient.invalidateQueries({ queryKey: ["center"] });

      console.log("동물 정보 수정 성공 - 캐시 무효화 완료");
    },
    onError: (error) => {
      console.error("동물 정보 수정 실패:", error);
    },
  });
};
