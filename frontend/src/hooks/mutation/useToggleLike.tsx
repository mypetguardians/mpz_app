"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface PostLikeRequest {
  postId: string;
}

interface PostLikeResponse {
  message: string;
  is_liked: boolean;
  total_likes: number;
}

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation<PostLikeResponse, Error, PostLikeRequest>({
    mutationFn: async (data: PostLikeRequest) => {
      const response = await instance.post<PostLikeResponse>(
        `/posts/${data.postId}/like/toggle`
      );
      const { is_liked, total_likes, message } =
        response.data ?? ({} as Partial<PostLikeResponse>);
      return {
        message: message ?? "",
        is_liked: Boolean(is_liked),
        total_likes:
          typeof total_likes === "number" && Number.isFinite(total_likes)
            ? total_likes
            : 0,
      };
    },
    onSuccess: (data, variables) => {
      // 게시글 상세 정보 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts", variables.postId],
      });
      // 게시글 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
      // 좋아요 상태 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["post-like", variables.postId],
      });
    },
  });
};
