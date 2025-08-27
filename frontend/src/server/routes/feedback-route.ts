import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { feedback } from "@/db/schema/feedback";
import { eq, desc, and, type SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  submitFeedbackRoute,
  getMyFeedbackRoute,
} from "@/server/openapi/routes/feedback";

const app = new OpenAPIHono<AppBindings>();

// POST /feedback - 피드백 제출
app.openapi(submitFeedbackRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    const body = c.req.valid("json");

    const { type, content, email, userAgent, deviceInfo, pageUrl } = body;

    const db = getDB(c);

    // 피드백 저장
    await db.insert(feedback).values({
      userId: currentUser?.id || null,
      email: email || currentUser?.email || null,
      type,
      content,
      userAgent: userAgent || c.req.header("User-Agent"),
      deviceInfo,
      pageUrl,
      ipAddress:
        c.req.header("CF-Connecting-IP") ||
        c.req.header("X-Forwarded-For") ||
        "unknown",
    });

    return c.json(
      {
        message: "피드백이 성공적으로 제출되었습니다",
        status: "접수",
      },
      201
    );
  } catch (error) {
    console.error("피드백 제출 오류:", error);
    return c.json({ error: "피드백 제출 중 오류가 발생했습니다" }, 500);
  }
});

// GET /feedback - 내 피드백 목록 조회 (로그인 사용자)
// @ts-expect-error - OpenAPI type complexity
app.openapi(getMyFeedbackRoute, async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const db = getDB(c);
    const query = c.req.valid("query");

    // 쿼리 파라미터
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const status = query.status;
    const type = query.type;

    const offset = (page - 1) * limit;

    // 조건 구성
    const conditions: SQL<unknown>[] = [eq(feedback.userId, currentUser.id)];

    if (status) {
      conditions.push(
        eq(
          feedback.status,
          status as "완료" | "접수" | "검토중" | "처리중" | "보류"
        )
      );
    }

    if (type) {
      conditions.push(
        eq(
          feedback.type,
          type as "버그신고" | "기능요청" | "불편사항" | "문의사항" | "기타"
        )
      );
    }

    const whereCondition = and(...conditions);

    // 피드백 목록 조회
    const feedbackList = await db
      .select()
      .from(feedback)
      .where(whereCondition)
      .orderBy(desc(feedback.createdAt))
      .limit(limit)
      .offset(offset);

    // 총 개수 조회
    const totalCount = await db.select().from(feedback).where(whereCondition);

    return c.json({
      feedbacks: feedbackList,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit),
      },
    });
  } catch (error) {
    console.error("피드백 목록 조회 오류:", error);
    return c.json({ error: "피드백 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /feedback/:id - 특정 피드백 상세 조회
app.get("/feedback/:id", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { id } = c.req.param();
    const db = getDB(c);

    // 피드백 조회 (본인 것만)
    const feedbackDetail = await db
      .select()
      .from(feedback)
      .where(and(eq(feedback.id, id), eq(feedback.userId, currentUser.id)))
      .limit(1);

    if (feedbackDetail.length === 0) {
      return c.json({ error: "피드백을 찾을 수 없습니다" }, 404);
    }

    return c.json({
      feedback: feedbackDetail[0],
    });
  } catch (error) {
    console.error("피드백 상세 조회 오류:", error);
    return c.json({ error: "피드백 상세 조회 중 오류가 발생했습니다" }, 500);
  }
});

// ADMIN ROUTES (관리자용)

// GET /admin/feedback - 모든 피드백 조회 (관리자용)
app.get("/admin/feedback", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (
    !currentUser ||
    !currentUser.userType ||
    !["센터관리자", "최고관리자"].includes(currentUser.userType)
  ) {
    return c.json({ error: "관리자 권한이 필요합니다" }, 403);
  }

  try {
    const db = getDB(c);

    // 쿼리 파라미터
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const status = c.req.query("status");
    const type = c.req.query("type");
    const priority = c.req.query("priority");

    const offset = (page - 1) * limit;

    // 조건 구성
    let whereCondition;

    if (status) {
      whereCondition = and(
        whereCondition,
        eq(
          feedback.status,
          status as "완료" | "접수" | "검토중" | "처리중" | "보류"
        )
      );
    }

    if (type) {
      whereCondition = and(
        whereCondition,
        eq(
          feedback.type,
          type as "버그신고" | "기능요청" | "불편사항" | "문의사항" | "기타"
        )
      );
    }

    if (priority) {
      whereCondition = and(
        whereCondition,
        eq(feedback.priority, priority as "보통" | "낮음" | "높음" | "긴급")
      );
    }

    // 피드백 목록 조회
    const feedbackList = await db
      .select()
      .from(feedback)
      .where(whereCondition)
      .orderBy(desc(feedback.createdAt))
      .limit(limit)
      .offset(offset);

    // 총 개수 조회
    const totalCount = await db.select().from(feedback).where(whereCondition);

    return c.json({
      feedbacks: feedbackList,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit),
      },
    });
  } catch (error) {
    console.error("관리자 피드백 목록 조회 오류:", error);
    return c.json({ error: "피드백 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /admin/feedback/:id/response - 피드백 답변 (관리자용)
app.put("/admin/feedback/:id/response", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (
    !currentUser ||
    !currentUser.userType ||
    !["센터관리자", "최고관리자"].includes(currentUser.userType)
  ) {
    return c.json({ error: "관리자 권한이 필요합니다" }, 403);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { response, status, priority } = body;

    if (!response || !status) {
      return c.json({ error: "response와 status는 필수 항목입니다" }, 400);
    }

    const db = getDB(c);

    // 피드백 존재 확인
    const existingFeedback = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, id))
      .limit(1);

    if (existingFeedback.length === 0) {
      return c.json({ error: "피드백을 찾을 수 없습니다" }, 404);
    }

    // 피드백 업데이트
    await db
      .update(feedback)
      .set({
        adminResponse: response,
        status,
        priority: priority || existingFeedback[0].priority,
        adminId: currentUser.id,
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(feedback.id, id));

    return c.json({
      message: "피드백 답변이 성공적으로 저장되었습니다",
      feedbackId: id,
    });
  } catch (error) {
    console.error("피드백 답변 저장 오류:", error);
    return c.json({ error: "피드백 답변 저장 중 오류가 발생했습니다" }, 500);
  }
});

// GET /feedback/stats - 피드백 통계 (관리자용)
app.get("/admin/feedback/stats", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (
    !currentUser ||
    !currentUser.userType ||
    !["센터관리자", "최고관리자"].includes(currentUser.userType)
  ) {
    return c.json({ error: "관리자 권한이 필요합니다" }, 403);
  }

  try {
    const db = getDB(c);

    // 기본 통계
    const totalFeedback = await db.select().from(feedback);

    // 상태별 통계
    const statusStats = await db
      .select()
      .from(feedback)
      .groupBy(feedback.status);

    // 타입별 통계
    const typeStats = await db.select().from(feedback).groupBy(feedback.type);

    return c.json({
      total: totalFeedback.length,
      byStatus: statusStats,
      byType: typeStats,
    });
  } catch (error) {
    console.error("피드백 통계 조회 오류:", error);
    return c.json({ error: "피드백 통계 조회 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
