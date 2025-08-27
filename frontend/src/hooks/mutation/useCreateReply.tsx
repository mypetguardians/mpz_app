"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CreateReplyData {
  commentId: string;
  content: string;
}

interface CreateReplyResponse {
  message: string;
  replyId: string;
}

const createReply = async (
  data: CreateReplyData
): Promise<CreateReplyResponse> => {
  const response = await instance.post<CreateReplyResponse>(
    `/community/${data.commentId}/replies`,
    { content: data.content }
  );
  return response.data;
};

export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReply,
    onSuccess: (data, variables) => {
      // 댓글 목록 쿼리 무효화하여 새로고침
      // commentId를 통해 어떤 게시글의 댓글인지 찾아서 무효화
      queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
  });
};
