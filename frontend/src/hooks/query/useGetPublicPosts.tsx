import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  ApiPostsResponse,
  GetPostsParams,
  PostDetailResponse,
  ApiPostResponse,
} from "@/types/posts";
import { transformRawPostToPost } from "./posts/utils";

const getPublicPosts = async (
  params?: GetPostsParams
): Promise<ApiPostsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "tags" && Array.isArray(value)) {
          value.forEach((tag) => searchParams.append("tags", tag));
        } else if (key === "animalId") {
          searchParams.append("animal_id", value.toString());
        } else if (key === "adoptionId") {
          searchParams.append("adoption_id", value.toString());
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/posts/all/?${queryString}` : `/posts/all/`;
  console.log("Public Posts API 요청:", { url, params });
  const response = await instance.get<ApiPostsResponse>(url);
  console.log("Public Posts API 응답:", response.data);
  return response.data;
};

const getPublicPostDetail = async (
  postId: string
): Promise<PostDetailResponse> => {
  // 먼저 전체공개 글에서 시도
  try {
    const response = await instance.get<{ post: ApiPostResponse }>(
      `/posts/all/${postId}`
    );

    return {
      post: transformRawPostToPost(response.data.post),
    };
  } catch (error) {
    // 전체공개에서 찾을 수 없으면 센터공개에서 시도
    console.log("전체공개에서 찾을 수 없음, 센터공개에서 시도:", error);
    const response = await instance.get<{ post: ApiPostResponse }>(
      `/posts/center/${postId}`
    );

    return {
      post: transformRawPostToPost(response.data.post),
    };
  }
};

export const useGetPublicPosts = (params?: GetPostsParams) => {
  return useQuery({
    queryKey: ["public-posts", params],
    queryFn: () => getPublicPosts(params),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
};

export const useGetPublicPostDetail = (postId: string) => {
  return useQuery({
    queryKey: ["public-posts", postId],
    queryFn: () => getPublicPostDetail(postId),
    enabled: !!postId,
    staleTime: 0, // 항상 최신 데이터 요청
    gcTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: true,
  });
};
