import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";

const app = new OpenAPIHono<AppBindings>();

// Simple Health Response Schema
const HealthResponseSchema = z
  .object({
    status: z.string().openapi({
      example: "ok",
      description: "시스템 상태",
    }),
    timestamp: z.string().openapi({
      example: "2024-01-08T07:47:00.000Z",
      description: "현재 시간",
    }),
    version: z.string().openapi({
      example: "1.0.0",
      description: "API 버전",
    }),
  })
  .openapi("HealthResponse");

// Health Check Route
const healthRoute = createRoute({
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

// Health Check Implementation
app.openapi(healthRoute, async (c) => {
  try {
    // Simple database ping test
    const db = getDB(c);
    await db.run("SELECT 1");

    return c.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
      200
    );
  } catch {
    return c.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
      503
    );
  }
});

export default app;
