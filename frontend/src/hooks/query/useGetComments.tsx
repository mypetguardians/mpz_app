import { useQuery } from "@tanstack/react-query";
import type { GetCommentsResponse } from "@/types/posts";
import instance from "@/lib/axios-instance";

const getComments = async (postId: string): Promise<GetCommentsResponse> => {
  const response = await instance.get<GetCommentsResponse>(
    `/comments/${postId}/comments`
  );
  return response.data;
};

export const useGetComments = (
  postId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: options?.enabled !== undefined ? options.enabled : !!postId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
