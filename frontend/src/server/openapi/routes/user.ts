import { createRoute, z } from "@hono/zod-openapi";

export const UserProfileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    nickname: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    userType: z
      .enum(["일반사용자", "센터관리자", "훈련사", "최고관리자"])
      .nullable()
      .optional(),
    isPhoneVerified: z.boolean().nullable().optional(),
    image: z.string().nullable().optional(),
    createdAt: z.string(),
  })
  .openapi("UserProfile");

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

export const getUserProfileRoute = createRoute({
  method: "get",
  path: "/users/{userId}",
  summary: "사용자 프로필 조회",
  description: "특정 사용자의 프로필 정보를 조회합니다",
  tags: ["Users"],
  request: {
    params: z.object({
      userId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: UserProfileSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "사용자 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const UpdateProfileRequestSchema = z
  .object({
    name: z.string().min(1, "이름은 필수입니다").optional(),
    nickname: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
  })
  .openapi("UpdateProfileRequest");

export const getMeRoute = createRoute({
  method: "get",
  path: "/users/me",
  summary: "내 프로필 조회",
  description: "현재 로그인한 사용자의 프로필 정보를 조회합니다",
  tags: ["Users"],
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: UserProfileSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "사용자 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 사용자 프로필 조회 (본인)
export const getMyProfileRoute = createRoute({
  method: "get",
  path: "/users/profile",
  summary: "사용자 프로필 조회",
  description: "현재 로그인한 사용자의 프로필 정보를 조회합니다",
  tags: ["Users"],
  responses: {
    200: {
      description: "성공",
      content: { "application/json": { schema: UserProfileSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "사용자 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 사용자 프로필 수정
export const updateMyProfileRoute = createRoute({
  method: "put",
  path: "/users/profile",
  summary: "사용자 프로필 수정",
  description:
    "현재 로그인한 사용자의 프로필 정보를 수정합니다 (이름, 닉네임, 휴대폰번호, 이미지만 수정 가능)",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateProfileRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            user: UserProfileSchema,
          }),
        },
      },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "사용자 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
