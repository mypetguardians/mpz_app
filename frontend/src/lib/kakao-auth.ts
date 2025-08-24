// 카카오 OAuth 설정
export const KAKAO_CONFIG = {
  authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize",
  tokenEndpoint: "https://kauth.kakao.com/oauth/token",
  userInfoEndpoint: "https://kapi.kakao.com/v2/user/me",
  scope: "", // 기본 동의 항목만 사용 (필수 항목만)
};

// 카카오 로그인 URL 생성
export function getKakaoAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: KAKAO_CONFIG.scope,
    state,
  });

  return `${KAKAO_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

// 카카오 액세스 토큰 교환
export async function exchangeKakaoCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  console.log("카카오 토큰 교환 시작:", {
    clientId: clientId ? "설정됨" : "설정되지 않음",
    clientSecret: clientSecret ? "설정됨" : "설정되지 않음",
    redirectUri,
    code: code.substring(0, 10) + "...",
  });

  const response = await fetch(KAKAO_CONFIG.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("카카오 토큰 교환 응답:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`카카오 토큰 교환 실패: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// 카카오 사용자 정보 조회
export async function getKakaoUserInfo(accessToken: string) {
  const response = await fetch(KAKAO_CONFIG.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!response.ok) {
    throw new Error(`카카오 사용자 정보 조회 실패: ${response.status}`);
  }

  const userInfo = await response.json();

  return {
    id: userInfo.id.toString(),
    email: userInfo.kakao_account?.email || null,
    name: userInfo.kakao_account?.profile?.nickname || "카카오 사용자",
    image: userInfo.kakao_account?.profile?.profile_image_url || null,
  };
}

// 상태값 생성 (CSRF 보호)
export function generateState(): string {
  return crypto.randomUUID().replace(/-/g, "");
}
