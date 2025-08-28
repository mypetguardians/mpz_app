import { createRoute, z } from "@hono/zod-openapi";

// 기본 스키마 정의
export const PostSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    userId: z.string(),
    animalId: z.string().nullable().optional(),
    adoptionsId: z.string().nullable().optional(),
    contentTags: z.string().nullable().optional(),
    visibility: z.enum(["public", "center"]).default("public"),
    createdAt: z.string(),
    updatedAt: z.string(),
    // 사용자 정보 추가
    userNickname: z.string(),
    userImage: z.string().nullable().optional(),
  })
  .openapi("Post");

export const PostTagSchema = z
  .object({
    id: z.string(),
    postId: z.string(),
    tagName: z.string(),
    createdAt: z.string(),
  })
  .openapi("PostTag");

export const PostLikesSchema = z
  .object({
    id: z.string(),
    postId: z.string(),
    userId: z.string(),
    createdAt: z.string(),
  })
  .openapi("PostLikes");

export const PostImageSchema = z
  .object({
    id: z.string(),
    postId: z.string(),
    imageUrl: z.string(),
    orderIndex: z.number(),
    createdAt: z.string(),
  })
  .openapi("PostImage");

export const CommentUserSchema = z
  .object({
    id: z.string(),
    nickname: z.string(),
    image: z.string(),
  })
  .openapi("CommentUser");

export const CommentSchema = z
  .object({
    id: z.string(),
    post_id: z.string(),
    user_id: z.string(),
    content: z.string(),
    like_count: z.number(),
    replies: z.array(z.lazy(() => ReplySchema)),
    created_at: z.string(),
    updated_at: z.string(),
    user: CommentUserSchema,
  })
  .openapi("Comment");

export const ReplySchema = z
  .object({
    id: z.string(),
    comment_id: z.string(),
    user_id: z.string(),
    content: z.string(),
    like_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    user: CommentUserSchema,
  })
  .openapi("Reply");

// 에러 응답 스키마
export const ErrorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("Error");

export const MessageSchema = z
  .object({
    message: z.string(),
  })
  .openapi("Message");

export const CommentWithRepliesSchema = z
  .object({
    id: z.string(),
    post_id: z.string(),
    user_id: z.string(),
    content: z.string(),
    like_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    replies: z.array(ReplySchema),
    user: CommentUserSchema,
  })
  .openapi("CommentWithReplies");

export const PostWithExtrasSchema = PostSchema.extend({
  tags: z.array(PostTagSchema),
  images: z.array(PostImageSchema),
  postLikes: z.array(PostLikesSchema),
  comments: z.array(CommentWithRepliesSchema).optional(),
}).openapi("PostWithExtras");

// 게시글 상세 조회 응답 스키마 (서버 응답 구조와 일치)
export const PostDetailResponseSchema = z
  .object({
    post: PostWithExtrasSchema,
  })
  .openapi("PostDetailResponse");

// 좋아요 관련 스키마
export const ToggleLikeRequestSchema = z
  .object({
    postId: z.string(),
  })
  .openapi("ToggleLikeRequest");

export const ToggleLikeResponseSchema = z
  .object({
    message: z.string(),
    isLiked: z.boolean(),
    likeCount: z.number(),
  })
  .openapi("ToggleLikeResponse");

export const CheckLikeResponseSchema = z
  .object({
    isLiked: z.boolean(),
    likeCount: z.number(),
  })
  .openapi("CheckLikeResponse");

// 좋아요 토글 API 라우트
export const toggleLikeRoute = createRoute({
  method: "post",
  path: "/posts/{postId}/like",
  tags: ["Posts"],
  summary: "게시글 좋아요 토글",
  description: "게시글에 좋아요를 추가하거나 취소합니다.",
  request: {
    params: z.object({
      postId: z.string().openapi({ description: "게시글 ID" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ToggleLikeResponseSchema,
        },
      },
      description: "좋아요 토글 성공",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "인증 필요",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "게시글을 찾을 수 없음",
    },
  },
});

// 좋아요 상태 확인 API 라우트
export const checkLikeRoute = createRoute({
  method: "get",
  path: "/posts/{postId}/like",
  tags: ["Posts"],
  summary: "게시글 좋아요 상태 확인",
  description: "사용자가 게시글에 좋아요를 눌렀는지 확인합니다.",
  request: {
    params: z.object({
      postId: z.string().openapi({ description: "게시글 ID" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: CheckLikeResponseSchema,
        },
      },
      description: "좋아요 상태 확인 성공",
    },
    401: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "인증 필요",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "게시글을 찾을 수 없음",
    },
  },
});

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

export const SuccessMessageSchema = z
  .object({
    message: z.string(),
  })
  .openapi("SuccessMessage");

export const CreatePostRequestSchema = z
  .object({
    title: z.string().min(1, "제목은 필수입니다"),
    content: z.string().min(1, "내용은 필수입니다"),
    images: z.array(z.string()).optional(),
    adoptionsId: z.string().nullable().optional(),
    animalId: z.string().nullable().optional(),
    contentTags: z.string().nullable().optional(),
    visibility: z.enum(["public", "center"]).optional(),
  })
  .openapi("CreatePostRequest");

// 게시글 생성
export const createPostRoute = createRoute({
  method: "post",
  path: "/community/posts",
  summary: "게시글 생성",
  description: "새로운 게시글을 생성합니다",
  tags: ["Posts"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePostRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            community: z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              userId: z.string(),
              visibility: z.enum(["public", "center"]).default("public"),
              likeCount: z.number(),
              commentCount: z.number(),
              createdAt: z.string(),
              updatedAt: z.string(),
            }),
          }),
        },
      },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 게시글 목록 조회
export const getPostListRoute = createRoute({
  method: "get",
  path: "/community/list",
  summary: "게시글 목록 조회",
  description: "게시글 목록을 조회합니다 (정렬, 태그 필터링 지원)",
  tags: ["Posts"],
  request: {
    query: z.object({
      sort: z.enum(["likes", "latest"]).optional(),
      tag: z.string().optional(),
      animalId: z.string().optional(),
      userId: z.string().optional(),
      visibility: z.enum(["public", "center"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: {
        "application/json": {
          schema: z.object({
            posts: z.array(PostWithExtrasSchema),
          }),
        },
      },
    },
  },
});

// 게시글 상세 조회
export const getPostDetailRoute = createRoute({
  method: "get",
  path: "/community/posts/{postId}",
  summary: "게시글 상세 조회",
  description: "특정 게시글의 상세 정보를 조회합니다",
  tags: ["Posts"],
  request: {
    params: z.object({
      postId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: {
        "application/json": {
          schema: z.object({
            post: PostSchema,
            tags: z.array(PostTagSchema),
            images: z.array(PostImageSchema),
          }),
        },
      },
    },
    404: {
      description: "게시글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 게시글 수정
export const updatePostRoute = createRoute({
  method: "put",
  path: "/community/posts/{postId}",
  summary: "게시글 수정",
  description: "게시글을 수정합니다",
  tags: ["Posts"],
  request: {
    params: z.object({
      postId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            title: z.string().optional(),
            content: z.string().optional(),
            images: z.array(z.string()).optional(),
            adoptionsId: z.string().nullable().optional(),
            animalId: z.string().nullable().optional(),
            contentTags: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: SuccessMessageSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "게시글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 게시글 삭제
export const deletePostRoute = createRoute({
  method: "delete",
  path: "/community/posts/{postId}",
  summary: "게시글 삭제",
  description: "게시글을 삭제합니다",
  tags: ["Posts"],
  request: {
    params: z.object({
      postId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: SuccessMessageSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "게시글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 댓글 생성
export const createCommentRoute = createRoute({
  method: "post",
  path: "/community/{postId}/comments",
  summary: "댓글 생성",
  description: "게시글에 댓글을 추가합니다",
  tags: ["Comments"],
  request: {
    params: z.object({
      postId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            content: z.string().min(1, "댓글 내용은 필수입니다"),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            commentId: z.string(),
          }),
        },
      },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "게시글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 댓글 목록 조회
export const getCommentsRoute = createRoute({
  method: "get",
  path: "/community/{postId}/comments",
  summary: "댓글 목록 조회",
  description: "게시글의 댓글과 대댓글을 조회합니다",
  tags: ["Comments"],
  request: {
    params: z.object({
      postId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: {
        "application/json": {
          schema: z.object({
            count: z.number(),
            totalCnt: z.number(),
            pageCnt: z.number(),
            curPage: z.number(),
            nextPage: z.number(),
            previousPage: z.number(),
            data: z.array(CommentSchema),
          }),
        },
      },
    },
    404: {
      description: "게시글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 댓글 수정
export const updateCommentRoute = createRoute({
  method: "put",
  path: "/community/{commentId}",
  summary: "댓글 수정",
  description: "댓글을 수정합니다",
  tags: ["Comments"],
  request: {
    params: z.object({
      commentId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            content: z.string().min(1, "댓글 내용은 필수입니다"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: SuccessMessageSchema } },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "댓글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 댓글 삭제
export const deleteCommentRoute = createRoute({
  method: "delete",
  path: "/community/{commentId}",
  summary: "댓글 삭제",
  description: "댓글을 삭제합니다",
  tags: ["Comments"],
  request: {
    params: z.object({
      commentId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: SuccessMessageSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "댓글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 대댓글 생성
export const createReplyRoute = createRoute({
  method: "post",
  path: "/{commentId}/replies",
  summary: "대댓글 생성",
  description: "댓글에 대댓글을 작성합니다",
  tags: ["Replies"],
  request: {
    params: z.object({
      commentId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            content: z.string().min(1, "대댓글 내용은 필수입니다"),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            replyId: z.string(),
          }),
        },
      },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "댓글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 대댓글 수정
export const updateReplyRoute = createRoute({
  method: "put",
  path: "/replies/{replyId}",
  summary: "대댓글 수정",
  description: "대댓글을 수정합니다",
  tags: ["Replies"],
  request: {
    params: z.object({
      replyId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            content: z.string().min(1, "대댓글 내용은 필수입니다"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: SuccessMessageSchema } },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "대댓글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 대댓글 삭제
export const deleteReplyRoute = createRoute({
  method: "delete",
  path: "/replies/{replyId}",
  summary: "대댓글 삭제",
  description: "대댓글을 삭제합니다",
  tags: ["Replies"],
  request: {
    params: z.object({
      replyId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: SuccessMessageSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "대댓글 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
