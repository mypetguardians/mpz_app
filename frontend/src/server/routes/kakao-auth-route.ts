import { OpenAPIHono } from "@hono/zod-openapi";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppBindings } from "@/types";
import { drizzle } from "drizzle-orm/d1";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { schema } from "@/db";
import {
  getKakaoAuthUrl,
  exchangeKakaoCode,
  getKakaoUserInfo,
  generateState,
} from "@/lib/kakao-auth";
import {
  findOrCreateKakaoUser,
  createUserSession,
} from "@/lib/kakao-user-utils";
import {
  kakaoLoginRoute,
  kakaoCallbackRoute,
} from "@/server/openapi/routes/auth";

const kakaoRoute = new OpenAPIHono<AppBindings>();

// 데이터베이스 미들웨어 추가
kakaoRoute.use("*", async (c, next) => {
  // 로컬 환경에서는 SQLite 사용
  let db;
  if (process.env.NODE_ENV === "development" || !c.env?.DB) {
    const sqlite = new Database("./sqlite.db");
    db = drizzleSQLite(sqlite, { schema });
  } else {
    db = drizzle(c.env.DB, { schema });
  }

  c.set("db", db);
  await next();
});

// 카카오 로그인 시작
kakaoRoute.openapi(kakaoLoginRoute, async (c) => {
  const clientId = process.env.KAKAO_CLIENT_ID;
  if (!clientId) {
    return c.json(
      { error: "카카오 클라이언트 ID가 설정되지 않았습니다." },
      500
    );
  }

  const redirectUri = `${c.req.url.split("/api")[0]}/api/auth/kakao/callback`;
  const state = generateState();

  // 상태값을 쿠키에 저장 (CSRF 보호)
  setCookie(c, "kakao_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60, // 10분
  });

  const authUrl = getKakaoAuthUrl(clientId, redirectUri, state);

  return c.redirect(authUrl);
});

// 카카오 로그인 콜백
kakaoRoute.openapi(kakaoCallbackRoute, async (c) => {
  const { code, state, error } = c.req.valid("query");

  if (error) {
    return c.json({ error: `카카오 로그인 에러: ${error}` }, 400);
  }

  if (!code) {
    return c.json({ error: "인증 코드가 없습니다." }, 400);
  }

  // 상태값 검증 (CSRF 보호)
  const storedState = getCookie(c, "kakao_state");
  if (!storedState || storedState !== state) {
    return c.json({ error: "잘못된 상태값입니다." }, 400);
  }

  try {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return c.json(
        { error: "카카오 클라이언트 설정이 완료되지 않았습니다." },
        500
      );
    }

    const redirectUri = `${c.req.url.split("/api")[0]}/api/auth/kakao/callback`;

    // 액세스 토큰 교환
    const tokenData = await exchangeKakaoCode(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    // 사용자 정보 조회
    const kakaoUser = await getKakaoUserInfo(tokenData.access_token);

    // 사용자 생성 또는 조회
    const userId = await findOrCreateKakaoUser(
      c,
      kakaoUser,
      tokenData.access_token
    );

    // 세션 생성
    const sessionInfo = await createUserSession(c, userId);

    // 세션 쿠키 설정
    setCookie(c, "better-auth.session_token", sessionInfo.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: sessionInfo.expiresAt,
      path: "/",
    });

    // 상태 쿠키 삭제
    deleteCookie(c, "kakao_state");

    // 로그인 전 페이지로 리다이렉트 (쿠키에서 가져옴)
    const redirectAfterLogin = getCookie(c, "redirect_after_login");
    const baseUrl = c.req.url.split("/api")[0];

    let clientRedirectUrl;
    if (
      redirectAfterLogin &&
      redirectAfterLogin !== "/auth/callback" &&
      redirectAfterLogin !== "/login"
    ) {
      // 저장된 페이지로 리다이렉트
      clientRedirectUrl = `${baseUrl}${decodeURIComponent(redirectAfterLogin)}`;
      // 쿠키 삭제
      deleteCookie(c, "redirect_after_login");
    } else {
      // 기본값으로 홈페이지로 리다이렉트
      clientRedirectUrl = `${baseUrl}/`;
    }

    return c.redirect(clientRedirectUrl);
  } catch (err) {
    console.error("카카오 로그인 처리 중 오류:", err);
    return c.json({ error: "카카오 로그인 처리 중 오류가 발생했습니다." }, 500);
  }
});

export default kakaoRoute;
