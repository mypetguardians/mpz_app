import { eq, and } from "drizzle-orm";
import type { Context } from "hono";
import type { AppBindings } from "@/types";
import { user, account, session } from "@/db/schema/auth";
import { getDB } from "@/db";

export interface KakaoUserInfo {
  id: string;
  email: string | null;
  name: string;
  image: string | null;
}

// 간단한 ID 생성 함수 (Better Auth의 generateId 대신)
function generateId(): string {
  return crypto.randomUUID();
}

// 카카오 사용자를 데이터베이스에 생성 또는 조회
export async function findOrCreateKakaoUser(
  c: Context<AppBindings>,
  kakaoUser: KakaoUserInfo,
  accessToken: string
) {
  const db = getDB(c);

  // 기존 카카오 계정 확인
  const existingAccount = await db
    .select()
    .from(account)
    .leftJoin(user, eq(account.userId, user.id))
    .where(
      and(eq(account.providerId, "kakao"), eq(account.accountId, kakaoUser.id))
    )
    .limit(1);

  let userId: string;

  if (existingAccount.length > 0) {
    // 기존 사용자
    userId = existingAccount[0].account.userId;

    // 액세스 토큰 업데이트
    await db
      .update(account)
      .set({
        accessToken,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(account.providerId, "kakao"),
          eq(account.accountId, kakaoUser.id)
        )
      );
  } else {
    // 새로운 사용자 생성
    userId = generateId();

    // 사용자 테이블에 삽입
    await db.insert(user).values({
      id: userId,
      name: kakaoUser.name,
      email: kakaoUser.email || `kakao_${kakaoUser.id}@kakao.local`,
      image: kakaoUser.image,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 계정 연결 정보 저장
    await db.insert(account).values({
      id: generateId(),
      accountId: kakaoUser.id,
      providerId: "kakao",
      userId,
      accessToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return userId;
}

// Better Auth 세션 생성
export async function createUserSession(
  c: Context<AppBindings>,
  userId: string
) {
  const db = getDB(c);

  const sessionId = generateId();
  const sessionToken = generateId();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일

  await db.insert(session).values({
    id: sessionId,
    token: sessionToken,
    userId,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    sessionId,
    sessionToken,
    expiresAt,
  };
}
