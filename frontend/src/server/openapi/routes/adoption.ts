import { createRoute, z } from "@hono/zod-openapi";

// User Settings Schema for Adoption
export const UserSettingsSchema = z
  .object({
    phone: z.string().optional(),
    phoneVerification: z.boolean(),
    name: z.string().optional(),
    birth: z.string().optional(),
    address: z.string().optional(),
    addressIsPublic: z.boolean(),
  })
  .openapi("UserSettings");

// Phone Verification Schemas
export const SendPhoneVerificationRequestSchema = z
  .object({
    phoneNumber: z.string().min(1, "전화번호는 필수입니다"),
  })
  .openapi("SendPhoneVerificationRequest");

export const VerifyPhoneCodeRequestSchema = z
  .object({
    phoneNumber: z.string().min(1, "전화번호는 필수입니다"),
    verificationCode: z.string().length(6, "인증번호는 6자리입니다"),
  })
  .openapi("VerifyPhoneCodeRequest");

export const PhoneVerificationResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    isVerified: z.boolean().optional(),
  })
  .openapi("PhoneVerificationResponse");

// Adoption Question Response Schema
export const AdoptionQuestionResponseSchema = z
  .object({
    questionId: z.string(),
    answer: z.string(),
  })
  .openapi("AdoptionQuestionResponse");

// Adoption Application Request Schema
export const AdoptionApplicationRequestSchema = z
  .object({
    animalId: z.string(),
    userSettings: z
      .object({
        phone: z.string().min(1, "전화번호는 필수입니다"),
        phoneVerification: z
          .boolean()
          .refine((val) => val === true, "전화번호 인증이 필요합니다"),
        name: z.string().min(1, "이름은 필수입니다"),
        birth: z.string().min(1, "생년월일은 필수입니다"),
        address: z.string().min(1, "주소는 필수입니다"),
        addressIsPublic: z.boolean(),
      })
      .optional(), // 이미 인증된 사용자는 생략 가능
    questionResponses: z.array(AdoptionQuestionResponseSchema),
    monitoringAgreement: z
      .boolean()
      .refine((val) => val === true, "모니터링 동의는 필수입니다"),
    guidelinesAgreement: z
      .boolean()
      .refine((val) => val === true, "입양 유의사항 동의는 필수입니다"),
    // contractAgreement 제거 - 계약서는 나중에 별도로 처리
    notes: z.string().optional(),
  })
  .openapi("AdoptionApplicationRequest");

// Adoption Application Response Schema
export const AdoptionApplicationResponseSchema = z
  .object({
    id: z.string(),
    animalId: z.string(),
    animalName: z.string(),
    centerName: z.string(),
    status: z.enum([
      "신청",
      "미팅",
      "계약서작성",
      "입양완료",
      "모니터링",
      "취소",
    ]),
    notes: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("AdoptionApplicationResponse");

// User Adoption Response Schema
export const UserAdoptionResponseSchema = z
  .object({
    id: z.string(),
    animalId: z.string(),
    animalName: z.string(),
    animalImage: z.string(),
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
    notes: z.string().optional(),
    centerNotes: z.string().optional(),
    monitoringAgreement: z.boolean(),
    guidelinesAgreement: z.boolean(),
    meetingScheduledAt: z.string().optional(),
    contractSentAt: z.string().optional(),
    adoptionCompletedAt: z.string().optional(),
    monitoringStartedAt: z.string().optional(),
    monitoringNextCheckAt: z.string().optional(),
    monitoringStatus: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("UserAdoptionResponse");

// User Adoptions List Response Schema
export const UserAdoptionsListResponseSchema = z
  .object({
    adoptions: z.array(UserAdoptionResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  })
  .openapi("UserAdoptionsListResponse");

// Adoption Pre-check Response Schema
export const AdoptionPreCheckResponseSchema = z
  .object({
    canApply: z.boolean(),
    isPhoneVerified: z.boolean(), // 전화번호 인증 상태
    needsUserSettings: z.boolean(), // 사용자 설정 입력 필요 여부
    animal: z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum([
        "보호중",
        "입양완료",
        "무지개다리",
        "임시보호중",
        "반환",
        "방사",
      ]),
      centerId: z.string(),
      centerName: z.string(),
    }),
    userSettings: UserSettingsSchema.optional(),
    adoptionQuestions: z.array(
      z.object({
        id: z.string(),
        content: z.string(),
        sequence: z.number(),
      })
    ),
    centerInfo: z.object({
      hasMonitoring: z.boolean(),
      monitoringDescription: z.string().optional(),
      adoptionGuidelines: z.string().optional(),
      adoptionPrice: z.number(),
    }),
    contractTemplate: z
      .object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
      })
      .optional(),
    existingApplication: z.boolean(),
  })
  .openapi("AdoptionPreCheckResponse");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Phone Verification Routes
export const sendPhoneVerificationRoute = createRoute({
  method: "post",
  path: "/adoption/phone/send-verification",
  summary: "전화번호 인증코드 발송",
  description: "입양 신청을 위한 전화번호 인증코드를 발송합니다",
  tags: ["Adoption"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendPhoneVerificationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "인증코드 발송 성공",
      content: {
        "application/json": {
          schema: PhoneVerificationResponseSchema,
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
    429: {
      description: "너무 많은 요청 (1분 대기 후 재시도)",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const verifyPhoneCodeRoute = createRoute({
  method: "post",
  path: "/adoption/phone/verify",
  summary: "전화번호 인증코드 확인",
  description: "입양 신청을 위한 전화번호 인증코드를 확인합니다",
  tags: ["Adoption"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: VerifyPhoneCodeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "인증코드 확인 성공",
      content: {
        "application/json": {
          schema: PhoneVerificationResponseSchema,
        },
      },
    },
    400: {
      description: "잘못된 요청 또는 인증코드 불일치",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    401: {
      description: "인증 필요",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    410: {
      description: "인증코드 만료",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Adoption Routes
export const getAdoptionPreCheckRoute = createRoute({
  method: "get",
  path: "/adoption/pre-check/{animalId}",
  summary: "입양 신청 사전 확인",
  description: "입양 신청 가능 여부 및 필요한 정보들을 확인합니다",
  tags: ["Adoption"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "입양 신청 사전 확인 성공",
      content: {
        "application/json": {
          schema: AdoptionPreCheckResponseSchema,
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
      description: "동물을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const submitAdoptionApplicationRoute = createRoute({
  method: "post",
  path: "/adoption/apply",
  summary: "입양 신청 제출",
  description: "동물에 대한 입양 신청을 제출합니다",
  tags: ["Adoption"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdoptionApplicationRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "입양 신청 제출 성공",
      content: {
        "application/json": {
          schema: AdoptionApplicationResponseSchema,
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
      description: "입양 신청 불가 (이미 신청했거나 동물 상태 불가)",
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
