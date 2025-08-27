import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { centers } from "@/db/schema/centers";
import { eq, and, desc, or, like, type SQL } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
  executeCountQuery,
} from "@/lib/paginate";
import {
  getAllCentersRoute,
  createCenterRoute,
  updateCenterRoute,
  deleteCenterRoute,
} from "@/server/openapi/routes/superadmin-center";

const app = new OpenAPIHono<AppBindings>();

// GET /superadmin/centers - 모든 보호소 목록 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getAllCentersRoute, async (c) => {
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

    // 검색 조건 (센터명 또는 위치)
    if (query.search) {
      const searchCondition = or(
        like(centers.name, `%${query.search}%`),
        like(centers.location, `%${query.search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // 지역 필터
    if (query.region) {
      whereConditions.push(eq(centers.region, query.region));
    }

    // 공개 여부 필터
    if (query.isPublic) {
      whereConditions.push(eq(centers.isPublic, query.isPublic === "true"));
    }

    // 전체 개수 조회
    const total = await executeCountQuery(
      db,
      centers,
      whereConditions.length > 0 ? whereConditions : []
    );

    // 센터 목록 조회
    const centersList = await db
      .select()
      .from(centers)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(centers.createdAt))
      .limit(limit)
      .offset(offset);

    // 응답 데이터 변환
    const centersResponse = centersList.map((center) => ({
      id: center.id,
      userId: center.userId,
      name: center.name,
      centerNumber: center.centerNumber,
      location: center.location,
      isPublic: center.isPublic,
      adoptionPrice: center.adoptionPrice,
      region: center.region,
      hasMonitoring: center.hasMonitoring,
      monitoringPeriodMonths: center.monitoringPeriodMonths,
      monitoringIntervalDays: center.monitoringIntervalDays,
      monitoringDescription: center.monitoringDescription,
      adoptionGuidelines: center.adoptionGuidelines,
      adoptionProcedure: center.adoptionProcedure,
      isSubscriber: center.isSubscriber,
      createdAt: new Date(center.createdAt).toISOString(),
      updatedAt: new Date(center.updatedAt).toISOString(),
    }));

    // 페이지네이션 결과 생성
    const result = createPaginationResult(centersResponse, total, page, limit);

    return c.json({
      centers: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    });
  } catch (error) {
    console.error("Get all centers error:", error);
    return c.json({ error: "보호소 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// POST /superadmin/centers - 보호소 생성
app.openapi(createCenterRoute, async (c) => {
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

    // 센터 번호 중복 체크
    const existingCenter = await db
      .select()
      .from(centers)
      .where(eq(centers.centerNumber, body.centerNumber))
      .limit(1);

    if (existingCenter.length > 0) {
      return c.json({ error: "이미 존재하는 센터 번호입니다" }, 400);
    }

    // 센터 데이터 생성
    const centerData = {
      userId: body.userId,
      name: body.name,
      centerNumber: body.centerNumber,
      location: body.location,
      isPublic: body.isPublic ?? true,
      adoptionPrice: body.adoptionPrice ?? 0,
      region: body.region || null,
      hasMonitoring: false,
      monitoringPeriodMonths: 1,
      monitoringIntervalDays: 7,
      monitoringDescription: null,
      adoptionGuidelines: null,
      adoptionProcedure: null,
    };

    // DB에 센터 정보 삽입
    const result = await db.insert(centers).values(centerData).returning();
    const createdCenter = result[0];

    // 응답 데이터 변환
    const responseData = {
      id: createdCenter.id,
      userId: createdCenter.userId,
      name: createdCenter.name,
      centerNumber: createdCenter.centerNumber,
      location: createdCenter.location,
      isPublic: createdCenter.isPublic,
      adoptionPrice: createdCenter.adoptionPrice,
      region: createdCenter.region,
      hasMonitoring: createdCenter.hasMonitoring,
      monitoringPeriodMonths: createdCenter.monitoringPeriodMonths,
      monitoringIntervalDays: createdCenter.monitoringIntervalDays,
      monitoringDescription: createdCenter.monitoringDescription,
      adoptionGuidelines: createdCenter.adoptionGuidelines,
      adoptionProcedure: createdCenter.adoptionProcedure,
      createdAt: new Date(createdCenter.createdAt).toISOString(),
      updatedAt: new Date(createdCenter.updatedAt).toISOString(),
    };

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Create center error:", error);
    return c.json({ error: "보호소 생성 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /superadmin/centers/{centerId} - 보호소 정보 수정
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(updateCenterRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const { centerId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 센터 존재 확인
    const existingCenter = await db
      .select()
      .from(centers)
      .where(eq(centers.id, centerId))
      .limit(1);

    if (existingCenter.length === 0) {
      return c.json({ error: "보호소를 찾을 수 없습니다" }, 404);
    }

    // 센터 번호 중복 체크 (변경하는 경우)
    if (body.centerNumber) {
      // 자기 자신이 아닌 다른 센터에서 같은 번호를 사용하는지 확인
      const otherCenter = await db
        .select()
        .from(centers)
        .where(eq(centers.centerNumber, body.centerNumber))
        .limit(1);

      if (otherCenter.length > 0 && otherCenter[0].id !== centerId) {
        return c.json({ error: "이미 존재하는 센터 번호입니다" }, 400);
      }
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof centers.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.centerNumber !== undefined)
      updateData.centerNumber = body.centerNumber;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.adoptionPrice !== undefined)
      updateData.adoptionPrice = body.adoptionPrice;
    if (body.region !== undefined)
      updateData.region = body.region as
        | "서울"
        | "부산"
        | "대구"
        | "인천"
        | "광주"
        | "대전"
        | "울산"
        | "세종"
        | "경기"
        | "강원"
        | "충북"
        | "충남"
        | "전북"
        | "전남"
        | "경북"
        | "경남"
        | "제주";
    if (body.hasMonitoring !== undefined)
      updateData.hasMonitoring = body.hasMonitoring;
    if (body.monitoringPeriodMonths !== undefined)
      updateData.monitoringPeriodMonths = body.monitoringPeriodMonths;
    if (body.monitoringIntervalDays !== undefined)
      updateData.monitoringIntervalDays = body.monitoringIntervalDays;
    if (body.monitoringDescription !== undefined)
      updateData.monitoringDescription = body.monitoringDescription;
    if (body.adoptionGuidelines !== undefined)
      updateData.adoptionGuidelines = body.adoptionGuidelines;
    if (body.adoptionProcedure !== undefined)
      updateData.adoptionProcedure = body.adoptionProcedure;

    // DB 업데이트
    const updatedResult = await db
      .update(centers)
      .set(updateData)
      .where(eq(centers.id, centerId))
      .returning();

    const updatedCenter = updatedResult[0];
    const responseData = {
      id: updatedCenter.id,
      userId: updatedCenter.userId,
      name: updatedCenter.name,
      centerNumber: updatedCenter.centerNumber,
      location: updatedCenter.location,
      isPublic: updatedCenter.isPublic,
      adoptionPrice: updatedCenter.adoptionPrice,
      region: updatedCenter.region,
      hasMonitoring: updatedCenter.hasMonitoring,
      monitoringPeriodMonths: updatedCenter.monitoringPeriodMonths,
      monitoringIntervalDays: updatedCenter.monitoringIntervalDays,
      monitoringDescription: updatedCenter.monitoringDescription,
      adoptionGuidelines: updatedCenter.adoptionGuidelines,
      adoptionProcedure: updatedCenter.adoptionProcedure,
      createdAt: new Date(updatedCenter.createdAt).toISOString(),
      updatedAt: new Date(updatedCenter.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update center error:", error);
    return c.json({ error: "보호소 정보 수정 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /superadmin/centers/{centerId} - 보호소 삭제
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(deleteCenterRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const { centerId } = c.req.valid("param");
    const db = getDB(c);

    // 센터 존재 확인
    const existingCenter = await db
      .select()
      .from(centers)
      .where(eq(centers.id, centerId))
      .limit(1);

    if (existingCenter.length === 0) {
      return c.json({ error: "보호소를 찾을 수 없습니다" }, 404);
    }

    // 센터와 연관된 데이터 확인 (동물, 질문폼, 계약서 템플릿 등)
    // 실제로는 관련 데이터가 있는지 확인하고 경고 메시지를 보내거나
    // CASCADE로 삭제하는 로직을 추가할 수 있습니다.

    // 센터 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
    await db.delete(centers).where(eq(centers.id, centerId));

    return c.json({
      message: `보호소 '${existingCenter[0].name}'이(가) 성공적으로 삭제되었습니다`,
    });
  } catch (error) {
    console.error("Delete center error:", error);
    return c.json({ error: "보호소 삭제 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
