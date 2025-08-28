import { createRoute, z } from "@hono/zod-openapi";
import { AnimalResponseSchema } from "./animal";

// Center Request/Response Schemas
export const CenterResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    centerNumber: z.string().nullable(),
    description: z.string().nullable(),
    location: z.string().nullable(),
    region: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    adoptionProcedure: z.string().nullable(),
    adoptionGuidelines: z.string().nullable(),
    hasMonitoring: z.boolean(),
    monitoringPeriodMonths: z.number().nullable(),
    monitoringIntervalDays: z.number().nullable(),
    monitoringDescription: z.string().nullable(),
    verified: z.boolean(),
    isPublic: z.boolean(),
    adoptionPrice: z.number(),
    imageUrl: z.string().nullable(),
    isSubscriber: z.boolean(),
    isFavorited: z.boolean().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("CenterResponse");

export const UpdateCenterRequestSchema = z
  .object({
    name: z.string().optional(),
    centerNumber: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    region: z.string().optional(),
    phoneNumber: z.string().optional(),
    adoptionProcedure: z.string().optional(),
    adoptionGuidelines: z.string().optional(),
    hasMonitoring: z.boolean().optional(),
    monitoringPeriodMonths: z.number().optional(),
    monitoringIntervalDays: z.number().optional(),
    monitoringDescription: z.string().optional(),
    isPublic: z.boolean().optional(),
    adoptionPrice: z.number().optional(),
    imageUrl: z.string().optional(),
  })
  .openapi("UpdateCenterRequest");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Get Centers by Location Route
export const getCentersByLocationRoute = createRoute({
  method: "get",
  path: "/centers",
  summary: "센터 목록 조회 (지역명 검색)",
  description: "지역명으로 센터를 검색합니다",
  tags: ["Centers"],
  request: {
    query: z.object({
      location: z.string().optional().describe("주소지로 검색"),
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
        .optional()
        .describe("지역으로 검색"),
    }),
  },
  responses: {
    200: {
      description: "센터 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            centers: z.array(CenterResponseSchema),
          }),
        },
      },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Get Center by ID Route
export const getCenterByIdRoute = createRoute({
  method: "get",
  path: "/centers/{id}",
  summary: "보호소 상세 정보 조회",
  description: "보호소 ID로 특정 보호소의 정보를 조회합니다",
  tags: ["Centers"],
  request: {
    params: z.object({
      id: z.string().describe("보호소 ID"),
    }),
  },
  responses: {
    200: {
      description: "보호소 정보 조회 성공",
      content: {
        "application/json": {
          schema: CenterResponseSchema,
        },
      },
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

// Get Center Animals Route
export const getCenterAnimalsRoute = createRoute({
  method: "get",
  path: "/centers/animals",
  summary: "센터의 동물 목록 조회",
  description: "현재 센터에서 등록한 동물들을 조회합니다",
  tags: ["Centers"],
  request: {
    query: z.object({
      status: z
        .enum([
          "보호중",
          "입양완료",
          "무지개다리",
          "임시보호중",
          "반환",
          "방사",
        ])
        .optional(),
      breed: z.string().optional(),
      gender: z.enum(["male", "female"]).optional(),
      weight: z.enum(["10kg_under", "25kg_under", "over_25kg"]).optional(),
      age: z.enum(["2_under", "7_under", "over_7"]).optional(),
      hasTrainerComment: z.enum(["true", "false"]).optional(),
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    200: {
      description: "센터 동물 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            animals: z.array(AnimalResponseSchema),
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
      description: "권한 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Update Center Settings Route
export const updateCenterRoute = createRoute({
  method: "put",
  path: "/centers/settings",
  summary: "센터 설정 수정",
  description: "센터의 기본 정보를 수정합니다",
  tags: ["Centers"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateCenterRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "센터 설정 수정 성공",
      content: { "application/json": { schema: CenterResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "권한 없음 (센터 관리자만 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "센터를 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Get My Center Route
export const getMyCenterRoute = createRoute({
  method: "get",
  path: "/centers/me",
  summary: "내 센터 정보 조회",
  description: "현재 로그인한 센터 관리자의 센터 정보를 조회합니다",
  tags: ["Centers"],
  responses: {
    200: {
      description: "센터 정보 조회 성공",
      content: {
        "application/json": {
          schema: CenterResponseSchema,
        },
      },
    },
    401: {
      description: "로그인 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "센터 관리자 권한 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "등록된 센터가 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
