import { createRoute, z } from "@hono/zod-openapi";

// 피드백 제출 스키마
const FeedbackSubmitSchema = z.object({
  type: z.enum(["버그신고", "기능요청", "불편사항", "문의사항", "기타"]),
  content: z.string().min(1, "내용을 입력해주세요"),
  email: z.string().email().optional(),
  userAgent: z.string().optional(),
  deviceInfo: z.string().optional(),
  pageUrl: z.string().url().optional(),
});

// 피드백 응답 스키마
const FeedbackResponseSchema = z.object({
  message: z.string(),
  status: z.string(),
});

// 피드백 목록 응답 스키마
const FeedbackListResponseSchema = z.object({
  feedbacks: z.array(z.object({
    id: z.string(),
    userId: z.string().nullable(),
    email: z.string().nullable(),
    type: z.enum(["버그신고", "기능요청", "불편사항", "문의사항", "기타"]),
    content: z.string(),
    status: z.enum(["접수", "검토중", "처리중", "완료", "보류"]),
    priority: z.enum(["낮음", "보통", "높음", "긴급"]).nullable(),
    adminResponse: z.string().nullable(),
    adminId: z.string().nullable(),
    respondedAt: z.string().nullable(),
    userAgent: z.string().nullable(),
    ipAddress: z.string().nullable(),
    deviceInfo: z.string().nullable(),
    pageUrl: z.string().nullable(),
    attachments: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// 피드백 상세 응답 스키마
const FeedbackDetailResponseSchema = z.object({
  feedback: z.object({
    id: z.string(),
    userId: z.string().nullable(),
    email: z.string().nullable(),
    type: z.enum(["버그신고", "기능요청", "불편사항", "문의사항", "기타"]),
    content: z.string(),
    status: z.enum(["접수", "검토중", "처리중", "완료", "보류"]),
    priority: z.enum(["낮음", "보통", "높음", "긴급"]).nullable(),
    adminResponse: z.string().nullable(),
    adminId: z.string().nullable(),
    respondedAt: z.string().nullable(),
    userAgent: z.string().nullable(),
    ipAddress: z.string().nullable(),
    deviceInfo: z.string().nullable(),
    pageUrl: z.string().nullable(),
    attachments: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

// 관리자 답변 스키마
const AdminResponseSchema = z.object({
  response: z.string().min(1, "답변을 입력해주세요"),
  status: z.enum(["접수", "검토중", "처리중", "완료", "보류"]),
  priority: z.enum(["낮음", "보통", "높음", "긴급"]).optional(),
});

// 관리자 답변 응답 스키마
const AdminResponseResponseSchema = z.object({
  message: z.string(),
  feedbackId: z.string(),
});

// 피드백 통계 응답 스키마
const FeedbackStatsResponseSchema = z.object({
  total: z.number(),
  byStatus: z.array(z.object({
    status: z.string(),
    count: z.number(),
  })),
  byType: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })),
});

// 피드백 제출 라우트
export const submitFeedbackRoute = createRoute({
  method: "post",
  path: "/feedback",
  summary: "피드백 제출",
  description: "사용자가 피드백을 제출합니다",
  tags: ["Feedback"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: FeedbackSubmitSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: FeedbackResponseSchema,
        },
      },
      description: "피드백이 성공적으로 제출되었습니다",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "잘못된 요청",
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

// 내 피드백 목록 조회 라우트
export const getMyFeedbackRoute = createRoute({
  method: "get",
  path: "/feedback",
  summary: "내 피드백 목록 조회",
  description: "로그인한 사용자의 피드백 목록을 조회합니다",
  tags: ["Feedback"],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      status: z.enum(["접수", "검토중", "처리중", "완료", "보류"]).optional(),
      type: z.enum(["버그신고", "기능요청", "불편사항", "문의사항", "기타"]).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeedbackListResponseSchema,
        },
      },
      description: "피드백 목록이 성공적으로 조회되었습니다",
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

// 피드백 상세 조회 라우트
export const getFeedbackDetailRoute = createRoute({
  method: "get",
  path: "/feedback/{id}",
  summary: "피드백 상세 조회",
  description: "특정 피드백의 상세 정보를 조회합니다",
  tags: ["Feedback"],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeedbackDetailResponseSchema,
        },
      },
      description: "피드백 상세 정보가 성공적으로 조회되었습니다",
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
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "피드백을 찾을 수 없습니다",
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

// 관리자 피드백 목록 조회 라우트
export const getAdminFeedbackRoute = createRoute({
  method: "get",
  path: "/admin/feedback",
  summary: "관리자 피드백 목록 조회",
  description: "관리자가 모든 피드백 목록을 조회합니다",
  tags: ["Feedback", "Admin"],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      status: z.enum(["접수", "검토중", "처리중", "완료", "보류"]).optional(),
      type: z.enum(["버그신고", "기능요청", "불편사항", "문의사항", "기타"]).optional(),
      priority: z.enum(["낮음", "보통", "높음", "긴급"]).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeedbackListResponseSchema,
        },
      },
      description: "피드백 목록이 성공적으로 조회되었습니다",
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
      description: "관리자 권한이 필요합니다",
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

// 관리자 답변 라우트
export const adminResponseRoute = createRoute({
  method: "put",
  path: "/admin/feedback/{id}/response",
  summary: "관리자 피드백 답변",
  description: "관리자가 피드백에 답변합니다",
  tags: ["Feedback", "Admin"],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: AdminResponseSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AdminResponseResponseSchema,
        },
      },
      description: "피드백 답변이 성공적으로 저장되었습니다",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "잘못된 요청",
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
      description: "관리자 권한이 필요합니다",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "피드백을 찾을 수 없습니다",
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

// 피드백 통계 라우트
export const getFeedbackStatsRoute = createRoute({
  method: "get",
  path: "/admin/feedback/stats",
  summary: "피드백 통계 조회",
  description: "관리자가 피드백 통계를 조회합니다",
  tags: ["Feedback", "Admin"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: FeedbackStatsResponseSchema,
        },
      },
      description: "피드백 통계가 성공적으로 조회되었습니다",
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
      description: "관리자 권한이 필요합니다",
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
