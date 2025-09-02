import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  ApiPostsResponse,
  GetPostsParams,
  PostDetailResponse,
} from "@/types/posts";
import { transformRawPostToPost, ApiPostDetailResponse } from "./posts/utils";

const getPublicPosts = async (
  params?: GetPostsParams
): Promise<ApiPostsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "tags" && Array.isArray(value)) {
          // tags 배열을 개별 파라미터로 변환
          value.forEach((tag) => searchParams.append("tags", tag));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/posts/all/?${queryString}` : `/posts/all/`;
  const response = await instance.get<ApiPostsResponse>(url);
  return response.data;
};

const getPublicPostDetail = async (
  postId: string
): Promise<PostDetailResponse> => {
  // 먼저 전체공개 글에서 시도
  try {
    const response = await instance.get<ApiPostDetailResponse>(
      `/posts/all/${postId}`
    );

    // API 응답을 Post 타입으로 변환
    const transformedPost = transformRawPostToPost(response.data.post);

    return {
      post: {
        ...transformedPost,
        tags: response.data.post.tags,
        images: response.data.post.images,
        postLikes: response.data.post.postLikes,
      },
    };
  } catch (error) {
    // 전체공개에서 찾을 수 없으면 센터공개에서 시도
    console.log("전체공개에서 찾을 수 없음, 센터공개에서 시도:", error);
    const response = await instance.get<ApiPostDetailResponse>(
      `/posts/center/${postId}`
    );

    // API 응답을 Post 타입으로 변환
    const transformedPost = transformRawPostToPost(response.data.post);

    return {
      post: {
        ...transformedPost,
        tags: response.data.post.tags,
        images: response.data.post.images,
        postLikes: response.data.post.postLikes,
      },
    };
  }
};

export const useGetPublicPosts = (params?: GetPostsParams) => {
  return useQuery({
    queryKey: ["public-posts", params],
    queryFn: () => getPublicPosts(params),
    select: (data: ApiPostsResponse) => {
      const transformedPosts = data.data.map(transformRawPostToPost);

      return {
        data: transformedPosts, // API 응답 구조와 일치하도록 data로 변경
        posts: transformedPosts, // 기존 호환성을 위해 posts도 유지
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
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useGetPublicPostDetail = (postId: string) => {
  return useQuery({
    queryKey: ["public-posts", postId],
    queryFn: () => getPublicPostDetail(postId),
    enabled: !!postId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
