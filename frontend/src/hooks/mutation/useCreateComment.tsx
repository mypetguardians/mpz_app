"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCommentResponse } from "@/types/posts";
import instance from "@/lib/axios-instance";

interface CreateCommentData {
  postId: string;
  content: string;
}

const createComment = async (
  data: CreateCommentData
): Promise<CreateCommentResponse> => {
  const response = await instance.post<CreateCommentResponse>(
    `/comments/${data.postId}/comments`,
    { content: data.content }
  );
  return response.data;
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
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
  });
};
