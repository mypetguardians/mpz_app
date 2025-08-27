"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface CreatePostData {
  title: string;
  content: string;
  images?: string[];
  adoptionsId?: string | null;
  animalId?: string | null;
  contentTags?: string;
  visibility?: "public" | "center";
}

interface CreatePostResponse {
  message: string;
  community: {
    id: string;
    title: string;
    content: string;
    userId: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePostResponse, Error, CreatePostData>({
    mutationFn: async (data: CreatePostData) => {
      const response = await instance.post<CreatePostResponse>(
        "/community/posts",
        data
      );
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
