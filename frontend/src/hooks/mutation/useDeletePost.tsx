"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface DeletePostResponse {
  success: boolean;
  message: string;
}

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<DeletePostResponse> => {
      const response = await instance.delete<DeletePostResponse>(
        `/community/posts/${postId}`
      );
      return response.data;
    },
    onSuccess: (data, postId) => {
      // 게시글 상세 정보와 목록을 새로고침
      queryClient.invalidateQueries({
        queryKey: ["post", postId],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
    onError: (error) => {
      console.error("게시글 삭제 실패:", error);
    },
  });
};
