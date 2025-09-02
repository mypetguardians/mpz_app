import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

import { AIPersonalityTestResult } from "@/types/ai-matching";

export function useGetAIPersonalityTest(testId: string) {
  return useQuery<AIPersonalityTestResult>({
    queryKey: ["ai-personality-test", testId],
    queryFn: async () => {
      try {
        const response = await instance.get<AIPersonalityTestResult>(
          `/ai/personality-test/${testId}`
        );
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!testId,
    retry: 1,
  });
}
