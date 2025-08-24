"use client";

import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CheckPostLikeResponse {
  isLiked: boolean;
  likeCount: number;
}

export const useCheckPostLike = (postId: string) => {
  return useQuery<CheckPostLikeResponse>({
    queryKey: ["post-like", postId],
    queryFn: async () => {
      const response = await instance.get<CheckPostLikeResponse>(
        `/posts/${postId}/like`
      );
      return response.data;
    },
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: (failureCount, error) => {
      // 500 에러는 재시도하지 않음
      if (error.message.includes("서버 오류")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
