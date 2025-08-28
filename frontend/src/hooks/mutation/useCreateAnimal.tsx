import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import instance from "@/lib/axios-instance";

interface CreateAnimalData {
  name: string;
  is_female: boolean;
  age: number;
  weight: number;
  color: string;
  breed: string;
  description?: string;
  status?:
    | "보호중"
    | "입양완료"
    | "무지개다리"
    | "임시보호중"
    | "반환"
    | "방사";
  activity_level?: number;
  sensitivity?: number;
  sociability?: number;
  separation_anxiety?: number;
  special_notes?: string;
  health_notes?: string;
  basic_training?: string;
  trainer_comment?: string;
  announce_number?: string;
  announcement_date?: string;
  found_location?: string;
  personality?: string;
}

interface CreateAnimalResponse {
  id: string;
  name: string;
  isFemale: boolean;
  age: number;
  weight: number | null;
  color: string | null;
  breed: string | null;
  description: string | null;
  status: string;
  waitingDays: number | null;
  activityLevel: number | null;
  sensitivity: number | null;
  sociability: number | null;
  separationAnxiety: number | null;
  specialNotes: string | null;
  healthNotes: string | null;
  basicTraining: string | null;
  trainerComment: string | null;
  announceNumber: string | null;
  announcementDate: string | null;
  foundLocation: string | null;
  personality: string | null;
  centerId: string;
  createdAt: string;
  updatedAt: string;
}

export const useCreateAnimal = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<CreateAnimalResponse, Error, CreateAnimalData>({
    mutationFn: async (data: CreateAnimalData) => {
      const response = await instance.post<CreateAnimalResponse>(
        "/animals",
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
