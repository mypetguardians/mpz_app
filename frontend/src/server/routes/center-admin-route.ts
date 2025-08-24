import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { centers } from "@/db/schema/centers";
import { user } from "@/db/schema/auth";
import { eq, and } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import { hashPassword as secureHashPassword } from "@/lib/password-utils";
import type { Context } from "hono";
import {
  getCenterAdminsRoute,
  createCenterAdminRoute,
  updateCenterAdminRoute,
  deleteCenterAdminRoute,
} from "@/server/openapi/routes/center-admin";

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

// GET /center-admin - 우리 센터 관리자 목록 조회
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getCenterAdminsRoute, async (c) => {
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

    // 같은 센터의 모든 센터관리자 조회 (현재는 센터와 사용자가 1:1 관계이므로 단순화)
    const centerAdmins = await db
      .select()
      .from(user)
      .where(
        and(eq(user.id, userCenter.userId), eq(user.userType, "센터관리자"))
      );

    const adminsResponse = centerAdmins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      centerId: userCenter.id,
      centerName: userCenter.name,
      userType: admin.userType,
      createdAt: new Date(admin.createdAt).toISOString(),
      updatedAt: new Date(admin.updatedAt).toISOString(),
    }));

    return c.json({ admins: adminsResponse });
  } catch (error) {
    console.error("Get center admins error:", error);
    return c.json(
      { error: "센터 관리자 목록 조회 중 오류가 발생했습니다" },
      500
    );
  }
});

// POST /center-admin - 센터 관리자 생성
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(createCenterAdminRoute, async (c) => {
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

    // 이메일 중복 체크
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, body.email))
      .limit(1);

    if (existingUser.length > 0) {
      return c.json({ error: "이미 존재하는 이메일입니다" }, 400);
    }

    // 새 센터 관리자 생성
    const hashedPassword = await secureHashPassword(body.password);
    const userData = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      password: hashedPassword,
      userType: "센터관리자" as const,
      emailVerified: true,
      isPhoneVerified: false,
    };

    const result = await db.insert(user).values(userData).returning();
    const createdUser = result[0];

    // 해당 센터와 연결
    await db
      .update(centers)
      .set({ userId: createdUser.id })
      .where(eq(centers.id, userCenter.id));

    const responseData = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      centerId: userCenter.id,
      centerName: userCenter.name,
      userType: createdUser.userType,
      createdAt: new Date(createdUser.createdAt).toISOString(),
      updatedAt: new Date(createdUser.updatedAt).toISOString(),
    };

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Create center admin error:", error);
    return c.json({ error: "센터 관리자 생성 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /center-admin/{adminId} - 센터 관리자 정보 수정
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(updateCenterAdminRoute, async (c) => {
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

    const { adminId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 관리자가 같은 센터에 속하는지 확인
    const targetAdmin = await db
      .select()
      .from(user)
      .leftJoin(centers, eq(centers.userId, user.id))
      .where(
        and(
          eq(user.id, adminId),
          eq(centers.id, userCenter.id),
          eq(user.userType, "센터관리자")
        )
      )
      .limit(1);

    if (targetAdmin.length === 0) {
      return c.json({ error: "센터 관리자를 찾을 수 없습니다" }, 404);
    }

    // 이메일 중복 체크 (변경하는 경우)
    if (body.email) {
      const duplicateUser = await db
        .select()
        .from(user)
        .where(eq(user.email, body.email))
        .limit(1);

      if (duplicateUser.length > 0 && duplicateUser[0].id !== adminId) {
        return c.json({ error: "이미 존재하는 이메일입니다" }, 400);
      }
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof user.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;

    // DB 업데이트
    const updatedResult = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, adminId))
      .returning();

    const updatedAdmin = updatedResult[0];
    const responseData = {
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      centerId: userCenter.id,
      centerName: userCenter.name,
      userType: updatedAdmin.userType,
      createdAt: new Date(updatedAdmin.createdAt).toISOString(),
      updatedAt: new Date(updatedAdmin.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update center admin error:", error);
    return c.json(
      { error: "센터 관리자 정보 수정 중 오류가 발생했습니다" },
      500
    );
  }
});

// DELETE /center-admin/{adminId} - 센터 관리자 삭제
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(deleteCenterAdminRoute, async (c) => {
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

    const { adminId } = c.req.valid("param");
    const db = getDB(c);

    // 자기 자신을 삭제하려는 경우 방지
    if (adminId === currentUser.id) {
      return c.json({ error: "자기 자신은 삭제할 수 없습니다" }, 400);
    }

    // 관리자가 같은 센터에 속하는지 확인
    const targetAdmin = await db
      .select()
      .from(user)
      .leftJoin(centers, eq(centers.userId, user.id))
      .where(
        and(
          eq(user.id, adminId),
          eq(centers.id, userCenter.id),
          eq(user.userType, "센터관리자")
        )
      )
      .limit(1);

    if (targetAdmin.length === 0) {
      return c.json({ error: "센터 관리자를 찾을 수 없습니다" }, 404);
    }

    // 관리자 삭제
    await db.delete(user).where(eq(user.id, adminId));

    return c.json({
      message: `센터 관리자 '${targetAdmin[0].user.name}'이(가) 성공적으로 삭제되었습니다`,
    });
  } catch (error) {
    console.error("Delete center admin error:", error);
    return c.json({ error: "센터 관리자 삭제 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
