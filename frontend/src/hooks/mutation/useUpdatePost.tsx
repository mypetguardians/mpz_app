"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdatePostData {
  title: string;
  content: string;
  images?: string[];
  contentTags?: string;
}

interface UpdatePostResponse {
  success: boolean;
  message: string;
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      data,
    }: {
      postId: string;
      data: UpdatePostData;
    }): Promise<UpdatePostResponse> => {
      const response = await instance.put<UpdatePostResponse>(
        `/posts/${postId}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 게시글 상세 정보와 목록을 새로고침
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
    onError: (error) => {
      console.error("게시글 수정 실패:", error);
    },
  });
};
