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
        `/posts/${postId}/like/status`
      );
      const { isLiked, likeCount } =
        response.data ?? ({} as Partial<CheckPostLikeResponse>);
      return {
        isLiked: Boolean(isLiked),
        likeCount:
          typeof likeCount === "number" && Number.isFinite(likeCount)
            ? likeCount
            : 0,
      };
    },
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error) => {
      if (error.message.includes("서버 오류")) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
