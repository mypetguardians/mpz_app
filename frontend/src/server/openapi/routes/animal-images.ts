import { createRoute, z } from "@hono/zod-openapi";

// 이미지 업로드 응답 스키마
export const ImageUploadResponseSchema = z
  .object({
    message: z.string(),
    imageId: z.string(),
    imageUrl: z.string(),
    orderIndex: z.number(),
  })
  .openapi("ImageUploadResponse");

// 이미지 정보 스키마
export const AnimalImageSchema = z
  .object({
    id: z.string(),
    animalId: z.string(),
    imageUrl: z.string(),
    orderIndex: z.number(),
    createdAt: z.string(),
  })
  .openapi("AnimalImage");

// 순서 변경 요청 스키마
export const UpdateImageOrderRequestSchema = z
  .object({
    imageOrders: z.array(
      z.object({
        imageId: z.string(),
        orderIndex: z.number(),
      })
    ),
  })
  .openapi("UpdateImageOrderRequest");

// 에러 응답 스키마
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// 성공 메시지 스키마
export const SuccessMessageSchema = z
  .object({
    message: z.string(),
  })
  .openapi("SuccessMessage");

// 이미지 업로드 라우트
export const uploadAnimalImageRoute = createRoute({
  method: "post",
  path: "/animals/{animalId}/images",
  summary: "동물 이미지 업로드",
  description: "동물의 이미지를 Cloudflare R2에 업로드합니다",
  tags: ["Animal Images"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            image: z.any().openapi({
              type: "string",
              format: "binary",
              description: "업로드할 이미지 파일",
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "이미지 업로드 성공",
      content: {
        "application/json": {
          schema: ImageUploadResponseSchema,
        },
      },
    },
    400: {
      description: "잘못된 요청",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "인증 필요",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "권한 없음",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "동물을 찾을 수 없음",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "서버 오류",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});


// 이미지 삭제 라우트
export const deleteAnimalImageRoute = createRoute({
  method: "delete",
  path: "/animals/{animalId}/images/{imageId}",
  summary: "동물 이미지 삭제",
  description: "동물의 특정 이미지를 삭제합니다",
  tags: ["Animal Images"],
  request: {
    params: z.object({
      animalId: z.string(),
      imageId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "이미지 삭제 성공",
      content: {
        "application/json": {
          schema: SuccessMessageSchema,
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
      description: "이미지를 찾을 수 없음",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// 이미지 순서 변경 라우트
export const updateAnimalImageOrderRoute = createRoute({
  method: "put",
  path: "/animals/{animalId}/images/order",
  summary: "동물 이미지 순서 변경",
  description: "동물 이미지들의 표시 순서를 변경합니다",
  tags: ["Animal Images"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateImageOrderRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "순서 변경 성공",
      content: {
        "application/json": {
          schema: SuccessMessageSchema,
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
