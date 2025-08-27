import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { PostWithExtrasSchema } from "@/server/openapi/routes/posts";
import instance from "@/lib/axios-instance";

type Post = z.infer<typeof PostWithExtrasSchema>;
type PostDetail = z.infer<typeof PostWithExtrasSchema>;

interface GetPostsParams {
  sort?: "likes" | "latest";
  tag?: string;
  animalId?: string;
  userId?: string;
  visibility?: "public" | "center";
  page?: number;
  limit?: number;
}

interface GetPostsResponse {
  posts: Post[];
}

interface GetPostDetailResponse {
  post: PostDetail;
}

const getPosts = async (params?: GetPostsParams): Promise<GetPostsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const url = `/posts?${searchParams.toString()}`;
  const response = await instance.get<GetPostsResponse>(url);
  return response.data;
};

const getPostDetail = async (
  postId: string
): Promise<GetPostDetailResponse> => {
  const response = await instance.get<GetPostDetailResponse>(
    `/posts/${postId}`
  );
  return response.data;
};

export const useGetPosts = (params?: GetPostsParams) => {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => getPosts(params),
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useGetPostDetail = (postId: string) => {
  return useQuery({
    queryKey: ["posts", postId],
    queryFn: () => getPostDetail(postId),
    enabled: !!postId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
