import { createRoute, z } from "@hono/zod-openapi";

// Notice Schemas
export const NoticeResponseSchema = z
  .object({
    id: z.string(),
    centerId: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("NoticeResponse");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Notice Routes
export const getNoticesRoute = createRoute({
  method: "get",
  path: "/center-notices",
  summary: "센터 공지사항 목록 조회 (센터관리자용)",
  description: "센터 관리자가 자신의 센터에서 작성한 공지사항을 조회합니다",
  tags: ["Center Notice"],
  request: {
    query: z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    200: {
      description: "공지사항 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            notices: z.array(NoticeResponseSchema),
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
      description: "권한 없음 (센터 관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const getNoticeDetailRoute = createRoute({
  method: "get",
  path: "/center-notices/{noticeId}",
  summary: "센터 공지사항 상세 조회 (센터관리자용)",
  description:
    "센터 관리자가 자신의 센터에서 작성한 공지사항의 상세 내용을 조회합니다",
  tags: ["Center Notice"],
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
          schema: NoticeResponseSchema,
        },
      },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (센터 관리자만 접근 가능)",
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
