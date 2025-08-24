import { createRoute, z } from "@hono/zod-openapi";

// 사용자 매칭 응답 존재 여부 확인 응답 스키마
export const UserMatchingResponseCheckSchema = z
  .object({
    hasMatchingResponse: z.boolean().openapi({
      description: "사용자가 매칭 질문에 응답했는지 여부",
      example: true,
    }),
    lastResponseDate: z.string().optional().openapi({
      description: "마지막 응답 날짜 (ISO 문자열)",
      example: "2024-01-08T07:47:00.000Z",
    }),
  })
  .openapi("UserMatchingResponseCheck");

// 사용자 매칭 응답 존재 여부 확인 라우트
export const checkUserMatchingResponseRoute = createRoute({
  method: "get",
  path: "/matching/check-response",
  summary: "사용자 매칭 응답 존재 여부 확인",
  description: "현재 로그인한 사용자가 매칭 질문에 응답했는지 확인합니다",
  tags: ["Matching"],
  responses: {
    200: {
      description: "성공",
      content: {
        "application/json": {
          schema: UserMatchingResponseCheckSchema,
        },
      },
    },
    401: {
      description: "인증 필요",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});
