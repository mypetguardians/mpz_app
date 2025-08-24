import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface QuestionForm {
  id: string;
  centerId: string;
  question: string;
  type: string;
  options: string[] | null;
  isRequired: boolean;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

interface GetQuestionFormsResponse {
  questions: QuestionForm[];
}

const getQuestionForms = async (): Promise<GetQuestionFormsResponse> => {
  const response = await instance.get<GetQuestionFormsResponse>(
    "/centers/procedures/questions"
  );
  return response.data;
};

export const useGetQuestionForms = () => {
  return useQuery({
    queryKey: ["questionForms"],
    queryFn: getQuestionForms,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
