import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { matchingResponses } from "@/db/schema/matches";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import { checkUserMatchingResponseRoute } from "@/server/openapi/routes/matching";

const app = new OpenAPIHono<AppBindings>();

// GET /matching/check-response - 사용자 매칭 응답 존재 여부 확인
app.openapi(checkUserMatchingResponseRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const db = getDB(c);

    // 사용자의 매칭 응답이 있는지 확인
    const userResponses = await db
      .select()
      .from(matchingResponses)
      .where(eq(matchingResponses.userId, currentUser.id))
      .orderBy(matchingResponses.createdAt)
      .limit(1);

    const hasMatchingResponse = userResponses.length > 0;
    const lastResponseDate = hasMatchingResponse
      ? new Date(userResponses[0].createdAt).toISOString()
      : undefined;

    return c.json({
      hasMatchingResponse,
      lastResponseDate,
    });
  } catch (error) {
    console.error("Check user matching response error:", error);
    return c.json({
      hasMatchingResponse: false,
      lastResponseDate: undefined,
    });
  }
});

export default app;
