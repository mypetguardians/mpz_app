import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface RawPresetQuestion {
  id: string;
  category: "lifeEnvironment" | "experience" | "responsibility";
  question: string;
  sequence: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PresetQuestion {
  id: string;
  category: "lifeEnvironment" | "experience" | "responsibility";
  question: string;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GetPresetQuestionsResponse {
  questions: RawPresetQuestion[];
}

const transformPresetQuestion = (raw: RawPresetQuestion): PresetQuestion => {
  return {
    id: raw.id,
    category: raw.category,
    question: raw.question,
    sequence: raw.sequence,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
};

const getPresetQuestions = async (): Promise<{
  questions: PresetQuestion[];
}> => {
  const response = await instance.get<GetPresetQuestionsResponse>(
    "/preset-questions"
  );
  return {
    questions: response.data.questions.map(transformPresetQuestion),
  };
};

export const useGetPresetQuestions = () => {
  return useQuery({
    queryKey: ["presetQuestions"],
    queryFn: getPresetQuestions,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
