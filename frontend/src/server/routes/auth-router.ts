// TODO : auth router (최고관리자, 센터관리자, 훈련사, 일반사용자)

import { AppBindings } from "@/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  getSessionRoute,
  signOutRoute,
  getMeRoute,
  signUpRoute,
  signInRoute,
  deleteUserRoute,
  deleteAccountRoute,
} from "@/server/openapi/routes/auth";
import { getCurrentUser } from "@/lib/permissions";
import { getDB } from "@/db";
import { getCookie, deleteCookie, setCookie } from "hono/cookie";

const authRouter = new OpenAPIHono<AppBindings>();

// 세션 정보 조회
authRouter.openapi(getSessionRoute, async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ error: "No세션 비상 Unauthorized@@@@@@@@@@" }, 401);
  }
  // 스키마에 맞게 Date를 string으로 변환
  const formattedSession = {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt.toISOString(),
  };
  return c.json({ session: formattedSession }, 200);
});

// 로그아웃 (커스텀 세션 삭제)
authRouter.openapi(signOutRoute, async (c) => {
  const token = getCookie(c, "better-auth.session_token");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = getDB(c);
  const { session } = await import("@/db/schema/auth");
  await db.delete(session).where(eq(session.token, token));

  deleteCookie(c, "better-auth.session_token");
  return c.json({ message: "Signed out successfully" }, 200);
});

// 내 정보 조회
authRouter.openapi(getMeRoute, async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // DB에서 완전한 사용자 정보 조회
  const db = getDB(c);
  const { user: userTable, account: accountTable } = await import(
    "@/db/schema/auth"
  );

  const fullUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1);
  if (fullUser.length === 0) {
    return c.json({ error: "No세션 비상 Unauthorized@@@@@@@@@@" }, 401);
  }

  // 계정 정보 조회
  const userAccounts = await db
    .select()
    .from(accountTable)
    .where(eq(accountTable.userId, user.id))
    .limit(1);

  // 매칭 세션 정보 조회
  const { matchingSessions } = await import("@/db/schema/matches");
  const userMatchingSessions = await db
    .select()
    .from(matchingSessions)
    .where(eq(matchingSessions.userId, user.id))
    .limit(1);

  // 센터 정보 조회 (센터관리자인 경우)
  let centersInfo = null;
  if (fullUser[0].userType === "센터관리자") {
    const { centers } = await import("@/db/schema/centers");
    const userCenters = await db
      .select()
      .from(centers)
      .where(eq(centers.userId, user.id))
      .limit(1);

    if (userCenters.length > 0) {
      const center = userCenters[0];
      centersInfo = {
        id: center.id,
        name: center.name,
        centerNumber: center.centerNumber,
        description: center.description,
        location: center.location,
        region: center.region,
        phoneNumber: center.phoneNumber,
        verified: center.verified,
        isPublic: center.isPublic,
        adoptionPrice: center.adoptionPrice,
        imageUrl: center.imageUrl,
        isSubscriber: center.isSubscriber,
        createdAt:
          center.createdAt instanceof Date
            ? center.createdAt.toISOString()
            : new Date(center.createdAt * 1000).toISOString(),
        updatedAt:
          center.updatedAt instanceof Date
            ? center.updatedAt.toISOString()
            : new Date(center.updatedAt * 1000).toISOString(),
      };
    }
  }

  // 스키마에 맞게 필수 필드만 반환
  const formattedUser = {
    id: fullUser[0].id,
    email: fullUser[0].email,
    name: fullUser[0].name,
    nickname: fullUser[0].nickname || null,
    phoneNumber: fullUser[0].phoneNumber || null,
    image: fullUser[0].image || null,
    userType: fullUser[0].userType as
      | "일반사용자"
      | "센터관리자"
      | "훈련사"
      | "최고관리자",
    centers: centersInfo,
    matchingSession:
      userMatchingSessions.length > 0
        ? {
            id: userMatchingSessions[0].id,
            userId: userMatchingSessions[0].userId,
            createdAt:
              userMatchingSessions[0].createdAt instanceof Date
                ? userMatchingSessions[0].createdAt.toISOString()
                : new Date(
                    userMatchingSessions[0].createdAt * 1000
                  ).toISOString(),
            updatedAt:
              userMatchingSessions[0].updatedAt instanceof Date
                ? userMatchingSessions[0].updatedAt.toISOString()
                : new Date(
                    userMatchingSessions[0].updatedAt * 1000
                  ).toISOString(),
          }
        : null,
    accounts:
      userAccounts.length > 0
        ? {
            providerId: userAccounts[0].providerId,
          }
        : null,
  };
  return c.json({ user: formattedUser }, 200);
});

// 회원가입
authRouter.openapi(signUpRoute, async (c) => {
  // 1. 로그인된 사용자가 센터관리자 또는 최고관리자인지 확인
  const currentUser = await getCurrentUser(c);
  if (
    !currentUser ||
    (currentUser.userType !== "센터관리자" &&
      currentUser.userType !== "최고관리자")
  ) {
    return c.json(
      { error: "센터관리자 또는 최고관리자만 회원 생성이 가능합니다." },
      403
    );
  }

  // 요청에서 id, email, password, name 추출
  const { id, email, password, name } = c.req.valid("json");
  if (!id || !email || !password) {
    return c.json({ error: "id, 이메일, 비밀번호는 필수입니다." }, 400);
  }

  // DB 인스턴스
  const db = getDB(c);
  const { user: userTable } = await import("@/db/schema/auth");

  // 이메일/아이디 중복 체크
  const exists = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  if (exists.length > 0) {
    return c.json({ error: "이미 가입된 이메일입니다." }, 400);
  }
  const idExists = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, id))
    .limit(1);
  if (idExists.length > 0) {
    return c.json({ error: "이미 사용중인 id입니다." }, 400);
  }

  // 비밀번호 해시
  const hashed = await bcrypt.hash(password, 10);

  // 유저 생성 (userType은 센터관리자로 고정)
  const now = new Date();
  await db.insert(userTable).values({
    id,
    email,
    name: name || email.split("@")[0],
    password: hashed,
    userType: "센터관리자",
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  // 스키마에 맞게 사용자 정보 반환
  const createdUser = {
    id,
    email,
    name: name || email.split("@")[0],
    userType: "센터관리자" as const,
  };
  return c.json({ user: createdUser }, 200);
});

// 로그인
authRouter.openapi(signInRoute, async (c) => {
  // 이미 로그인된 사용자는 다시 로그인 불가
  const user = await getCurrentUser(c);
  if (user) {
    return c.json({ error: "already signed in" }, 400);
  }

  // 요청에서 이메일, 비밀번호 추출
  const { email, password } = c.req.valid("json");
  if (!email || !password) {
    return c.json({ error: "이메일과 비밀번호는 필수입니다." }, 400);
  }

  // DB 인스턴스
  const db = getDB(c);
  const { user: userTable } = await import("@/db/schema/auth");

  // 이메일로 사용자 조회
  const existingUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);
  if (existingUser.length === 0) {
    return c.json({ error: "사용자를 찾을 수 없습니다." }, 404);
  }

  // 비밀번호 검증
  const hash = existingUser[0].password;
  if (!hash) {
    return c.json({ error: "비밀번호가 설정되어 있지 않습니다." }, 400);
  }
  /** @TODO 임시계정 사용시에만 주석처리 */
  // const isValidPassword = await bcrypt.compare(password, hash);

  // if (!isValidPassword) {
  //   return c.json({ error: "비밀번호가 일치하지 않습니다." }, 401);
  // }

  // 세션 생성
  const { session: sessionTable } = await import("@/db/schema/auth");
  const sessionId = crypto.randomUUID();
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일

  await db.insert(sessionTable).values({
    id: sessionId,
    token: sessionToken,
    userId: existingUser[0].id,
    expiresAt: expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 쿠키 설정
  setCookie(c, "better-auth.session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  // 스키마에 맞게 사용자 정보 반환
  const loggedInUser = {
    id: existingUser[0].id,
    email: existingUser[0].email,
    name: existingUser[0].name,
    userType: existingUser[0].userType as
      | "일반사용자"
      | "센터관리자"
      | "훈련사"
      | "최고관리자",
  };
  return c.json({ user: loggedInUser }, 200);
});

// 사용자 삭제
authRouter.openapi(deleteUserRoute, async (c) => {
  const auth = c.get("auth");
  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // 요청에서 사용자 ID 추출
  const { userId } = c.req.valid("json");
  if (!userId) {
    return c.json({ error: "사용자 ID가 필요합니다." }, 400);
  }

  // DB 인스턴스
  const db = getDB(c);
  const { user: userTable } = await import("@/db/schema/auth");

  // 사용자 삭제
  await db.delete(userTable).where(eq(userTable.id, userId));

  return c.json({ message: "사용자 삭제 완료" }, 200);
});

// 계정 탈퇴
authRouter.openapi(deleteAccountRoute, async (c) => {
  try {
    const user = await getCurrentUser(c);
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // 요청에서 사용자 ID 추출
    const { userId } = c.req.valid("json");
    console.log(
      "계정 탈퇴 요청 - 현재 사용자:",
      user.id,
      "요청된 userId:",
      userId
    );

    // DB 인스턴스
    const db = getDB(c);
    const {
      user: userTable,
      session: sessionTable,
      account: accountTable,
    } = await import("@/db/schema/auth");

    // 요청된 사용자 ID로 사용자 정보 조회
    const targetUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (targetUser.length === 0) {
      return c.json({ error: "사용자를 찾을 수 없습니다." }, 404);
    }

    // 계정 정보 조회
    const userAccounts = await db
      .select()
      .from(accountTable)
      .where(eq(accountTable.userId, userId))
      .limit(1);

    // 카카오 계정인지 확인
    const isKakaoAccount =
      userAccounts.length > 0 && userAccounts[0].providerId === "kakao";

    // 계정 정보 조회 (로깅용)
    console.log(
      `계정 탈퇴 요청: userId=${userId}, isKakaoAccount=${isKakaoAccount}`
    );

    // 계정 삭제 처리
    // 1. 사용자의 모든 세션 삭제
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

    // 2. 사용자의 모든 계정 연결 삭제
    await db.delete(accountTable).where(eq(accountTable.userId, userId));

    // 3. 추가 데이터 삭제 (CASCADE로 자동 삭제되지 않는 것들)
    const { notifications, pushTokens } = await import(
      "@/db/schema/notifications"
    );
    const { feedback: feedbackSchema } = await import("@/db/schema/feedback");

    // 알림 삭제
    await db.delete(notifications).where(eq(notifications.userId, userId));

    // 푸시 토큰 삭제
    await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

    // 피드백 삭제 (onDelete: "set null"이지만 명시적으로 삭제)
    await db.delete(feedbackSchema).where(eq(feedbackSchema.userId, userId));

    // 4. 사용자 정보 삭제 (이것이 마지막에 실행되어야 함)
    // CASCADE로 자동 삭제되는 테이블들:
    // - posts (게시글)
    // - adoptions (입양 신청)
    // - centerFavorites, animalFavorites (찜)
    // - comments, replies (댓글, 답글)
    // - matchingResponses, matchingSessions, matchingResults, userPreferences (매칭 관련)
    // - centers (센터 정보 - 센터 관리자인 경우)
    await db.delete(userTable).where(eq(userTable.id, userId));

    // 세션 쿠키 삭제
    deleteCookie(c, "better-auth.session_token");

    return c.json(
      {
        message: "계정이 성공적으로 삭제되었습니다.",
        deletedAt: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    console.error("계정 탈퇴 중 오류 발생:", error);
    return c.json({ error: "서버 내부 오류가 발생했습니다." }, 500);
  }
});

export default authRouter;
