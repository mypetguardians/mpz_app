import { createRoute, z } from "@hono/zod-openapi";

// 기본 스키마 정의
export const UserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    nickname: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    userType: z.enum(["일반사용자", "센터관리자", "훈련사", "최고관리자"]),
    accounts: z
      .object({
        providerId: z.string(),
      })
      .nullable()
      .optional(),
  })
  .openapi("User");

export const SessionSchema = z
  .object({
    session: z.object({
      id: z.string(),
      userId: z.string(),
      expiresAt: z.string(),
    }),
  })
  .openapi("Session");

// 에러 응답 스키마
export const AuthErrorSchema = z
  .object({
    error: z.string(),
  })
  .openapi("AuthError");

export const MessageSchema = z
  .object({
    message: z.string(),
  })
  .openapi("Message");

// 세션 조회 라우트
export const getSessionRoute = createRoute({
  method: "get",
  path: "/auth/session",
  summary: "세션 정보 조회",
  description: "현재 사용자의 세션 정보를 조회합니다",
  tags: ["Authentication"],
  responses: {
    200: {
      description: "세션 정보 조회 성공",
      content: {
        "application/json": {
          schema: SessionSchema,
        },
      },
    },
    401: {
      description: "인증되지 않은 사용자",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 로그아웃 라우트
export const signOutRoute = createRoute({
  method: "delete",
  path: "/auth/logout",
  summary: "로그아웃",
  description: "현재 사용자를 로그아웃시킵니다",
  tags: ["Authentication"],
  responses: {
    200: {
      description: "로그아웃 성공",
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
    },
    401: {
      description: "인증되지 않은 사용자",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 내 정보 조회 라우트
export const getMeRoute = createRoute({
  method: "get",
  path: "/auth/me",
  summary: "내 정보 조회",
  description: "현재 로그인한 사용자의 정보를 조회합니다",
  tags: ["Authentication"],
  responses: {
    200: {
      description: "사용자 정보 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            user: UserSchema,
          }),
        },
      },
    },
    401: {
      description: "인증되지 않은 사용자",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 회원가입 라우트
export const signUpRoute = createRoute({
  method: "post",
  path: "/auth/sign-up",
  summary: "회원가입",
  description: "센터관리자 또는 최고관리자가 새 센터관리자를 생성합니다",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().min(1, "ID는 필수입니다"),
            email: z.string().email("유효한 이메일을 입력하세요"),
            password: z
              .string()
              .min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
            name: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "회원가입 성공",
      content: {
        "application/json": {
          schema: z.object({
            user: UserSchema,
          }),
        },
      },
    },
    400: {
      description: "잘못된 요청 (필수 필드 누락, 중복 이메일/ID 등)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    403: {
      description: "권한 없음 (센터관리자 또는 최고관리자만 가능)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 로그인 라우트
export const signInRoute = createRoute({
  method: "post",
  path: "/auth/sign-in",
  summary: "로그인",
  description: "이메일과 비밀번호로 로그인합니다",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email("유효한 이메일을 입력하세요"),
            password: z.string().min(1, "비밀번호는 필수입니다"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "로그인 성공",
      content: {
        "application/json": {
          schema: z.object({
            user: UserSchema,
          }),
        },
      },
    },
    400: {
      description: "잘못된 요청 (이미 로그인됨, 필수 필드 누락 등)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    401: {
      description: "인증 실패 (비밀번호 불일치)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    404: {
      description: "사용자를 찾을 수 없음",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 사용자 삭제 라우트
export const deleteUserRoute = createRoute({
  method: "post",
  path: "/auth/deleteauth",
  summary: "사용자 삭제",
  description: "관리자가 사용자를 삭제합니다",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().min(1, "사용자 ID는 필수입니다"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "사용자 삭제 성공",
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
    },
    400: {
      description: "잘못된 요청 (사용자 ID 누락)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    401: {
      description: "인증되지 않은 사용자",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 계정 탈퇴 라우트
export const deleteAccountRoute = createRoute({
  method: "delete",
  path: "/auth/deleteaccount",
  summary: "계정 탈퇴",
  description: "현재 로그인한 사용자의 계정을 영구적으로 삭제합니다",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().describe("삭제할 사용자의 고유 ID"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "계정 탈퇴 성공",
      content: {
        "application/json": {
          schema: MessageSchema,
        },
      },
    },
    400: {
      description: "잘못된 요청 (비밀번호 누락 또는 불일치)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    401: {
      description: "인증되지 않은 사용자",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    404: {
      description: "사용자를 찾을 수 없음",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    500: {
      description: "서버 오류",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 카카오 로그인 시작 라우트
export const kakaoLoginRoute = createRoute({
  method: "get",
  path: "/auth/kakao/login",
  summary: "카카오 로그인 시작",
  description:
    "카카오 OAuth 인증을 시작합니다. 카카오 로그인 페이지로 리다이렉트됩니다.",
  tags: ["Authentication"],
  responses: {
    302: {
      description: "카카오 로그인 페이지로 리다이렉트",
      headers: z.object({
        Location: z.string().describe("카카오 OAuth 인증 URL"),
      }),
    },
    500: {
      description: "서버 설정 오류",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});

// 카카오 로그인 콜백 라우트
export const kakaoCallbackRoute = createRoute({
  method: "get",
  path: "/auth/kakao/callback",
  summary: "카카오 로그인 콜백",
  description: "카카오 OAuth 인증 후 콜백을 처리합니다",
  tags: ["Authentication"],
  request: {
    query: z.object({
      code: z.string().optional().describe("카카오 인증 코드"),
      state: z.string().optional().describe("CSRF 보호를 위한 상태값"),
      error: z.string().optional().describe("인증 오류 코드"),
    }),
  },
  responses: {
    302: {
      description: "로그인 성공 후 메인 페이지로 리다이렉트",
      headers: z.object({
        Location: z.string().describe("리다이렉트 URL"),
        "Set-Cookie": z.string().describe("세션 쿠키"),
      }),
    },
    400: {
      description: "잘못된 요청 (인증 코드 없음, 상태값 불일치 등)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
    500: {
      description: "서버 오류 (설정 오류, 인증 처리 실패 등)",
      content: {
        "application/json": {
          schema: AuthErrorSchema,
        },
      },
    },
  },
});
