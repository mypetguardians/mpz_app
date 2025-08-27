import type { Context } from "hono";
import { getDB } from "@/db";
import type { AppBindings } from "@/types";
import { getCookie } from "hono/cookie";

// 사용자 타입 정의
export type UserType = "일반사용자" | "센터관리자" | "훈련사" | "최고관리자";

// 권한 레벨 (숫자가 높을수록 높은 권한)
export const PERMISSION_LEVELS: Record<UserType, number> = {
  일반사용자: 1,
  센터관리자: 2,
  훈련사: 3,
  최고관리자: 4,
};

// 현재 사용자 정보 조회
export async function getCurrentUser(c: Context<AppBindings>) {
  try {
    const sessionToken = getCookie(c, "better-auth.session_token");

    if (!sessionToken) {
      return null;
    }

    const db = getDB(c);

    const { session, user } = await import("@/db/schema/auth");
    const { and, eq, gt } = await import("drizzle-orm");

    const now = new Date();

    const rows = await db
      .select()
      .from(session)
      .where(and(eq(session.token, sessionToken), gt(session.expiresAt, now)))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const foundSession = rows[0] as unknown as { userId: string };

    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, foundSession.userId))
      .limit(1);

    if (users.length === 0) {
      return null;
    }

    return users[0] || null;
  } catch (error) {
    return null;
  }
}

// 권한 체크 함수
export async function hasPermission(
  c: Context<AppBindings>,
  requiredUserType: UserType | UserType[]
): Promise<boolean> {
  const user = await getCurrentUser(c);

  if (!user || !user.userType) {
    return false;
  }

  const userLevel = PERMISSION_LEVELS[user.userType as UserType];

  if (Array.isArray(requiredUserType)) {
    return requiredUserType.some(
      (type) => userLevel >= PERMISSION_LEVELS[type]
    );
  }

  return userLevel >= PERMISSION_LEVELS[requiredUserType];
}

// 휴대폰 인증 체크
export async function isPhoneVerified(
  c: Context<AppBindings>
): Promise<boolean> {
  const user = await getCurrentUser(c);
  return user?.isPhoneVerified === true;
}

// 센터 소유자 체크 (센터 관련 API용)
export async function isCenterOwner(
  c: Context<AppBindings>,
  centerId: string
): Promise<boolean> {
  const user = await getCurrentUser(c);
  if (!user) return false;

  const db = getDB(c);
  const { centers } = await import("@/db/schema/centers");
  const { eq, and } = await import("drizzle-orm");

  const center = await db
    .select()
    .from(centers)
    .where(and(eq(centers.id, centerId), eq(centers.userId, user.id)))
    .limit(1);

  return center.length > 0;
}

// 입양 신청자 체크 (입양 관련 API용)
export async function isAdoptionApplicant(
  c: Context<AppBindings>,
  adoptionId: string
): Promise<boolean> {
  const user = await getCurrentUser(c);
  if (!user) return false;

  const db = getDB(c);
  const { adoptions } = await import("@/db/schema/adoptions");
  const { eq, and } = await import("drizzle-orm");

  const adoption = await db
    .select()
    .from(adoptions)
    .where(and(eq(adoptions.id, adoptionId), eq(adoptions.userId, user.id)))
    .limit(1);

  return adoption.length > 0;
}

// 권한 데코레이터 타입
type PermissionHandler = (
  c: Context<AppBindings>
) => Promise<Response> | Response;

// 권한 체크 데코레이터
export function requirePermission(requiredUserType: UserType | UserType[]) {
  return function (handler: PermissionHandler): PermissionHandler {
    return async function (c: Context<AppBindings>) {
      const hasAccess = await hasPermission(c, requiredUserType);

      if (!hasAccess) {
        return c.json(
          {
            error: "권한이 없습니다.",
            requiredPermission: requiredUserType,
          },
          403
        );
      }

      return handler(c);
    };
  };
}

// 휴대폰 인증 필수 데코레이터
export function requirePhoneVerification() {
  return function (handler: PermissionHandler): PermissionHandler {
    return async function (c: Context<AppBindings>) {
      const verified = await isPhoneVerified(c);

      if (!verified) {
        return c.json({ error: "휴대폰 인증이 필요합니다." }, 403);
      }

      return handler(c);
    };
  };
}

// 센터 소유자 확인 데코레이터
export function requireCenterOwnership() {
  return function (handler: PermissionHandler): PermissionHandler {
    return async function (c: Context<AppBindings>) {
      const centerId = c.req.param("centerId") || c.req.query("centerId");

      if (!centerId) {
        return c.json({ error: "센터 ID가 필요합니다." }, 400);
      }

      const isOwner = await isCenterOwner(c, centerId);

      if (!isOwner) {
        return c.json({ error: "해당 센터의 소유자가 아닙니다." }, 403);
      }

      return handler(c);
    };
  };
}

// 작성자 또는 최고관리자 권한 체크
export async function isAuthorOrSuperAdmin(
  c: Context<AppBindings>,
  authorUserId: string
): Promise<boolean> {
  const user = await getCurrentUser(c);
  if (!user) return false;

  // 작성자 본인인지 확인
  const isAuthor = user.id === authorUserId;

  // 최고관리자인지 확인
  const isSuperAdmin = user.userType === "최고관리자";

  return isAuthor || isSuperAdmin;
}

// 복합 권한 체크 데코레이터 (여러 조건을 AND로 연결)
export function requireAll(
  ...decorators: Array<(handler: PermissionHandler) => PermissionHandler>
) {
  return function (handler: PermissionHandler): PermissionHandler {
    return decorators.reduceRight((acc, decorator) => decorator(acc), handler);
  };
}

// 복합 권한 체크 데코레이터 (여러 조건을 OR로 연결)
export function requireAny(
  ...conditions: Array<(c: Context<AppBindings>) => Promise<boolean>>
) {
  return function (handler: PermissionHandler): PermissionHandler {
    return async function (c: Context<AppBindings>) {
      const results = await Promise.all(
        conditions.map((condition) => condition(c))
      );
      const hasAccess = results.some((result) => result);

      if (!hasAccess) {
        return c.json({ error: "권한이 없습니다." }, 403);
      }

      return handler(c);
    };
  };
}
