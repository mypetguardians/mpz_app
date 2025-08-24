import { createRoute, z } from "@hono/zod-openapi";

export const HealthResponseSchema = z
  .object({
    status: z.string(),
    timestamp: z.string(),
    version: z.string(),
  })
  .openapi("HealthResponse");

export const healthRoute = createRoute({
  method: "get",
  path: "/health",
  summary: "Health Check",
  description: "시스템 상태를 확인합니다",
  tags: ["Health"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "시스템이 정상입니다",
    },
    503: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "시스템에 문제가 있습니다",
    },
  },
});
