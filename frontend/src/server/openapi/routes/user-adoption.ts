import { createRoute, z } from "@hono/zod-openapi";

// 개별 입양 스키마
export const UserAdoptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string().nullable(),
  userNickname: z.string().nullable(),
  animalId: z.string(),
  animalName: z.string(),
  animalImage: z.string().nullable(),
  animalIsFemale: z.boolean(),
  animalStatus: z
    .enum([
      "보호중",
      "자연사",
      "입양완료",
      "무지개다리",
      "임시보호중",
      "반환",
      "방사",
    ])
    .nullable()
    .or(z.string()),
  centerId: z.string(),
  centerName: z.string(),
  status: z.enum([
    "신청",
    "미팅",
    "계약서작성",
    "입양완료",
    "모니터링",
    "취소",
  ]),
  notes: z.string().nullable(),
  centerNotes: z.string().nullable(),
  monitoringAgreement: z.boolean(),
  guidelinesAgreement: z.boolean(),
  meetingScheduledAt: z.string().nullable(),
  contractSentAt: z.string().nullable(),
  adoptionCompletedAt: z.string().nullable(),
  monitoringStartedAt: z.string().nullable(),
  monitoringNextCheckAt: z.string().nullable(),
  monitoringStatus: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 사용자 입양 신청 목록 응답 스키마
export const UserAdoptionListResponseSchema = z.object({
  adoptions: z.array(UserAdoptionSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// 사용자 입양 신청 상세 응답 스키마
export const UserAdoptionDetailResponseSchema = z.object({
  adoption: z.object({
    id: z.string(),
    userId: z.string(),
    animalId: z.string(),
    animalName: z.string(),
    animalImage: z.string().nullable(),
    animalBreed: z.string().nullable(),
    animalAge: z.number().nullable(),
    animalGender: z.string().nullable(),
    foundLocation: z.string().nullable(),
    centerId: z.string(),
    centerName: z.string(),
    centerLocation: z.string().nullable(),
    status: z.enum([
      "신청",
      "미팅",
      "계약서작성",
      "입양완료",
      "모니터링",
      "취소",
    ]),
    notes: z.string().nullable(),
    centerNotes: z.string().nullable(),
    monitoringAgreement: z.boolean(),
    guidelinesAgreement: z.boolean(),
    meetingScheduledAt: z.string().nullable(),
    contractSentAt: z.string().nullable(),
    adoptionCompletedAt: z.string().nullable(),
    monitoringStartedAt: z.string().nullable(),
    monitoringNextCheckAt: z.string().nullable(),
    monitoringEndDate: z.string().nullable(),
    monitoringStatus: z.string().nullable(),
    monitoringCompletedChecks: z.number(),
    monitoringTotalChecks: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  questionResponses: z.array(
    z.object({
      id: z.string(),
      questionId: z.string(),
      questionContent: z.string(),
      answer: z.string(),
      createdAt: z.string(),
    })
  ),
  contract: z
    .object({
      id: z.string(),
      templateId: z.string(),
      contractContent: z.string(),
      guidelinesContent: z.string().nullable(),
      userSignatureUrl: z.string().nullable(),
      userSignedAt: z.string().nullable(),
      centerSignatureUrl: z.string().nullable(),
      centerSignedAt: z.string().nullable(),
      status: z.enum(["대기중", "사용자서명완료", "센터서명완료", "계약완료"]),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
  monitoringPosts: z.array(
    z.object({
      id: z.string(),
      postId: z.string(),
      postTitle: z.string().nullable(),
      postContent: z.string().nullable(),
      createdAt: z.string(),
    })
  ),
});

// 사용자 입양 신청 목록 조회 라우트
export const getUserAdoptionsRoute = createRoute({
  method: "get",
  path: "/users/{userId}/adoption",
  summary: "사용자 입양 신청 목록 조회",
  description: "특정 사용자의 입양 신청 목록과 상태를 조회합니다",
  tags: ["User Adoption"],
  request: {
    params: z.object({
      userId: z.string(),
    }),
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      status: z
        .enum(["신청", "미팅", "계약서작성", "입양완료", "모니터링", "취소"])
        .optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserAdoptionListResponseSchema,
        },
      },
      description: "사용자 입양 신청 목록이 성공적으로 조회되었습니다",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "로그인이 필요합니다",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "권한이 없습니다",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "사용자를 찾을 수 없습니다",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "서버 오류",
    },
  },
});

// 사용자 입양 신청 상세 조회 라우트
export const getUserAdoptionDetailRoute = createRoute({
  method: "get",
  path: "/users/{userId}/adoption/{adoptionId}",
  summary: "사용자 입양 신청 상세 조회",
  description: "특정 사용자의 특정 입양 신청에 대한 세부 사항을 조회합니다",
  tags: ["User Adoption"],
  request: {
    params: z.object({
      userId: z.string(),
      adoptionId: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserAdoptionDetailResponseSchema,
        },
      },
      description: "사용자 입양 신청 상세 정보가 성공적으로 조회되었습니다",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "로그인이 필요합니다",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "권한이 없습니다",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "입양 신청을 찾을 수 없습니다",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "서버 오류",
    },
  },
});
