import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { superadminNotices } from "@/db/schema/notices";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
} from "@/lib/paginate";
import {
  getNoticesRoute,
  getNoticeDetailRoute,
} from "@/server/openapi/routes/center-notice";

const app = new OpenAPIHono<AppBindings>();

// GET /center-notice - 최고관리자 공지사항 목록 조회 (센터관리자용)
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getNoticesRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const query = c.req.valid("query");
    const db = getDB(c);

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // 활성화된 공지사항만 조회
    const whereConditions = [eq(superadminNotices.isActive, true)];

    // 전체 개수 조회
    const totalResult = await db
      .select()
      .from(superadminNotices)
      .where(and(...whereConditions));

    const total = totalResult.length;

    // 공지사항 목록 조회
    const noticesList = await db
      .select()
      .from(superadminNotices)
      .where(and(...whereConditions))
      .orderBy(desc(superadminNotices.createdAt))
      .limit(limit)
      .offset(offset);

    // 응답 데이터 변환 (센터 관리자에게는 centerId와 centerName을 빈 값으로 제공)
    const noticesResponse = noticesList.map((notice) => ({
      id: notice.id,
      centerId: "", // 최고관리자 공지사항이므로 특정 센터에 속하지 않음
      centerName: "최고관리자",
      title: notice.title,
      content: notice.content,
      createdAt: new Date(notice.createdAt).toISOString(),
      updatedAt: new Date(notice.updatedAt).toISOString(),
    }));

    // 페이지네이션 결과 생성
    const result = createPaginationResult(noticesResponse, total, page, limit);

    return c.json({
      notices: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    });
  } catch (error) {
    console.error("Get notices error:", error);
    return c.json({ error: "공지사항 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /center-notice/{noticeId} - 최고관리자 공지사항 상세 조회 (센터관리자용)
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getNoticeDetailRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const { noticeId } = c.req.valid("param");
    const db = getDB(c);

    // 공지사항 조회 (활성화된 공지사항만)
    const notice = await db
      .select()
      .from(superadminNotices)
      .where(
        and(
          eq(superadminNotices.id, noticeId),
          eq(superadminNotices.isActive, true)
        )
      )
      .limit(1);

    if (notice.length === 0) {
      return c.json({ error: "공지사항을 찾을 수 없습니다" }, 404);
    }

    // 응답 데이터 변환
    const responseData = {
      id: notice[0].id,
      centerId: "", // 최고관리자 공지사항이므로 특정 센터에 속하지 않음
      centerName: "최고관리자",
      title: notice[0].title,
      content: notice[0].content,
      createdAt: new Date(notice[0].createdAt).toISOString(),
      updatedAt: new Date(notice[0].updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Get notice detail error:", error);
    return c.json({ error: "공지사항 상세 조회 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
