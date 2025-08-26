"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { CreatePostRequest, CreatePostResponse } from "@/types/posts";

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreatePostRequest>({
    mutationFn: async (data: CreatePostRequest) => {
      const response = await instance.post<CreatePostResponse>("/posts/", data);
      return response.data;
    },
    onSuccess: () => {
      // 게시글 목록 쿼리 무효화하여 새로고침
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
    },
  });
};
