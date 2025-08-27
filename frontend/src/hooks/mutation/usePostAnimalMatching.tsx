"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type {
  AIRecommendRequest,
  AIRecommendResponse,
} from "@/types/ai-matching";

export const usePostAnimalMatching = () => {
  const queryClient = useQueryClient();

  return useMutation<AIRecommendResponse, Error, AIRecommendRequest>({
    mutationFn: async (data: AIRecommendRequest) => {
      const response = await instance.post<AIRecommendResponse>(
        "/ai/recommend",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // AI 매칭 결과 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["ai-recommendations"],
      });
      // 사용자 매칭 결과 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["user-matching-results"],
      });
    },
  });
};
