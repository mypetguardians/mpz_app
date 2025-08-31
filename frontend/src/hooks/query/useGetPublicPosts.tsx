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
const transformRawPostToPost = (raw: ApiPostResponse): Post => {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    userId: raw.user_id,
    animalId: raw.animal_id,
    adoptionId: raw.adoption_id,
    contentTags: raw.content_tags,
    likeCount: raw.like_count,
    commentCount: raw.comment_count,
    isAllAccess: raw.is_all_access,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    userNickname: raw.user_nickname,
    userImage: raw.user_image,
    tags: raw.tags,
    images: raw.images,
  };
};

const getPublicPosts = async (
  params?: GetPostsParams
): Promise<ApiPostsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }

  const url = `/posts/all/?${searchParams.toString()}`;
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

const getPublicPostDetail = async (
  postId: string
): Promise<PostDetailResponse> => {
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
};

// 시스템 태그 목록 조회
interface SystemTag {
  id: string;
  name: string;
  description: string;
  usage_count: number;
}

const getSystemTags = async (): Promise<SystemTag[]> => {
  const response = await instance.get<SystemTag[]>("/posts/tags/system");
  return response.data;
};

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

  const url = `/posts/center/?${searchParams.toString()}`;
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

export const useGetPublicPosts = (params?: GetPostsParams) => {
  return useQuery({
    queryKey: ["posts", params],
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
    queryKey: ["posts", postId],
    queryFn: () => getPublicPostDetail(postId),
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
