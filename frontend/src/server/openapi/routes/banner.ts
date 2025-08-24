import { createRoute, z } from "@hono/zod-openapi";

// 배너 생성/수정 요청 스키마
const BannerRequestSchema = z.object({
  type: z.enum(["main", "sub"]),
  title: z.string().optional(),
  description: z.string().optional(),
  alt: z.string().min(1, "alt 텍스트는 필수입니다"),
  linkUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// 배너 응답 스키마
const BannerResponseSchema = z.object({
  id: z.string(),
  type: z.enum(["main", "sub"]),
  title: z.string().nullable(),
  description: z.string().nullable(),
  alt: z.string(),
  imageUrl: z.string(),
  orderIndex: z.number(),
  isActive: z.boolean(),
  linkUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 배너 목록 응답 스키마
const BannerListResponseSchema = z.object({
  banners: z.array(BannerResponseSchema),
  total: z.number(),
});

// 배너 이미지 업로드 응답 스키마
const BannerImageUploadResponseSchema = z.object({
  imageUrl: z.string(),
  message: z.string(),
});

// 배너 목록 조회 라우트
export const getBannersRoute = createRoute({
  method: "get",
  path: "/banner",
  summary: "배너 목록 조회",
  description: "메인 또는 서브 배너 목록을 조회합니다",
  tags: ["Banner"],
  request: {
    query: z.object({
      type: z.enum(["main", "sub"]).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BannerListResponseSchema,
        },
      },
      description: "배너 목록이 성공적으로 조회되었습니다",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "서버 오류",
    },
  },
});

// 배너 생성 라우트
export const createBannerRoute = createRoute({
  method: "post",
  path: "/banner",
  summary: "배너 생성",
  description: "새로운 배너를 생성합니다 (최고관리자만 가능)",
  tags: ["Banner"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: BannerRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: BannerResponseSchema,
        },
      },
      description: "배너가 성공적으로 생성되었습니다",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "인증 필요",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "권한 없음 (최고관리자만 가능)",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "서버 오류",
    },
  },
});

// 배너 수정 라우트
export const updateBannerRoute = createRoute({
  method: "put",
  path: "/banner/{id}",
  summary: "배너 수정",
  description: "기존 배너를 수정합니다 (최고관리자만 가능)",
  tags: ["Banner"],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: BannerRequestSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BannerResponseSchema,
        },
      },
      description: "배너가 성공적으로 수정되었습니다",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "인증 필요",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "권한 없음 (최고관리자만 가능)",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "배너를 찾을 수 없습니다",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "서버 오류",
    },
  },
});

// 배너 삭제 라우트
export const deleteBannerRoute = createRoute({
  method: "delete",
  path: "/banner/{id}",
  summary: "배너 삭제",
  description: "배너를 삭제합니다 (최고관리자만 가능)",
  tags: ["Banner"],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: "배너가 성공적으로 삭제되었습니다",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "인증 필요",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "권한 없음 (최고관리자만 가능)",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "배너를 찾을 수 없습니다",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "서버 오류",
    },
  },
});

// 배너 이미지 업로드 라우트
export const uploadBannerImageRoute = createRoute({
  method: "post",
  path: "/banner/image",
  summary: "배너 이미지 업로드",
  description: "배너 이미지를 R2에 업로드합니다 (최고관리자만 가능)",
  tags: ["Banner"],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            image: z.any(), // 파일 업로드
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: BannerImageUploadResponseSchema,
        },
      },
      description: "이미지가 성공적으로 업로드되었습니다",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "잘못된 요청 (이미지 파일 필요)",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "인증 필요",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "권한 없음 (최고관리자만 가능)",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "서버 오류",
    },
  },
});
