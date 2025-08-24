import { createRoute, z } from "@hono/zod-openapi";

// Animal Request Schema
export const CreateAnimalRequestSchema = z
  .object({
    name: z.string().min(1, "동물 이름은 필수입니다"),
    is_female: z.boolean(),
    age: z.number().int().min(0, "나이는 0 이상이어야 합니다"),
    weight: z.number().min(0, "몸무게는 0 이상이어야 합니다"),
    color: z.string().min(1, "색상은 필수입니다"),
    breed: z.string().min(1, "품종은 필수입니다"),
    description: z.string().optional(),
    status: z
      .enum(["보호중", "입양완료", "무지개다리", "임시보호중", "반환", "방사"])
      .default("보호중"),
    activity_level: z.number().int().min(1).max(5).optional(),
    sensitivity: z.number().int().min(1).max(5).optional(),
    sociability: z.number().int().min(1).max(5).optional(),
    separation_anxiety: z.number().int().min(1).max(3).optional(),
    special_notes: z.string().optional(),
    health_notes: z.string().optional(),
    basic_training: z.string().optional(),
    trainer_comment: z.string().optional(),
    announce_number: z.string().optional(),
    announcement_date: z.string().optional(),
    found_location: z.string().optional(),
    personality: z
      .string()
      .optional()
      .describe("성격 (예: 활발함, 온순함, 내성적 등)"),
  })
  .openapi("CreateAnimalRequest");

// Animal Response Schema
export const AnimalResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    isFemale: z.boolean(),
    age: z.number(),
    weight: z.number().nullable(),
    color: z.string().nullable(),
    breed: z.string().nullable(),
    description: z.string().nullable(),
    status: z.enum([
      "보호중",
      "입양완료",
      "무지개다리",
      "임시보호중",
      "반환",
      "방사",
    ]),
    waitingDays: z.number().nullable(),
    activityLevel: z.number().nullable(),
    sensitivity: z.number().nullable(),
    sociability: z.number().nullable(),
    separationAnxiety: z.number().nullable(),
    specialNotes: z.string().nullable(),
    healthNotes: z.string().nullable(),
    basicTraining: z.string().nullable(),
    trainerComment: z.string().nullable(),
    announceNumber: z.string().nullable(),
    announcementDate: z.string().nullable(),
    foundLocation: z.string().nullable(),
    personality: z.string().nullable(),
    centerId: z.string(),
    animalImages: z.array(z.string()).optional().default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("AnimalResponse");

// Error Response Schema (재사용)
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Create Animal Route
export const createAnimalRoute = createRoute({
  method: "post",
  path: "/animals",
  summary: "동물 등록",
  description: "센터 관리자가 새로운 동물을 등록합니다",
  tags: ["Animals"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateAnimalRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "동물 등록 성공",
      content: { "application/json": { schema: AnimalResponseSchema } },
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
      description: "권한 없음 (센터 관리자 이상 필요)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Get Animals List Route
export const getAnimalsRoute = createRoute({
  method: "get",
  path: "/animals",
  summary: "동물 목록 조회",
  description: "등록된 동물 목록을 조회합니다",
  tags: ["Animals"],
  request: {
    query: z.object({
      // 기본 필터
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
      centerId: z.string().optional(),

      // 새로운 필터들
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
        .describe("센터 지역으로 검색"),
      weight: z.enum(["10kg_under", "25kg_under", "over_25kg"]).optional(),
      age: z.enum(["2_under", "7_under", "over_7"]).optional(),
      gender: z.enum(["male", "female"]).optional(),
      hasTrainerComment: z.enum(["true", "false"]).optional(),
      breed: z.string().optional().describe("품종명으로 검색"),

      // 페이지네이션
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    200: {
      description: "동물 목록 조회 성공",
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
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Get Animal by ID Route
export const getAnimalByIdRoute = createRoute({
  method: "get",
  path: "/animals/{animalId}",
  summary: "동물 상세 조회",
  description: "특정 동물의 상세 정보를 조회합니다",
  tags: ["Animals"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "동물 상세 조회 성공",
      content: { "application/json": { schema: AnimalResponseSchema } },
    },
    404: {
      description: "동물을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Update Animal Route
export const updateAnimalRoute = createRoute({
  method: "put",
  path: "/animals/{animalId}",
  summary: "동물 정보 수정",
  description: "동물 정보를 수정합니다",
  tags: ["Animals"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: CreateAnimalRequestSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "동물 정보 수정 성공",
      content: { "application/json": { schema: AnimalResponseSchema } },
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
      description: "동물을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Delete Animal Route
export const deleteAnimalRoute = createRoute({
  method: "delete",
  path: "/animals/{animalId}",
  summary: "동물 정보 삭제",
  description: "동물 정보를 삭제합니다",
  tags: ["Animals"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "동물 정보 삭제 성공",
      content: {
        "application/json": { schema: z.object({ message: z.string() }) },
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
      description: "동물을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Update Animal Status Route
export const updateAnimalStatusRoute = createRoute({
  method: "patch",
  path: "/animals/{animalId}/status",
  summary: "동물 상태 변경",
  description: "동물의 보호 상태를 변경합니다 (보호중, 입양완료 등)",
  tags: ["Animals"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum([
              "보호중",
              "입양완료",
              "무지개다리",
              "임시보호중",
              "반환",
              "방사",
            ]),
            reason: z.string().optional().describe("상태 변경 사유"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "동물 상태 변경 성공",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            previousStatus: z.enum([
              "보호중",
              "입양완료",
              "무지개다리",
              "임시보호중",
              "반환",
              "방사",
            ]),
            newStatus: z.enum([
              "보호중",
              "입양완료",
              "무지개다리",
              "임시보호중",
              "반환",
              "방사",
            ]),
            updatedAt: z.string(),
            message: z.string(),
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
    403: {
      description: "권한 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "동물을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Get Related Animals by Distance Route
export const getRelatedAnimalsByDistanceRoute = createRoute({
  method: "get",
  path: "/animals/{animalId}/related",
  summary: "거리 기반 관련 동물 조회",
  description: "특정 동물과 거리가 가까운 순서대로 관련 동물을 조회합니다",
  tags: ["Animals"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
    query: z.object({
      limit: z
        .string()
        .transform(Number)
        .optional()
        .default(() => 6),
    }),
  },
  responses: {
    200: {
      description: "관련 동물 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            animals: z.array(AnimalResponseSchema),
            total: z.number(),
          }),
        },
      },
    },
    404: {
      description: "동물을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Get Breeds List Route
export const getBreedsRoute = createRoute({
  method: "get",
  path: "/animals/breeds",
  summary: "품종 목록 조회",
  description: "등록된 동물들의 품종 목록을 중복 제거하여 조회합니다",
  tags: ["Animals"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            breeds: z.array(z.string()),
            total: z.number(),
          }),
        },
      },
      description: "품종 목록 조회 성공",
    },
  },
});
