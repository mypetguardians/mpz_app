import { createRoute, z } from "@hono/zod-openapi";

// Center Schemas
export const SuperAdminCenterResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    centerNumber: z.string().nullable(),
    location: z.string().nullable(),
    region: z.string().nullable(),
    isPublic: z.boolean(),
    adoptionPrice: z.number(),
    hasMonitoring: z.boolean(),
    monitoringPeriodMonths: z.number().nullable(),
    monitoringIntervalDays: z.number().nullable(),
    monitoringDescription: z.string().nullable(),
    adoptionGuidelines: z.string().nullable(),
    adoptionProcedure: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("SuperAdminCenterResponse");

export const CreateCenterRequestSchema = z
  .object({
    userId: z.string().min(1, "사용자 ID는 필수입니다"),
    name: z.string().min(1, "센터 이름은 필수입니다"),
    centerNumber: z.string().min(1, "센터 번호는 필수입니다"),
    location: z.string().min(1, "센터 위치는 필수입니다"),
    isPublic: z.boolean().default(true),
    adoptionPrice: z.number().default(0),
    region: z
      .enum([
        "서울",
        "부산",
        "대구",
        "인천",
        "광주",
        "대전",
        "울산",
        "세종",
        "경기",
        "강원",
        "충북",
        "충남",
        "전북",
        "전남",
        "경북",
        "경남",
        "제주",
      ])
      .optional(),
  })
  .openapi("CreateCenterRequest");

export const UpdateSuperAdminCenterRequestSchema = z
  .object({
    name: z.string().optional(),
    centerNumber: z.string().optional(),
    location: z.string().optional(),
    region: z.string().optional(),
    isPublic: z.boolean().optional(),
    adoptionPrice: z.number().optional(),
    hasMonitoring: z.boolean().optional(),
    monitoringPeriodMonths: z.number().optional(),
    monitoringIntervalDays: z.number().optional(),
    monitoringDescription: z.string().optional(),
    adoptionGuidelines: z.string().optional(),
    adoptionProcedure: z.string().optional(),
  })
  .openapi("UpdateSuperAdminCenterRequest");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Superadmin Center Routes
export const getAllCentersRoute = createRoute({
  method: "get",
  path: "/superadmin/centers",
  summary: "모든 보호소 목록 조회",
  description: "최고관리자가 모든 보호소 목록을 조회합니다",
  tags: ["Superadmin Centers"],
  request: {
    query: z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      search: z.string().optional().describe("센터명 또는 위치로 검색"),
      region: z
        .enum([
          "서울",
          "부산",
          "대구",
          "인천",
          "광주",
          "대전",
          "울산",
          "세종",
          "경기",
          "강원",
          "충북",
          "충남",
          "전북",
          "전남",
          "경북",
          "경남",
          "제주",
        ])
        .optional(),
      isPublic: z.enum(["true", "false"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "보호소 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            centers: z.array(SuperAdminCenterResponseSchema),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            totalPages: z.number(),
            hasNext: z.boolean(),
            hasPrev: z.boolean(),
          }),
        },
      },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const createCenterRoute = createRoute({
  method: "post",
  path: "/superadmin/centers",
  summary: "보호소 생성",
  description: "최고관리자가 새로운 보호소를 생성합니다",
  tags: ["Superadmin Centers"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCenterRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "보호소 생성 성공",
      content: {
        "application/json": { schema: SuperAdminCenterResponseSchema },
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
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateCenterRoute = createRoute({
  method: "put",
  path: "/superadmin/centers/{centerId}",
  summary: "보호소 정보 수정",
  description: "최고관리자가 보호소 정보를 수정합니다",
  tags: ["Superadmin Centers"],
  request: {
    params: z.object({
      centerId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSuperAdminCenterRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "보호소 정보 수정 성공",
      content: {
        "application/json": { schema: SuperAdminCenterResponseSchema },
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
    403: {
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "보호소를 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const deleteCenterRoute = createRoute({
  method: "delete",
  path: "/superadmin/centers/{centerId}",
  summary: "보호소 삭제",
  description: "최고관리자가 보호소를 삭제합니다",
  tags: ["Superadmin Centers"],
  request: {
    params: z.object({
      centerId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "보호소 삭제 성공",
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
      description: "권한 없음 (최고관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "보호소를 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
