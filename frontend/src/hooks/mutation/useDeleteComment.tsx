"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface DeleteCommentResponse {
  success: boolean;
  message: string;
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      commentId,
    }: {
      postId: string;
      commentId: string;
    }): Promise<DeleteCommentResponse> => {
      const response = await instance.delete<DeleteCommentResponse>(
        `/comments/${commentId}`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 댓글 목록 쿼리 무효화하여 새로고침
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
      // 게시글 상세 정보도 무효화 (댓글 수 업데이트를 위해)
      queryClient.invalidateQueries({
        queryKey: ["posts", variables.postId],
      });
    },
    onError: (error) => {
      console.error("댓글 삭제 실패:", error);
    },
  });
};
