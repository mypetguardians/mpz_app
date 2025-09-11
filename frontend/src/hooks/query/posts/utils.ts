import { ApiPostResponse, Post } from "@/types/posts";

// API 응답을 Post로 변환하는 함수
export const transformRawPostToPost = (raw: ApiPostResponse): Post => {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    user_id: raw.user_id,
    animal_id: raw.animal_id,
    content_tags: raw.content_tags,
    like_count: raw.like_count,
    is_liked: raw.is_liked,
    comment_count: raw.comment_count,
    is_all_access: raw.is_all_access,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    user_nickname: raw.user_nickname,
    user_image: raw.user_image,
    tags: raw.tags.map((tag) => ({
      id: tag.id,
      tag_name: tag.tag_name,
      created_at: tag.created_at,
    })),
    images: raw.images.map((img) => ({
      id: img.id,
      image_url: img.image_url,
      order_index: img.order_index,
      created_at: img.created_at,
    })),
  };
};

// 게시글 상세 조회 API 응답 타입
export interface ApiPostDetailResponse {
  post: ApiPostResponse & {
    tags: Array<{
      id: string;
      post_id: string;
      tagName: string;
      createdAt: string;
    }>;
    images: Array<{
      id: string;
      postId: string;
      image_url: string;
      order_index: number;
      created_at: string;
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
