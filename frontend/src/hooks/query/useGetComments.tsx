import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { CommentWithRepliesSchema } from "@/server/openapi/routes/posts";
import instance from "@/lib/axios-instance";

type Comment = z.infer<typeof CommentWithRepliesSchema>;

interface GetCommentsResponse {
  comments: Comment[];
}

const getComments = async (postId: string): Promise<GetCommentsResponse> => {
  const response = await instance.get<GetCommentsResponse>(
    `/community/${postId}/comments`
  );
  return response.data;
};

export const useGetComments = (postId: string) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
