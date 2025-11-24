import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  ApiPostsResponse,
  GetPostsParams,
  PostDetailResponse,
} from "@/types/posts";
import { transformRawPostToPost, ApiPostDetailResponse } from "./posts/utils";

const getCenterPosts = async (
  params?: GetPostsParams
): Promise<ApiPostsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "tags" && Array.isArray(value)) {
          value.forEach((tag) => searchParams.append("tags", tag));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/posts/center/?${queryString}` : `/posts/center/`;

  const response = await instance.get<ApiPostsResponse>(url);
  return response.data;
};

const getCenterPostDetail = async (
  postId: string
): Promise<PostDetailResponse> => {
  const response = await instance.get<ApiPostDetailResponse>(
    `/posts/center/${postId}`
  );

  return {
    post: transformRawPostToPost(response.data.post),
  };
};

interface UseGetCenterPostsOptions {
  enabled?: boolean;
}

export const useGetCenterPosts = (
  params?: GetPostsParams,
  options?: UseGetCenterPostsOptions
) => {
  return useQuery({
    queryKey: ["center-posts", params],
    queryFn: () => getCenterPosts(params),
    select: (data: ApiPostsResponse) => {
      const transformedPosts = data.data.map(transformRawPostToPost);

      return {
        data: transformedPosts,
        posts: transformedPosts,
        pagination: {
          count: data.count,
          totalCnt: data.totalCnt,
          pageCnt: data.pageCnt,
          curPage: data.curPage,
          nextPage: data.nextPage,
          previousPage: data.previousPage,
        },
      };
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 30 * 60 * 1000, // 30분
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });
};

interface UseGetCenterPostDetailOptions {
  enabled?: boolean;
}

export const useGetCenterPostDetail = (
  postId: string,
  options?: UseGetCenterPostDetailOptions
) => {
  return useQuery({
    queryKey: ["center-posts", postId],
    queryFn: () => getCenterPostDetail(postId),
    enabled:
      options?.enabled !== undefined ? options.enabled && !!postId : !!postId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 30 * 60 * 1000, // 30분
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
};
