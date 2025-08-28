"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface PostLikeRequest {
  postId: string;
}

interface PostLikeResponse {
  message: string;
  isLiked: boolean;
  likeCount: number;
}

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation<PostLikeResponse, Error, PostLikeRequest>({
    mutationFn: async (data: PostLikeRequest) => {
      const response = await instance.post<PostLikeResponse>(
        `/posts/${data.postId}/like/toggle`
      );
      const { isLiked, likeCount, message } =
        response.data ?? ({} as Partial<PostLikeResponse>);
      return {
        message: message ?? "",
        isLiked: Boolean(isLiked),
        likeCount:
          typeof likeCount === "number" && Number.isFinite(likeCount)
            ? likeCount
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
