"use client";

import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CheckPostLikeResponse {
  is_liked: boolean;
  total_likes: number;
}

export const useCheckPostLike = (postId: string, enabled: boolean = true) => {
  return useQuery<CheckPostLikeResponse>({
    queryKey: ["post-like", postId],
    queryFn: async () => {
      const response = await instance.get<CheckPostLikeResponse>(
        `/posts/${postId}/like/status`
      );
      const { is_liked, total_likes } =
        response.data ?? ({} as Partial<CheckPostLikeResponse>);
      return {
        is_liked: Boolean(is_liked),
        total_likes:
          typeof total_likes === "number" && Number.isFinite(total_likes)
            ? total_likes
            : 0,
      };
    },
    enabled: !!postId && enabled,
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
