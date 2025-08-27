import { OpenAPIHono } from "@hono/zod-openapi";
import { getDB } from "@/db";
import { notifications, pushTokens } from "@/db/schema/notifications";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
} from "@/lib/paginate";
import type { AppBindings } from "@/types";

const app = new OpenAPIHono<AppBindings>();

// GET /api/notifications - 내 알림 목록
app.get("/notifications", async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const query = c.req.query();
    const { page, limit, offset } = validatePaginationParams({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });

    const db = getDB(c);

    // 알림 목록 조회
    const notificationsList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, currentUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    const totalCount = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, currentUser.id));

    const pagination = createPaginationResult(
      notificationsList,
      totalCount.length,
      page,
      limit
    );

    return c.json({
      notifications: notificationsList,
      pagination,
    });
  } catch (error) {
    console.error("알림 목록 조회 실패:", error);
    return c.json({ error: "알림 목록을 불러오는데 실패했습니다" }, 500);
  }
});

// PUT /api/notifications/:id/read - 알림 읽음 처리
app.put("/notifications/:id/read", async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const notificationId = c.req.param("id");
    const db = getDB(c);

    // 알림 소유자 확인
    const notification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, currentUser.id)
        )
      )
      .limit(1);

    if (notification.length === 0) {
      return c.json({ error: "알림을 찾을 수 없습니다" }, 404);
    }

    // 읽음 처리
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));

    return c.json({ message: "알림을 읽음 처리했습니다" });
  } catch (error) {
    console.error("알림 읽음 처리 실패:", error);
    return c.json({ error: "알림 읽음 처리에 실패했습니다" }, 500);
  }
});

// PUT /api/notifications/read-all - 모든 알림 읽음 처리
app.put("/notifications/read-all", async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const db = getDB(c);

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.isRead, false)
        )
      );

    return c.json({ message: "모든 알림을 읽음 처리했습니다" });
  } catch (error) {
    console.error("전체 알림 읽음 처리 실패:", error);
    return c.json({ error: "전체 알림 읽음 처리에 실패했습니다" }, 500);
  }
});

// POST /api/notifications/push-token - 푸시 토큰 등록
app.post("/notifications/push-token", async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const body = await c.req.json();
    const { token, platform } = body;

    if (!token || !platform) {
      return c.json({ error: "토큰과 플랫폼 정보가 필요합니다" }, 400);
    }

    const db = getDB(c);

    // 기존 토큰이 있으면 업데이트, 없으면 새로 생성
    const existingToken = await db
      .select()
      .from(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, currentUser.id),
          eq(pushTokens.platform, platform)
        )
      )
      .limit(1);

    if (existingToken.length > 0) {
      await db
        .update(pushTokens)
        .set({
          token,
          lastUsed: new Date(),
          isActive: true,
        })
        .where(eq(pushTokens.id, existingToken[0].id));
    } else {
      await db.insert(pushTokens).values({
        userId: currentUser.id,
        token,
        platform,
        isActive: true,
        lastUsed: new Date(),
      });
    }

    return c.json({ message: "푸시 토큰이 등록되었습니다" });
  } catch (error) {
    console.error("푸시 토큰 등록 실패:", error);
    return c.json({ error: "푸시 토큰 등록에 실패했습니다" }, 500);
  }
});

// DELETE /api/notifications/push-token - 푸시 토큰 삭제
app.delete("/notifications/push-token", async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const body = await c.req.json();
    const { platform } = body;

    if (!platform) {
      return c.json({ error: "플랫폼 정보가 필요합니다" }, 400);
    }

    const db = getDB(c);

    await db
      .update(pushTokens)
      .set({ isActive: false })
      .where(
        and(
          eq(pushTokens.userId, currentUser.id),
          eq(pushTokens.platform, platform)
        )
      );

    return c.json({ message: "푸시 토큰이 비활성화되었습니다" });
  } catch (error) {
    console.error("푸시 토큰 삭제 실패:", error);
    return c.json({ error: "푸시 토큰 삭제에 실패했습니다" }, 500);
  }
});

// GET /api/notifications/unread-count - 읽지 않은 알림 개수
app.get("/notifications/unread-count", async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const db = getDB(c);

    const unreadCount = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.isRead, false)
        )
      );

    return c.json({
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error("읽지 않은 알림 개수 조회 실패:", error);
    return c.json(
      { error: "읽지 않은 알림 개수를 불러오는데 실패했습니다" },
      500
    );
  }
});

export default app;
