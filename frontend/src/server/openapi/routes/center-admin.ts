import { createRoute, z } from "@hono/zod-openapi";

// Center Admin Schemas
export const CenterAdminResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    centerId: z.string(),
    centerName: z.string(),
    userType: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("CenterAdminResponse");

export const CreateCenterAdminRequestSchema = z
  .object({
    name: z.string().min(1, "이름은 필수입니다"),
    email: z.string().email("올바른 이메일 형식이어야 합니다"),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  })
  .openapi("CreateCenterAdminRequest");

export const UpdateCenterAdminRequestSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .openapi("UpdateCenterAdminRequest");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Center Admin Routes
export const getCenterAdminsRoute = createRoute({
  method: "get",
  path: "/center-admin",
  summary: "우리 센터 관리자 목록 조회",
  description: "센터 관리자가 자신의 센터 관리자 목록을 조회합니다",
  tags: ["Center Admin"],
  responses: {
    200: {
      description: "센터 관리자 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            admins: z.array(CenterAdminResponseSchema),
          }),
        },
      },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (센터 관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const createCenterAdminRoute = createRoute({
  method: "post",
  path: "/center-admin",
  summary: "센터 관리자 생성",
  description: "센터 관리자가 새로운 센터 관리자를 생성합니다",
  tags: ["Center Admin"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCenterAdminRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "센터 관리자 생성 성공",
      content: { "application/json": { schema: CenterAdminResponseSchema } },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (센터 관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateCenterAdminRoute = createRoute({
  method: "put",
  path: "/center-admin/{adminId}",
  summary: "센터 관리자 정보 수정",
  description: "센터 관리자의 이름, 이메일을 수정합니다 (비밀번호 수정 불가)",
  tags: ["Center Admin"],
  request: {
    params: z.object({
      adminId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateCenterAdminRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "센터 관리자 정보 수정 성공",
      content: { "application/json": { schema: CenterAdminResponseSchema } },
    },
    400: {
      description: "잘못된 요청",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "센터 관리자를 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const deleteCenterAdminRoute = createRoute({
  method: "delete",
  path: "/center-admin/{adminId}",
  summary: "센터 관리자 삭제",
  description: "센터 관리자를 삭제합니다",
  tags: ["Center Admin"],
  request: {
    params: z.object({
      adminId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "센터 관리자 삭제 성공",
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "센터 관리자를 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
