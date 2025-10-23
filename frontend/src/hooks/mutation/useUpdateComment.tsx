"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateCommentData {
  commentId: string;
  content: string;
}

interface UpdateCommentResponse {
  success: boolean;
  message: string;
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: UpdateCommentData): Promise<UpdateCommentResponse> => {
      const response = await instance.put<UpdateCommentResponse>(
        `/comments/${commentId}`,
        { content }
      );
      return response.data;
    },
    onSuccess: () => {
      // 댓글 목록 쿼리 무효화하여 새로고침
      queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
    onError: (error) => {
      console.error("댓글 수정 실패:", error);
    },
  });
};
