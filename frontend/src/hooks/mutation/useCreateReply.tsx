"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateReplyResponse } from "@/types/posts";
import instance from "@/lib/axios-instance";

interface CreateReplyData {
  commentId: string;
  content: string;
}

const createReply = async (
  data: CreateReplyData
): Promise<CreateReplyResponse> => {
  const response = await instance.post<CreateReplyResponse>(
    `/comments/${data.commentId}/replies`,
    { content: data.content }
  );
  return response.data;
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReply,
    onSuccess: () => {
      // 댓글 목록 쿼리 무효화하여 새로고침
      queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
  });
};
