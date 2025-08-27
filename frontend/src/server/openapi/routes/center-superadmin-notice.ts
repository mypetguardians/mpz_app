import { createRoute, z } from "@hono/zod-openapi";

// Notice Schemas
export const SuperAdminNoticeResponseSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("SuperAdminNoticeResponse");

export const CreateSuperAdminNoticeRequestSchema = z
  .object({
    title: z.string().min(1, "제목은 필수입니다"),
    content: z.string().min(1, "내용은 필수입니다"),
    isActive: z.boolean().optional().default(true),
  })
  .openapi("CreateSuperAdminNoticeRequest");

export const UpdateSuperAdminNoticeRequestSchema = z
  .object({
    title: z.string().optional(),
    content: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateSuperAdminNoticeRequest");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// SuperAdmin Notice Routes
export const getSuperAdminNoticesRoute = createRoute({
  method: "get",
  path: "/center-superadmin-notice",
  summary: "최고관리자 공지사항 목록 조회 (최고관리자용)",
  description: "최고관리자가 센터관리자들을 위한 공지사항 목록을 조회합니다",
  tags: ["Center SuperAdmin Notice"],
  request: {
    query: z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      isActive: z
        .string()
        .transform((val) => val === "true")
        .optional(),
    }),
  },
  responses: {
    200: {
      description: "공지사항 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            notices: z.array(SuperAdminNoticeResponseSchema),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            totalPages: z.number(),
            hasNext: z.boolean(),
            hasPrev: z.boolean(),
          }),
        },
      },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const getSuperAdminNoticeDetailRoute = createRoute({
  method: "get",
  path: "/center-superadmin-notice/{noticeId}",
  summary: "최고관리자 공지사항 상세 조회 (최고관리자용)",
  description:
    "최고관리자가 센터관리자들을 위한 공지사항의 상세 내용을 조회합니다",
  tags: ["Center SuperAdmin Notice"],
  request: {
    params: z.object({
      noticeId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "공지사항 상세 조회 성공",
      content: {
        "application/json": {
          schema: SuperAdminNoticeResponseSchema,
        },
      },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "공지사항을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const createSuperAdminNoticeRoute = createRoute({
  method: "post",
  path: "/center-superadmin-notice",
  summary: "최고관리자 공지사항 생성",
  description: "최고관리자가 센터관리자들을 위한 공지사항을 생성합니다",
  tags: ["Center SuperAdmin Notice"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateSuperAdminNoticeRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "공지사항 생성 성공",
      content: {
        "application/json": { schema: SuperAdminNoticeResponseSchema },
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
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateSuperAdminNoticeRoute = createRoute({
  method: "put",
  path: "/center-superadmin-notice/{noticeId}",
  summary: "최고관리자 공지사항 수정",
  description: "최고관리자가 센터관리자들을 위한 공지사항을 수정합니다",
  tags: ["Center SuperAdmin Notice"],
  request: {
    params: z.object({
      noticeId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSuperAdminNoticeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "공지사항 수정 성공",
      content: {
        "application/json": { schema: SuperAdminNoticeResponseSchema },
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
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "공지사항을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const deleteSuperAdminNoticeRoute = createRoute({
  method: "delete",
  path: "/center-superadmin-notice/{noticeId}",
  summary: "최고관리자 공지사항 삭제",
  description: "최고관리자가 센터관리자들을 위한 공지사항을 삭제합니다",
  tags: ["Center SuperAdmin Notice"],
  request: {
    params: z.object({
      noticeId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "공지사항 삭제 성공",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "공지사항을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
