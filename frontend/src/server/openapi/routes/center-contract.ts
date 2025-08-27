import { createRoute, z } from "@hono/zod-openapi";

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

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Contract Template Routes
export const createContractTemplateRoute = createRoute({
  method: "post",
  path: "/centers/procedures/contract-template",
  summary: "계약서 템플릿 생성",
  description: "새로운 계약서 템플릿을 생성합니다",
  tags: ["Center Contracts"],
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
  tags: ["Center Contracts"],
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
  tags: ["Center Contracts"],
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
