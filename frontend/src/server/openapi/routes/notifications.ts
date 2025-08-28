import { createRoute, z } from "@hono/zod-openapi";

// 알림 스키마
export const NotificationSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    content: z.string(),
    type: z.enum(["입양", "임시보호", "모니터링", "커뮤니티"]),
    isRead: z.boolean(),
    createdAt: z.string(),
  })
  .openapi("Notification");

// 알림 목록 조회 라우트
export const getNotificationsRoute = createRoute({
  method: "get",
  path: "/notifications",
  summary: "사용자 알림 목록 조회",
  description: "현재 로그인한 사용자의 알림 목록을 조회합니다",
  tags: ["Notifications"],
  responses: {
    200: {
      description: "알림 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            notifications: z.array(NotificationSchema),
          }),
        },
      },
    },
    401: {
      description: "인증되지 않은 사용자",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "서버 내부 오류",
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

// 알림 읽음 처리 라우트
export const markNotificationAsReadRoute = createRoute({
  method: "patch",
  path: "/notifications/{id}/read",
  summary: "알림 읽음 처리",
  description: "특정 알림을 읽음 상태로 표시합니다",
  tags: ["Notifications"],
  request: {
    params: z.object({
      id: z.string().describe("알림 ID"),
    }),
  },
  responses: {
    200: {
      description: "알림 읽음 처리 성공",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "인증되지 않은 사용자",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    404: {
      description: "알림을 찾을 수 없음",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "서버 내부 오류",
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
