import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  ApiPostsResponse,
  GetPostsParams,
  PostDetailResponse,
} from "@/types/posts";
import { transformRawPostToPost, ApiPostDetailResponse } from "./posts/utils";

// 센터권한자용 게시글 목록 조회
const getCenterPosts = async (
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
  const url = queryString ? `/posts/center/?${queryString}` : `/posts/center/`;
  const response = await instance.get<ApiPostsResponse>(url);
  return response.data;
};

// 센터권한자용 게시글 상세조회
const getCenterPostDetail = async (
  postId: string
): Promise<PostDetailResponse> => {
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
};

// 센터권한자용 게시글 목록 조회 훅
export const useGetCenterPosts = (params?: GetPostsParams) => {
  return useQuery({
    queryKey: ["center-posts", params],
    queryFn: () => getCenterPosts(params),
    select: (data: ApiPostsResponse) => {
      const transformedPosts = data.data.map(transformRawPostToPost);

      return {
        data: transformedPosts,
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

// 센터권한자용 게시글 상세조회 훅
export const useGetCenterPostDetail = (postId: string) => {
  return useQuery({
    queryKey: ["center-posts", postId],
    queryFn: () => getCenterPostDetail(postId),
    enabled: !!postId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
