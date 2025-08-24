import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { superadminNotices } from "@/db/schema/notices";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
} from "@/lib/paginate";
import {
  getSuperAdminNoticesRoute,
  getSuperAdminNoticeDetailRoute,
  createSuperAdminNoticeRoute,
  updateSuperAdminNoticeRoute,
  deleteSuperAdminNoticeRoute,
} from "@/server/openapi/routes/center-superadmin-notice";

const app = new OpenAPIHono<AppBindings>();

// GET /center-superadmin-notice - 최고관리자 공지사항 목록 조회 (최고관리자용)
// @ts-expect-error - OpenAPI type complexity
app.openapi(getSuperAdminNoticesRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const query = c.req.valid("query");
    const db = getDB(c);

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // 필터 조건 생성
    const whereConditions: SQL<unknown>[] = [];

    // 활성 상태 필터
    if (query.isActive !== undefined) {
      whereConditions.push(eq(superadminNotices.isActive, query.isActive));
    }

    // 전체 개수 조회
    const totalResult = await db
      .select()
      .from(superadminNotices)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalResult.length;

    // 공지사항 목록 조회
    const noticesList = await db
      .select()
      .from(superadminNotices)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(superadminNotices.createdAt))
      .limit(limit)
      .offset(offset);

    // 응답 데이터 변환
    const noticesResponse = noticesList.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      isActive: notice.isActive,
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
    console.error("Get superadmin notices error:", error);
    return c.json({ error: "공지사항 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /center-superadmin-notice/{noticeId} - 최고관리자 공지사항 상세 조회 (최고관리자용)
// @ts-expect-error - OpenAPI type complexity
app.openapi(getSuperAdminNoticeDetailRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const { noticeId } = c.req.valid("param");
    const db = getDB(c);

    // 공지사항 조회
    const notice = await db
      .select()
      .from(superadminNotices)
      .where(eq(superadminNotices.id, noticeId))
      .limit(1);

    if (notice.length === 0) {
      return c.json({ error: "공지사항을 찾을 수 없습니다" }, 404);
    }

    // 응답 데이터 변환
    const responseData = {
      id: notice[0].id,
      title: notice[0].title,
      content: notice[0].content,
      isActive: notice[0].isActive,
      createdAt: new Date(notice[0].createdAt).toISOString(),
      updatedAt: new Date(notice[0].updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Get superadmin notice detail error:", error);
    return c.json({ error: "공지사항 상세 조회 중 오류가 발생했습니다" }, 500);
  }
});

// POST /center-superadmin-notice - 최고관리자 공지사항 생성
app.openapi(createSuperAdminNoticeRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 공지사항 데이터 생성
    const noticeData = {
      title: body.title,
      content: body.content,
      isActive: body.isActive ?? true,
    };

    // DB에 공지사항 정보 삽입
    const result = await db
      .insert(superadminNotices)
      .values(noticeData)
      .returning();
    const createdNotice = result[0];

    // 응답 데이터 변환
    const responseData = {
      id: createdNotice.id,
      title: createdNotice.title,
      content: createdNotice.content,
      isActive: createdNotice.isActive,
      createdAt: new Date(createdNotice.createdAt).toISOString(),
      updatedAt: new Date(createdNotice.updatedAt).toISOString(),
    };

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Create superadmin notice error:", error);
    return c.json({ error: "공지사항 생성 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /center-superadmin-notice/{noticeId} - 최고관리자 공지사항 수정
// @ts-expect-error - OpenAPI type complexity
app.openapi(updateSuperAdminNoticeRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const { noticeId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 공지사항이 존재하는지 확인
    const existingNotice = await db
      .select()
      .from(superadminNotices)
      .where(eq(superadminNotices.id, noticeId))
      .limit(1);

    if (existingNotice.length === 0) {
      return c.json({ error: "공지사항을 찾을 수 없습니다" }, 404);
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof superadminNotices.$inferInsert> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // updatedAt 자동 업데이트를 위해 현재 시간으로 설정
    updateData.updatedAt = new Date();

    // DB 업데이트
    const updatedResult = await db
      .update(superadminNotices)
      .set(updateData)
      .where(eq(superadminNotices.id, noticeId))
      .returning();

    const updatedNotice = updatedResult[0];
    const responseData = {
      id: updatedNotice.id,
      title: updatedNotice.title,
      content: updatedNotice.content,
      isActive: updatedNotice.isActive,
      createdAt: new Date(updatedNotice.createdAt).toISOString(),
      updatedAt: new Date(updatedNotice.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update superadmin notice error:", error);
    return c.json({ error: "공지사항 수정 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /center-superadmin-notice/{noticeId} - 최고관리자 공지사항 삭제
// @ts-expect-error - OpenAPI type complexity
app.openapi(deleteSuperAdminNoticeRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const { noticeId } = c.req.valid("param");
    const db = getDB(c);

    // 공지사항이 존재하는지 확인
    const existingNotice = await db
      .select()
      .from(superadminNotices)
      .where(eq(superadminNotices.id, noticeId))
      .limit(1);

    if (existingNotice.length === 0) {
      return c.json({ error: "공지사항을 찾을 수 없습니다" }, 404);
    }

    // 공지사항 삭제
    await db
      .delete(superadminNotices)
      .where(eq(superadminNotices.id, noticeId));

    return c.json({
      message: `공지사항 '${existingNotice[0].title}'이(가) 성공적으로 삭제되었습니다`,
    });
  } catch (error) {
    console.error("Delete superadmin notice error:", error);
    return c.json({ error: "공지사항 삭제 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
