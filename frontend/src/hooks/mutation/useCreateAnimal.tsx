import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CreateAnimalData {
  name: string; // required, 1-50 characters
  is_female: boolean; // required
  age?: number | null; // 0-300 months
  weight?: number | null; // 0.01-999.99 kg
  color?: string | null;
  breed?: string | null;
  description?: string | null;
  protection_status?: "보호중" | "안락사" | "자연사" | "반환" | null; // default: "보호중"
  adoption_status?: "입양가능" | "입양진행중" | "입양완료" | "입양불가" | null; // default: "입양가능"
  activity_level?: string | null;
  sensitivity?: string | null;
  sociability?: string | null;
  separation_anxiety?: string | null;
  special_notes?: string | null;
  health_notes?: string | null;
  basic_training?: string | null;
  trainer_comment?: string | null;
  announce_number?: string | null;
  announcement_date?: string | null;
  found_location?: string | null;
  personality?: string | null;
  comment?: string | null; // 공공데이터 특이사항 코멘트
}

interface CreateAnimalResponse {
  id: string;
  name: string;
  is_female: boolean;
  age: number | null;
  weight: number | null;
  color: string | null;
  breed: string | null;
  description: string | null;
  status: string;
  activity_level: string | null;
  sensitivity: string | null;
  sociability: string | null;
  separation_anxiety: string | null;
  special_notes: string | null;
  health_notes: string | null;
  basic_training: string | null;
  trainer_comment: string | null;
  announce_number: string | null;
  announcement_date: string | null;
  found_location: string | null;
  personality: string | null;
  comment: string | null;
  center_id: string;
  created_at: string;
  updated_at: string;
}

export const useCreateAnimal = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateAnimalResponse, Error, CreateAnimalData>({
    mutationFn: async (data: CreateAnimalData) => {
      const response = await instance.post<CreateAnimalResponse>(
        "/animals/",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 모든 동물 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["animals"] });
      queryClient.invalidateQueries({ queryKey: ["myCenterAnimals"] });
      queryClient.invalidateQueries({ queryKey: ["relatedAnimals"] });

      // 센터 관련 캐시도 무효화 (통계 등)
      queryClient.invalidateQueries({ queryKey: ["center"] });

      console.log("동물 등록 성공 - 캐시 무효화 완료");
    },
    onError: (error) => {
      console.error("동물 등록 실패:", error);
    },
  });
};
