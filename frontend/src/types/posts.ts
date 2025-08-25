// 서버 응답 구조에 맞는 타입들
export interface ApiPostResponse {
  id: string;
  title: string;
  content: string;
  user_id: string;
  animal_id: string;
  adoption_id: string;
  content_tags: Record<string, unknown>;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_nickname: string;
  user_image: string;
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
}

// 페이지네이션 정보를 포함한 API 응답
export interface ApiPostsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: ApiPostResponse[];
}

// 기존 Post 타입 (클라이언트에서 사용)
export interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  animalId: string | null;
  adoptionId: string | null;
  contentTags: Record<string, unknown> | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  userNickname: string;
  userImage: string | null;
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
}

// 변환된 응답 타입
export interface GetPostsResponse {
  posts: Post[];
  pagination: {
    count: number;
    totalCnt: number;
    pageCnt: number;
    curPage: number;
    nextPage: number;
    previousPage: number;
  };
}

// 게시글 상세 조회 응답
export interface PostDetailResponse {
  post: Post;
}

// 게시글 목록 조회 파라미터
export interface GetPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  userId?: string;
  animalId?: string;
  adoptionId?: string;
}

// 게시글 생성 요청
export interface CreatePostRequest {
  title: string;
  content: string;
  tags?: string[];
  images?: string[];
  adoption_id?: string;
  animal_id?: string;
  visibility?: "public" | "center";
}

// 게시글 생성 응답
export interface CreatePostResponse {
  message: string;
  community: {
    id: string;
    title: string;
    content: string;
    user_id: string;
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
  };
}

// 게시글 수정 요청
export interface UpdatePostRequest {
  title?: string;
  content?: string;
  animalId?: string;
  adoptionId?: string;
  contentTags?: Record<string, unknown>;
  tags?: string[];
  images?: string[];
  visibility?: "public" | "center";
}

// 게시글 삭제 응답
export interface DeletePostResponse {
  message: string;
}

// 게시글 좋아요 응답
export interface PostLikeResponse {
  isLiked: boolean;
  likeCount: number;
  message: string;
}

// 댓글 관련 타입 - API 스펙에 맞춰 업데이트
export interface CommentUser {
  id: string;
  nickname: string;
  image: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  like_count: number;
  replies: Reply[];
  created_at: string;
  updated_at: string;
  user: CommentUser;
}

export interface Reply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  user: CommentUser;
}

// 댓글 목록 조회 응답
export interface GetCommentsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: Comment[];
}

// 댓글 생성 요청
export interface CreateCommentRequest {
  content: string;
}

// 댓글 생성 응답
export interface CreateCommentResponse {
  message: string;
  comment: Comment;
}

// 댓글 수정 요청
export interface UpdateCommentRequest {
  content: string;
}

// 댓글 수정 응답
export interface UpdateCommentResponse {
  message: string;
}

// 댓글 삭제 응답
export interface DeleteCommentResponse {
  message: string;
}

// 대댓글 생성 요청
export interface CreateReplyRequest {
  content: string;
}

// 대댓글 생성 응답
export interface CreateReplyResponse {
  message: string;
  reply: Reply;
}

// 대댓글 수정 요청
export interface UpdateReplyRequest {
  content: string;
}

// 대댓글 수정 응답
export interface UpdateReplyResponse {
  message: string;
}

// 대댓글 삭제 응답
export interface DeleteReplyResponse {
  message: string;
}

// 기존 타입들 (하위 호환성을 위해 유지)
export interface CommentWithReplies {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
  user?: {
    id: string;
    nickname: string;
    image: string;
  };
}
