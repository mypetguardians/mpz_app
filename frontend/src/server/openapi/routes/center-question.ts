import { createRoute, z } from "@hono/zod-openapi";

// Question Form Schemas
export const QuestionFormSchema = z
  .object({
    id: z.string(),
    centerId: z.string(),
    question: z.string(),
    type: z.enum(["text", "textarea", "radio", "checkbox", "select"]),
    options: z.array(z.string()).nullable(),
    isRequired: z.boolean(),
    sequence: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("QuestionForm");

export const CreateQuestionFormSchema = z
  .object({
    question: z.string().min(1, "질문은 필수입니다"),
    type: z.enum(["text", "textarea", "radio", "checkbox", "select"]),
    options: z.array(z.string()).optional(),
    isRequired: z.boolean().default(false),
    sequence: z.number().int().min(1).optional(),
  })
  .openapi("CreateQuestionForm");

export const UpdateQuestionFormSchema = z
  .object({
    question: z.string().optional(),
    type: z
      .enum(["text", "textarea", "radio", "checkbox", "select"])
      .optional(),
    options: z.array(z.string()).optional(),
    isRequired: z.boolean().optional(),
    sequence: z.number().int().min(1).optional(),
  })
  .openapi("UpdateQuestionForm");

export const UpdateSequenceSchema = z
  .object({
    sequence: z.number().int().min(1, "순서는 1 이상이어야 합니다"),
  })
  .openapi("UpdateSequence");

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
  summary: "질문 폼 목록 조회",
  description: "센터의 입양 질문 폼 목록을 조회합니다",
  tags: ["Center Questions"],
  responses: {
    200: {
      description: "질문 폼 목록 조회 성공",
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
  summary: "질문 폼 생성",
  description: "새로운 입양 질문 폼을 생성합니다",
  tags: ["Center Questions"],
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
  summary: "질문 폼 수정",
  description: "질문 폼을 수정합니다",
  tags: ["Center Questions"],
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

export const updateQuestionSequenceRoute = createRoute({
  method: "patch",
  path: "/centers/procedures/questions/{questionId}/sequence",
  summary: "질문 폼 순서 변경",
  description: "질문 폼의 순서를 변경합니다",
  tags: ["Center Questions"],
  request: {
    params: z.object({
      questionId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateSequenceSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "질문 폼 순서 변경 성공",
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
  summary: "질문 폼 삭제",
  description: "질문 폼을 삭제합니다",
  tags: ["Center Questions"],
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
