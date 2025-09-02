import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import instance from "@/lib/axios-instance";

interface CreateAnimalData {
  name: string; // required, 1-50 characters
  is_female: boolean; // required
  age?: number | null; // 0-300 months
  weight?: number | null; // 0.01-999.99 kg
  color?: string | null;
  breed?: string | null;
  description?: string | null;
  status?: string | null; // default: "보호중"
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
  const router = useRouter();

  return useMutation<CreateAnimalResponse, Error, CreateAnimalData>({
    mutationFn: async (data: CreateAnimalData) => {
      const response = await instance.post<CreateAnimalResponse>(
        "/animals/",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 동물 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["animals"] });

      // 성공 후 동물 목록 페이지로 이동
      router.push("/centerpage/animal");
    },
    onError: (error) => {
      console.error("동물 등록 실패:", error);
    },
  });
};
