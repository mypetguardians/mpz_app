import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

import { UserAIPersonalityTestInfo } from "@/types/ai-matching";

export function useGetUserAIPersonalityTest(userId: string) {
  return useQuery<UserAIPersonalityTestInfo>({
    queryKey: ["user-ai-personality-test", userId],
    queryFn: async () => {
      try {
        const response = await instance.get<UserAIPersonalityTestInfo>(
          `/ai/personality-test/user/${userId}`
        );
        return response.data;
      } catch (error) {
        console.error("사용자 AI 성격 테스트 결과 조회 오류:", error);
        throw error;
      }
    },
    enabled: !!userId, // userId가 있을 때만 쿼리 실행
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10분
  });
}
