import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import {
  getUserProfileRoute,
  getMeRoute,
  getMyProfileRoute,
  updateMyProfileRoute,
} from "@/server/openapi/routes/user";
import { getCurrentUser } from "@/lib/permissions";

const app = new OpenAPIHono<AppBindings>();

// /users/{userId}
app.openapi(getUserProfileRoute, async (c) => {
  const { userId } = c.req.valid("param");
  const currentUser = await getCurrentUser(c);

  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401 as const);
  }

  try {
    const db = getDB(c);
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (rows.length === 0) {
      return c.json({ error: "사용자를 찾을 수 없습니다" }, 404 as const);
    }

    const u = rows[0];
    return c.json(
      {
        id: u.id,
        name: u.name,
        email: u.email,
        nickname: u.nickname ?? null,
        phoneNumber: u.phoneNumber ?? null,
        userType: u.userType ?? null,
        isPhoneVerified: u.isPhoneVerified ?? null,
        image: u.image ?? null,
        createdAt:
          u.createdAt instanceof Date
            ? u.createdAt.toISOString()
            : new Date(u.createdAt * 1000).toISOString(),
      },
      200 as const
    );
  } catch {
    return c.json({ error: "서버 오류가 발생했습니다" }, 500 as const);
  }
});

// /users/me
app.openapi(getMeRoute, async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401 as const);
  }

  try {
    const db = getDB(c);
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);
    if (rows.length === 0) {
      return c.json({ error: "사용자를 찾을 수 없습니다" }, 404 as const);
    }

    const u = rows[0];
    return c.json(
      {
        id: u.id,
        name: u.name,
        email: u.email,
        nickname: u.nickname ?? null,
        phoneNumber: u.phoneNumber ?? null,
        userType: u.userType ?? null,
        isPhoneVerified: u.isPhoneVerified ?? null,
        image: u.image ?? null,
        createdAt:
          u.createdAt instanceof Date
            ? u.createdAt.toISOString()
            : new Date(u.createdAt * 1000).toISOString(),
      },
      200 as const
    );
  } catch {
    return c.json({ error: "서버 오류가 발생했습니다" }, 500 as const);
  }
});

// /users/profile (GET) - 사용자 프로필 조회
app.openapi(getMyProfileRoute, async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401 as const);
  }

  try {
    const db = getDB(c);
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);
    if (rows.length === 0) {
      return c.json({ error: "사용자를 찾을 수 없습니다" }, 404 as const);
    }

    const u = rows[0];
    return c.json(
      {
        id: u.id,
        name: u.name,
        email: u.email,
        nickname: u.nickname ?? null,
        phoneNumber: u.phoneNumber ?? null,
        userType: u.userType ?? null,
        isPhoneVerified: u.isPhoneVerified ?? null,
        image: u.image ?? null,
        createdAt:
          u.createdAt instanceof Date
            ? u.createdAt.toISOString()
            : new Date(u.createdAt * 1000).toISOString(),
      },
      200 as const
    );
  } catch {
    return c.json({ error: "서버 오류가 발생했습니다" }, 500 as const);
  }
});

// /users/profile (PUT) - 사용자 프로필 수정
app.openapi(updateMyProfileRoute, async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401 as const);
  }

  try {
    const { name, nickname, phoneNumber, image } = c.req.valid("json");
    const db = getDB(c);

    // 현재 사용자 정보 확인
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (existingUser.length === 0) {
      return c.json({ error: "사용자를 찾을 수 없습니다" }, 404 as const);
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof user.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (image !== undefined) updateData.image = image;

    // 사용자 정보 업데이트
    await db.update(user).set(updateData).where(eq(user.id, currentUser.id));

    // 업데이트된 사용자 정보 조회
    const updatedUser = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    const u = updatedUser[0];
    return c.json(
      {
        message: "프로필이 성공적으로 수정되었습니다",
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          nickname: u.nickname ?? null,
          phoneNumber: u.phoneNumber ?? null,
          userType: u.userType ?? null,
          isPhoneVerified: u.isPhoneVerified ?? null,
          image: u.image ?? null,
          createdAt:
            u.createdAt instanceof Date
              ? u.createdAt.toISOString()
              : new Date(u.createdAt * 1000).toISOString(),
        },
      },
      200 as const
    );
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return c.json({ error: "서버 오류가 발생했습니다" }, 500 as const);
  }
});

export default app;
