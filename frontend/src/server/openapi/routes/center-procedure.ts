import { createRoute, z } from "@hono/zod-openapi";

// Question Form Schemas
export const QuestionFormSchema = z
  .object({
    id: z.string(),
    centerId: z.string(),
    sequence: z.number(),
    content: z.string(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("QuestionForm");

export const CreateQuestionFormSchema = z
  .object({
    content: z.string().min(1, "질문 내용은 필수입니다"),
    sequence: z.number().optional().default(0),
    isActive: z.boolean().optional().default(true),
  })
  .openapi("CreateQuestionForm");

export const UpdateQuestionFormSchema = z
  .object({
    content: z.string().optional(),
    sequence: z.number().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateQuestionForm");

// Contract Template Schemas
export const ContractTemplateSchema = z
  .object({
    id: z.string(),
    centerId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    content: z.string(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("ContractTemplate");

export const CreateContractTemplateSchema = z
  .object({
    title: z.string().min(1, "계약서 제목은 필수입니다"),
    description: z.string().optional(),
    content: z.string().min(1, "계약서 내용은 필수입니다"),
    isActive: z.boolean().optional().default(true),
  })
  .openapi("CreateContractTemplate");

export const UpdateContractTemplateSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateContractTemplate");

// Center Procedure Settings Schemas
export const CenterProcedureSettingsSchema = z
  .object({
    hasMonitoring: z.boolean(),
    monitoringPeriodMonths: z.number().nullable(),
    monitoringIntervalDays: z.number().nullable(),
    monitoringDescription: z.string().nullable(),
    adoptionGuidelines: z.string().nullable(),
    adoptionProcedure: z.string().nullable(),
    contractTemplates: z.array(ContractTemplateSchema),
  })
  .openapi("CenterProcedureSettings");

export const CreateProcedureSettingsSchema = z
  .object({
    hasMonitoring: z.boolean(),
    monitoringPeriodMonths: z.number().positive().optional().default(3), // 개월 단위
    monitoringIntervalDays: z.number().positive().optional().default(14), // 체크 간격 (일)
    monitoringDescription: z.string().optional(),
    adoptionGuidelines: z.string().optional(),
    adoptionProcedure: z.string().optional(),
  })
  .openapi("CreateProcedureSettings");

export const UpdateProcedureSettingsSchema = z
  .object({
    hasMonitoring: z.boolean().optional(),
    monitoringPeriodMonths: z.number().positive().optional(),
    monitoringIntervalDays: z.number().positive().optional(),
    monitoringDescription: z.string().optional(),
    adoptionGuidelines: z.string().optional(),
    adoptionProcedure: z.string().optional(),
  })
  .openapi("UpdateProcedureSettings");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Question Form Routes
export const getQuestionFormsRoute = createRoute({
  method: "get",
  path: "/centers/procedures/questions",
  summary: "입양 질문 폼 조회",
  description: "센터의 입양 질문 폼들을 조회합니다",
  tags: ["Center Procedures"],
  responses: {
    200: {
      description: "질문 폼 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            questions: z.array(QuestionFormSchema),
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

export const createQuestionFormRoute = createRoute({
  method: "post",
  path: "/centers/procedures/questions",
  summary: "입양 질문 폼 생성",
  description: "새로운 입양 질문을 생성합니다",
  tags: ["Center Procedures"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateQuestionFormSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "질문 폼 생성 성공",
      content: { "application/json": { schema: QuestionFormSchema } },
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
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateQuestionFormRoute = createRoute({
  method: "put",
  path: "/centers/procedures/questions/{questionId}",
  summary: "입양 질문 폼 수정",
  description: "입양 질문을 수정합니다",
  tags: ["Center Procedures"],
  request: {
    params: z.object({
      questionId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateQuestionFormSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "질문 폼 수정 성공",
      content: { "application/json": { schema: QuestionFormSchema } },
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
      description: "질문을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const deleteQuestionFormRoute = createRoute({
  method: "delete",
  path: "/centers/procedures/questions/{questionId}",
  summary: "입양 질문 폼 삭제",
  description: "입양 질문을 삭제합니다",
  tags: ["Center Procedures"],
  request: {
    params: z.object({
      questionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "질문 폼 삭제 성공",
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
      description: "질문을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Procedure Settings Routes
export const getProcedureSettingsRoute = createRoute({
  method: "get",
  path: "/centers/procedures/settings",
  summary: "센터 프로시저 설정 조회",
  description: "모니터링, 계약서 템플릿, 유의사항 등을 조회합니다",
  tags: ["Center Procedures"],
  responses: {
    200: {
      description: "프로시저 설정 조회 성공",
      content: {
        "application/json": {
          schema: CenterProcedureSettingsSchema,
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

export const createProcedureSettingsRoute = createRoute({
  method: "post",
  path: "/centers/procedures/settings",
  summary: "센터 프로시저 설정 생성",
  description: "모니터링, 유의사항 등을 설정합니다",
  tags: ["Center Procedures"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProcedureSettingsSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "프로시저 설정 생성 성공",
      content: {
        "application/json": {
          schema: CenterProcedureSettingsSchema,
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
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateProcedureSettingsRoute = createRoute({
  method: "put",
  path: "/centers/procedures/settings",
  summary: "센터 프로시저 설정 수정",
  description: "모니터링, 유의사항 등을 수정합니다",
  tags: ["Center Procedures"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateProcedureSettingsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "프로시저 설정 수정 성공",
      content: {
        "application/json": {
          schema: CenterProcedureSettingsSchema,
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
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Contract Template Routes
export const createContractTemplateRoute = createRoute({
  method: "post",
  path: "/centers/procedures/contract-template",
  summary: "계약서 템플릿 생성",
  description: "새로운 계약서 템플릿을 생성합니다",
  tags: ["Center Procedures"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateContractTemplateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "계약서 템플릿 생성 성공",
      content: { "application/json": { schema: ContractTemplateSchema } },
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
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const updateContractTemplateRoute = createRoute({
  method: "put",
  path: "/centers/procedures/contract-template/{templateId}",
  summary: "계약서 템플릿 수정",
  description: "계약서 템플릿을 수정합니다",
  tags: ["Center Procedures"],
  request: {
    params: z.object({
      templateId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateContractTemplateSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "계약서 템플릿 수정 성공",
      content: { "application/json": { schema: ContractTemplateSchema } },
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
      description: "템플릿을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export const deleteContractTemplateRoute = createRoute({
  method: "delete",
  path: "/centers/procedures/contract-template/{templateId}",
  summary: "계약서 템플릿 삭제",
  description: "계약서 템플릿을 삭제합니다",
  tags: ["Center Procedures"],
  request: {
    params: z.object({
      templateId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "계약서 템플릿 삭제 성공",
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
      description: "템플릿을 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
