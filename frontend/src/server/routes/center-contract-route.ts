import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { centers, adoptionContractTemplates } from "@/db/schema/centers";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import type { Context } from "hono";
import type { user } from "@/db/schema/auth";
import {
  createContractTemplateRoute,
  updateContractTemplateRoute,
  deleteContractTemplateRoute,
} from "@/server/openapi/routes/center-contract";

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

// POST /centers/procedures/contract-template - 계약서 템플릿 생성
app.openapi(createContractTemplateRoute, async (c) => {
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

    const templateData = {
      centerId: userCenter.id,
      title: body.title,
      description: body.description || null,
      content: body.content,
      isActive: body.isActive !== undefined ? body.isActive : true,
    };

    const result = await db
      .insert(adoptionContractTemplates)
      .values(templateData)
      .returning();
    const createdTemplate = result[0];

    const responseData = {
      id: createdTemplate.id,
      centerId: createdTemplate.centerId,
      title: createdTemplate.title,
      description: createdTemplate.description,
      content: createdTemplate.content,
      isActive: createdTemplate.isActive,
      createdAt: new Date(createdTemplate.createdAt).toISOString(),
      updatedAt: new Date(createdTemplate.updatedAt).toISOString(),
    };

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Create contract template error:", error);
    return c.json({ error: "계약서 템플릿 생성 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /centers/procedures/contract-template/{templateId} - 계약서 템플릿 수정
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(updateContractTemplateRoute, async (c) => {
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

    const { templateId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 템플릿이 존재하고 사용자의 센터에 속하는지 확인
    const existingTemplate = await db
      .select()
      .from(adoptionContractTemplates)
      .where(
        and(
          eq(adoptionContractTemplates.id, templateId),
          eq(adoptionContractTemplates.centerId, userCenter.id)
        )
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return c.json({ error: "템플릿을 찾을 수 없습니다" }, 404);
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof adoptionContractTemplates.$inferInsert> =
      {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedResult = await db
      .update(adoptionContractTemplates)
      .set(updateData)
      .where(eq(adoptionContractTemplates.id, templateId))
      .returning();

    const updatedTemplate = updatedResult[0];
    const responseData = {
      id: updatedTemplate.id,
      centerId: updatedTemplate.centerId,
      title: updatedTemplate.title,
      description: updatedTemplate.description,
      content: updatedTemplate.content,
      isActive: updatedTemplate.isActive,
      createdAt: new Date(updatedTemplate.createdAt).toISOString(),
      updatedAt: new Date(updatedTemplate.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update contract template error:", error);
    return c.json({ error: "계약서 템플릿 수정 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /centers/procedures/contract-template/{templateId} - 계약서 템플릿 삭제
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(deleteContractTemplateRoute, async (c) => {
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

    const { templateId } = c.req.valid("param");
    const db = getDB(c);

    // 템플릿이 존재하고 사용자의 센터에 속하는지 확인
    const existingTemplate = await db
      .select()
      .from(adoptionContractTemplates)
      .where(
        and(
          eq(adoptionContractTemplates.id, templateId),
          eq(adoptionContractTemplates.centerId, userCenter.id)
        )
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return c.json({ error: "템플릿을 찾을 수 없습니다" }, 404);
    }

    await db
      .delete(adoptionContractTemplates)
      .where(eq(adoptionContractTemplates.id, templateId));

    return c.json({ message: "계약서 템플릿이 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error("Delete contract template error:", error);
    return c.json({ error: "계약서 템플릿 삭제 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
