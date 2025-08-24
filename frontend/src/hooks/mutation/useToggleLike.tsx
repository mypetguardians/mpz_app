"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface ToggleLikeRequest {
  postId: string;
}

interface ToggleLikeResponse {
  message: string;
  isLiked: boolean;
  likeCount: number;
}

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation<ToggleLikeResponse, Error, ToggleLikeRequest>({
    mutationFn: async (data: ToggleLikeRequest) => {
      const response = await instance.post<ToggleLikeResponse>(
        `/posts/${data.postId}/like`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 게시글 상세 정보 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
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
