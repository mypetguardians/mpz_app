import { createRoute, z } from "@hono/zod-openapi";

// Favorite Response Schemas
export const FavoriteToggleResponseSchema = z
  .object({
    isFavorited: z.boolean(),
    message: z.string(),
    totalFavorites: z.number(),
  })
  .openapi("FavoriteToggleResponse");

export const FavoriteListResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    isFavorited: z.boolean(),
    favoritedAt: z.string().optional(),
  })
  .openapi("FavoriteListResponse");

export const CenterFavoriteWithDetailsSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    location: z.string().nullable(),
    region: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    imageUrl: z.string().nullable(),
    isFavorited: z.boolean(),
    favoritedAt: z.string(),
  })
  .openapi("CenterFavoriteWithDetails");

export const AnimalFavoriteWithDetailsSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    breed: z.string().nullable(),
    age: z.number(),
    isFemale: z.boolean(),
    status: z.enum([
      "보호중",
      "입양완료",
      "무지개다리",
      "임시보호중",
      "반환",
      "방사",
    ]),
    personality: z.string().nullable(),
    centerId: z.string(),
    centerName: z.string(),
    isFavorited: z.boolean(),
    favoritedAt: z.string(),
  })
  .openapi("AnimalFavoriteWithDetails");

// Error Response Schema
export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi("ErrorResponse");

// Center Favorite Routes
export const toggleCenterFavoriteRoute = createRoute({
  method: "post",
  path: "/favorites/centers/{centerId}/toggle",
  summary: "센터 찜 토글",
  description: "센터를 찜하거나 찜 해제합니다 (토글 방식)",
  tags: ["Favorites"],
  request: {
    params: z.object({
      centerId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "센터 찜 토글 성공",
      content: { "application/json": { schema: FavoriteToggleResponseSchema } },
    },
    401: {
      description: "인증 필요",
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

export const getCenterFavoritesRoute = createRoute({
  method: "get",
  path: "/favorites/centers",
  summary: "내가 찜한 센터 목록 조회",
  description: "현재 사용자가 찜한 센터 목록을 조회합니다",
  tags: ["Favorites"],
  request: {
    query: z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    200: {
      description: "찜한 센터 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            centers: z.array(CenterFavoriteWithDetailsSchema),
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
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Animal Favorite Routes
export const toggleAnimalFavoriteRoute = createRoute({
  method: "post",
  path: "/favorites/animals/{animalId}/toggle",
  summary: "동물 찜 토글",
  description: "동물을 찜하거나 찜 해제합니다 (토글 방식)",
  tags: ["Favorites"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "동물 찜 토글 성공",
      content: { "application/json": { schema: FavoriteToggleResponseSchema } },
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

export const getAnimalFavoritesRoute = createRoute({
  method: "get",
  path: "/favorites/animals",
  summary: "내가 찜한 동물 목록 조회",
  description: "현재 사용자가 찜한 동물 목록을 조회합니다",
  tags: ["Favorites"],
  request: {
    query: z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    200: {
      description: "찜한 동물 목록 조회 성공",
      content: {
        "application/json": {
          schema: z.object({
            animals: z.array(AnimalFavoriteWithDetailsSchema),
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
    500: {
      description: "서버 오류",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

// Check if item is favorited
export const checkCenterFavoriteRoute = createRoute({
  method: "get",
  path: "/favorites/centers/{centerId}/status",
  summary: "센터 찜 상태 확인",
  description: "특정 센터의 찜 상태를 확인합니다",
  tags: ["Favorites"],
  request: {
    params: z.object({
      centerId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "센터 찜 상태 확인 성공",
      content: {
        "application/json": {
          schema: z.object({
            isFavorited: z.boolean(),
            totalFavorites: z.number(),
          }),
        },
      },
    },
    401: {
      description: "인증 필요",
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

export const checkAnimalFavoriteRoute = createRoute({
  method: "get",
  path: "/favorites/animals/{animalId}/status",
  summary: "동물 찜 상태 확인",
  description: "특정 동물의 찜 상태를 확인합니다",
  tags: ["Favorites"],
  request: {
    params: z.object({
      animalId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "동물 찜 상태 확인 성공",
      content: {
        "application/json": {
          schema: z.object({
            isFavorited: z.boolean(),
            totalFavorites: z.number(),
          }),
        },
      },
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
