import { ApiPostResponse, Post } from "@/types/posts";

// API 응답을 Post로 변환하는 함수
export const transformRawPostToPost = (raw: ApiPostResponse): Post => {
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

// 게시글 상세 조회 API 응답 타입
export interface ApiPostDetailResponse {
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

// 시스템 태그 타입
export interface SystemTag {
  id: string;
  name: string;
  description: string;
  usage_count: number;
}
