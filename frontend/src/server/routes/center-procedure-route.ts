import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import type { Context } from "hono";
import { getDB } from "@/db";
import { centers, adoptionContractTemplates } from "@/db/schema/centers";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import { user } from "@/db/schema/auth";
import {
  getProcedureSettingsRoute,
  createProcedureSettingsRoute,
  updateProcedureSettingsRoute,
} from "@/server/openapi/routes/center-procedure";

const app = new OpenAPIHono<AppBindings>();

// Helper function to get user's center (센터 관리자는 자신의 센터만 조회)
async function getUserCenter(
  c: Context<AppBindings>,
  currentUser: typeof user.$inferSelect
) {
  const db = getDB(c);
  const userCenters = await db
    .select()
    .from(centers)
    .where(eq(centers.userId, currentUser.id))
    .limit(1);

  if (userCenters.length === 0) {
    return null;
  }
  return userCenters[0];
}

// GET /centers/procedures/settings - 센터 프로시저 설정 조회
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getProcedureSettingsRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const db = getDB(c);

    // 계약서 템플릿들 조회
    const contractTemplates = await db
      .select()
      .from(adoptionContractTemplates)
      .where(eq(adoptionContractTemplates.centerId, userCenter.id))
      .orderBy(desc(adoptionContractTemplates.createdAt));

    return c.json({
      hasMonitoring: userCenter.hasMonitoring,
      monitoringPeriodMonths: userCenter.monitoringPeriodMonths,
      monitoringIntervalDays: userCenter.monitoringIntervalDays,
      monitoringDescription: userCenter.monitoringDescription,
      adoptionGuidelines: userCenter.adoptionGuidelines,
      adoptionProcedure: userCenter.adoptionProcedure,
      contractTemplates: contractTemplates.map((template) => ({
        id: template.id,
        centerId: template.centerId,
        title: template.title,
        description: template.description,
        content: template.content,
        isActive: template.isActive,
        createdAt: new Date(template.createdAt).toISOString(),
        updatedAt: new Date(template.updatedAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get procedure settings error:", error);
    return c.json({ error: "프로시저 설정 조회 중 오류가 발생했습니다" }, 500);
  }
});

// POST /centers/procedures/settings - 센터 프로시저 설정 생성
app.openapi(createProcedureSettingsRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    const updateData: Partial<typeof centers.$inferInsert> = {};
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

    await db
      .update(centers)
      .set(updateData)
      .where(eq(centers.id, userCenter.id));

    // 업데이트된 센터 정보 조회
    const updatedCenter = await db
      .select()
      .from(centers)
      .where(eq(centers.id, userCenter.id))
      .limit(1);

    // 계약서 템플릿들 조회
    const contractTemplates = await db
      .select()
      .from(adoptionContractTemplates)
      .where(eq(adoptionContractTemplates.centerId, userCenter.id))
      .orderBy(desc(adoptionContractTemplates.createdAt));

    const templatesResponse = contractTemplates.map((template) => ({
      id: template.id,
      centerId: template.centerId,
      title: template.title,
      description: template.description,
      content: template.content,
      isActive: template.isActive,
      createdAt: new Date(template.createdAt).toISOString(),
      updatedAt: new Date(template.updatedAt).toISOString(),
    }));

    const center = updatedCenter[0];
    const responseData = {
      hasMonitoring: center.hasMonitoring,
      monitoringPeriodMonths: center.monitoringPeriodMonths,
      monitoringIntervalDays: center.monitoringIntervalDays,
      monitoringDescription: center.monitoringDescription,
      adoptionGuidelines: center.adoptionGuidelines,
      adoptionProcedure: center.adoptionProcedure,
      contractTemplates: templatesResponse,
    };

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Create procedure settings error:", error);
    return c.json({ error: "프로시저 설정 생성 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /centers/procedures/settings - 센터 프로시저 설정 수정
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(updateProcedureSettingsRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    const updateData: Partial<typeof centers.$inferInsert> = {};
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

    await db
      .update(centers)
      .set(updateData)
      .where(eq(centers.id, userCenter.id));

    // 업데이트된 센터 정보 조회
    const updatedCenter = await db
      .select()
      .from(centers)
      .where(eq(centers.id, userCenter.id))
      .limit(1);

    // 계약서 템플릿들 조회
    const contractTemplates = await db
      .select()
      .from(adoptionContractTemplates)
      .where(eq(adoptionContractTemplates.centerId, userCenter.id))
      .orderBy(desc(adoptionContractTemplates.createdAt));

    const templatesResponse = contractTemplates.map((template) => ({
      id: template.id,
      centerId: template.centerId,
      title: template.title,
      description: template.description,
      content: template.content,
      isActive: template.isActive,
      createdAt: new Date(template.createdAt).toISOString(),
      updatedAt: new Date(template.updatedAt).toISOString(),
    }));

    const center = updatedCenter[0];
    const responseData = {
      hasMonitoring: center.hasMonitoring,
      monitoringPeriodMonths: center.monitoringPeriodMonths,
      monitoringIntervalDays: center.monitoringIntervalDays,
      monitoringDescription: center.monitoringDescription,
      adoptionGuidelines: center.adoptionGuidelines,
      adoptionProcedure: center.adoptionProcedure,
      contractTemplates: templatesResponse,
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update procedure settings error:", error);
    return c.json({ error: "프로시저 설정 수정 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
