"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type {
  AIRecommendRequest,
  AIRecommendResponse,
} from "@/types/ai-matching";

interface UsePostAnimalMatchingOptions {
  onSuccess?: (data: AIRecommendResponse) => void;
  onError?: (error: Error) => void;
}

export const usePostAnimalMatching = (
  options?: UsePostAnimalMatchingOptions
) => {
  const queryClient = useQueryClient();

  return useMutation<AIRecommendResponse, Error, AIRecommendRequest>({
    mutationFn: async (data: AIRecommendRequest) => {
      const response = await instance.post<AIRecommendResponse>(
        "/ai/personality-test",
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["ai-recommendations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-matching-results"],
      });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      if (options?.onError) {
        options.onError(error);
      }
    },
  });
};
