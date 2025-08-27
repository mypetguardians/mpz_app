import crypto from "crypto";

const JWT_SECRET = "test-secret-key-for-mpz-testing";

export interface JWTPayload {
  sub: string; // user id
  email?: string;
  userType?: "일반사용자" | "센터관리자" | "최고관리자";
  name?: string;
  iat?: number;
  exp?: number;
}

function base64url(str: string) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateJWT(payload: JWTPayload): string {
  const header = { alg: "HS256", typ: "JWT" };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: payload.iat || now,
    exp: payload.exp || now + 60 * 60 * 24, // 24시간 후 만료
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(encodedHeader + "." + encodedPayload)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 테스트용 사용자 JWT 생성 함수들
export function createUserJWT(userId: string = "test-user-1"): string {
  return generateJWT({
    sub: userId,
    email: "user@test.com",
    userType: "일반사용자",
    name: "테스트 사용자",
  });
}

export function createCenterAdminJWT(
  userId: string = "test-center-admin-1"
): string {
  return generateJWT({
    sub: userId,
    email: "center@test.com",
    userType: "센터관리자",
    name: "테스트 센터관리자",
  });
}

export function createSuperAdminJWT(
  userId: string = "test-super-admin-1"
): string {
  return generateJWT({
    sub: userId,
    email: "admin@test.com",
    userType: "최고관리자",
    name: "테스트 최고관리자",
  });
}

export function createExpiredJWT(userId: string = "test-user-expired"): string {
  const yesterday = Math.floor(Date.now() / 1000) - 60 * 60 * 24;
  return generateJWT({
    sub: userId,
    email: "expired@test.com",
    userType: "일반사용자",
    name: "만료된 사용자",
    exp: yesterday,
  });
}

// Authorization 헤더 생성
export function createAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
