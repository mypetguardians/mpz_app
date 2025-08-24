import { createRoute, z } from "@hono/zod-openapi";

// Adoption Application Response Schema for Center Admin
export const CenterAdoptionResponseSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    animalId: z.string(),
    animalName: z.string(),
    status: z.enum([
      "신청",
      "미팅",
      "계약서작성",
      "입양완료",
      "모니터링",
      "취소",
    ]),
    notes: z.string().optional(),
    centerNotes: z.string().optional(),
    // 사용자 정보 (미팅 단계부터 공개)
    userInfo: z.object({
      name: z.string(),
      phone: z.string().optional(), // 미팅 단계부터 공개
      address: z.string().optional(), // 미팅 단계부터 공개
      addressIsPublic: z.boolean(),
    }),
    // 질문 응답
    questionResponses: z.array(
      z.object({
        questionId: z.string(),
        questionContent: z.string(),
        answer: z.string(),
      })
    ),
    // 동의사항
    agreements: z.object({
      monitoring: z.boolean(),
      guidelines: z.boolean(),
    }),
    // 단계별 처리 시간
    timeline: z.object({
      appliedAt: z.string(),
      meetingScheduledAt: z.string().optional(),
      contractSentAt: z.string().optional(),
      adoptionCompletedAt: z.string().optional(),
      monitoringStartedAt: z.string().optional(),
      monitoringNextCheckAt: z.string().optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("CenterAdoptionResponse");

// Update Adoption Status Request Schema
export const UpdateAdoptionStatusRequestSchema = z
  .object({
    status: z.enum(["미팅", "계약서작성", "입양완료", "모니터링", "취소"]),
    centerNotes: z.string().optional(),
    meetingScheduledAt: z.string().optional(), // ISO date string for 미팅 단계
  })
  .openapi("UpdateAdoptionStatusRequest");

// Send Contract Request Schema
export const SendContractRequestSchema = z
  .object({
    templateId: z.string(),
    customContent: z.string().optional(),
    centerNotes: z.string().optional(),
  })
  .openapi("SendContractRequest");

// Contract Signature Request Schema (for users)
export const ContractSignatureRequestSchema = z
  .object({
    contractId: z.string(),
    signatureData: z.string(), // Base64 encoded signature image
  })
  .openapi("ContractSignatureRequest");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Monitoring Status Response Schema
export const MonitoringStatusResponseSchema = z
  .object({
    adoptionId: z.string(),
    status: z.enum([
      "신청",
      "미팅",
      "계약서작성",
      "입양완료",
      "모니터링",
      "취소",
    ]),
    monitoringStatus: z.enum(["진행중", "완료", "지연", "중단"]).optional(),
    monitoringStartedAt: z.string().optional(),
    monitoringEndDate: z.string().optional(),
    nextCheckDate: z.string().optional(),
    daysUntilNextDeadline: z.number().nullable(),
    daysUntilMonitoringEnd: z.number().nullable(),
    completedChecks: z.number(),
    totalChecks: z.number(),
    totalMonitoringPosts: z.number(),
    monitoringProgress: z.object({
      percentage: z.number(),
      description: z.string(),
    }),
    centerConfig: z.object({
      monitoringPeriodMonths: z.number(),
      monitoringIntervalDays: z.number(),
    }),
    recentChecks: z.array(
      z.object({
        checkSequence: z.number(),
        checkDate: z.string(),
        expectedCheckDate: z.string(),
        period: z.object({
          start: z.string(),
          end: z.string(),
        }),
        postsFound: z.number(),
        status: z.enum(["정상", "지연", "미제출"]),
        delayDays: z.number(),
        daysUntilDeadline: z.number().nullable(),
        notes: z.string().optional(),
      })
    ),
  })
  .openapi("MonitoringStatusResponse");

// Center Admin Adoption Management Routes
export const getCenterAdoptionsRoute = createRoute({
  method: "get",
  path: "/center-admin/adoptions",
  summary: "센터 입양 신청 목록 조회",
  description: "센터 관리자가 자신의 센터에 들어온 입양 신청들을 조회합니다",
  tags: ["Center Adoption"],
  request: {
    query: z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      status: z
        .enum(["신청", "미팅", "계약서작성", "입양완료", "모니터링", "취소"])
        .optional(),
      animalId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "입양 신청 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            adoptions: z.array(CenterAdoptionResponseSchema),
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
      description: "권한 없음 (센터 관리자만 접근 가능)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateAdoptionStatusRoute = createRoute({
  method: "put",
  path: "/center-admin/adoptions/{adoptionId}/status",
  summary: "입양 신청 상태 변경",
  description: "센터 관리자가 입양 신청의 상태를 단계별로 변경합니다",
  tags: ["Center Adoption"],
  request: {
    params: z.object({
      adoptionId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateAdoptionStatusRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "입양 신청 상태 변경 성공",
      content: {
        "application/json": {
          schema: CenterAdoptionResponseSchema,
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
      description: "입양 신청을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const sendContractRoute = createRoute({
  method: "post",
  path: "/center-admin/adoptions/{adoptionId}/send-contract",
  summary: "계약서 전송",
  description: "센터 관리자가 입양자에게 계약서를 전송합니다",
  tags: ["Center Adoption"],
  request: {
    params: z.object({
      adoptionId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: SendContractRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "계약서 전송 성공",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            contractId: z.string(),
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
      description: "입양 신청을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// User Contract Signature Route
export const signContractRoute = createRoute({
  method: "post",
  path: "/adoption/contract/sign",
  summary: "계약서 서명",
  description: "입양자가 전송받은 계약서에 서명합니다",
  tags: ["Adoption"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ContractSignatureRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "계약서 서명 성공",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            adoptionStatus: z.string(),
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
      description: "계약서를 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const getMonitoringStatusRoute = createRoute({
  method: "get",
  path: "/center-admin/adoptions/{adoptionId}/monitoring-status",
  summary: "입양 모니터링 상태 조회",
  description: "특정 입양의 모니터링 진행 상황과 히스토리를 조회합니다",
  tags: ["Center Adoption"],
  request: {
    params: z.object({
      adoptionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "모니터링 상태 조회 성공",
      content: {
        "application/json": {
          schema: MonitoringStatusResponseSchema,
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
      description: "입양 신청을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Manual monitoring check route for testing
export const runManualMonitoringCheckRoute = createRoute({
  method: "post",
  path: "/center-admin/monitoring/manual-check",
  summary: "수동 모니터링 체크 실행",
  description: "개발/테스트용 수동 모니터링 체크를 실행합니다",
  tags: ["Center Adoption"],
  responses: {
    200: {
      description: "수동 모니터링 체크 성공",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            checked: z.number(),
            issues: z.number(),
            timestamp: z.string(),
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
