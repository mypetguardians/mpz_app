import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  ApiPostsResponse,
  ApiPostResponse,
  Post,
  GetPostsParams,
  PostDetailResponse,
} from "@/types/posts";

// API 응답을 Post로 변환하는 함수
const transformRawPostToPost = (raw: ApiPostResponse): Post => ({
  id: raw.id,
  title: raw.title,
  content: raw.content,
  userId: raw.user_id,
  animalId: raw.animal_id,
  adoptionId: raw.adoption_id,
  contentTags: raw.content_tags,
  likeCount: raw.like_count,
  commentCount: raw.comment_count,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
  userNickname: raw.user_nickname,
  userImage: raw.user_image,
  tags: raw.tags,
  images: raw.images,
});

const getPosts = async (params?: GetPostsParams): Promise<ApiPostsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const url = `/posts?${searchParams.toString()}`;
  const response = await instance.get<ApiPostsResponse>(url);
  return response.data;
};

// 게시글 상세 조회 API 응답 타입
interface ApiPostDetailResponse {
  post: ApiPostResponse & {
    tags: Array<{
      id: string;
      postId: string;
      tagName: string;
      createdAt: string;
    }>;
    images: Array<{
      id: string;
      postId: string;
      imageUrl: string;
      orderIndex: number;
      createdAt: string;
    }>;
    postLikes: Array<{
      id: string;
      postId: string;
      userId: string;
      createdAt: string;
    }>;
  };
}

const getPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  const response = await instance.get<ApiPostDetailResponse>(`/posts/${postId}`);
  
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

// 시스템 태그 목록 조회
const getSystemTags = async (): Promise<string[]> => {
  const response = await instance.get<string[]>("/posts/tags/system");
  return response.data;
};

export const useGetPosts = (params?: GetPostsParams) => {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => getPosts(params),
    select: (data: ApiPostsResponse) => {
      const transformedPosts = data.data.map(transformRawPostToPost);

      return {
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

// 시스템 태그 목록 조회 훅
export const useGetSystemTags = () => {
  return useQuery({
    queryKey: ["system-tags"],
    queryFn: getSystemTags,
    staleTime: 10 * 60 * 1000, // 10분 (태그는 자주 변경되지 않음)
    gcTime: 30 * 60 * 1000, // 30분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
