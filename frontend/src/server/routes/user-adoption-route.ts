import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import {
  adoptions,
  adoptionQuestionResponses,
  adoptionContracts,
  adoptionMonitoring,
} from "@/db/schema/adoptions";
import { animals, animalImages } from "@/db/schema/animals";
import { centers } from "@/db/schema/centers";
import { posts } from "@/db/schema/posts";
import { adoptionQuestions } from "@/db/schema/adoptions";
import { user } from "@/db/schema/auth";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  getUserAdoptionsRoute,
  getUserAdoptionDetailRoute,
} from "@/server/openapi/routes/user-adoption";
import {
  validatePaginationParams,
  createPaginationResult,
} from "@/lib/paginate";

const app = new OpenAPIHono<AppBindings>();

// GET /users/{userId}/adoption - 사용자 입양 신청 목록 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getUserAdoptionsRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const { userId } = c.req.valid("param");
    const query = c.req.valid("query");

    // 권한 체크: 본인 또는 관리자만 조회 가능
    if (
      currentUser.id !== userId &&
      currentUser.userType !== "센터관리자" &&
      currentUser.userType !== "최고관리자"
    ) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    const db = getDB(c);

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });

    // 필터 조건 생성
    const whereConditions: SQL<unknown>[] = [eq(adoptions.userId, userId)];

    if (query.status) {
      whereConditions.push(eq(adoptions.status, query.status));
    }

    // 입양 신청 목록 조회 (동물과 센터 정보 포함)
    const adoptionsList = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .leftJoin(centers, eq(animals.centerId, centers.id))
      .leftJoin(animalImages, eq(animals.id, animalImages.animalId))
      .leftJoin(user, eq(adoptions.userId, user.id))
      .where(and(...whereConditions))
      .orderBy(desc(adoptions.createdAt))
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    const totalResult = await db
      .select()
      .from(adoptions)
      .where(and(...whereConditions));

    const total = totalResult.length;

    // 응답 데이터 변환
    const adoptionsResponse = adoptionsList.map((item) => {
      const adoption = item.adoptions;
      const animal = item.animals;
      const center = item.centers;
      const animalImage = item.animal_images;
      const userInfo = item.user;

      return {
        id: adoption.id,
        userId: adoption.userId,
        userName: userInfo?.name || null,
        userNickname: userInfo?.nickname || null,
        animalId: adoption.animalId,
        animalName: animal?.name || "알 수 없는 동물",
        animalImage: animalImage?.imageUrl || null,
        animalIsFemale: animal?.isFemale || false,
        animalStatus: animal?.status || "보호중",
        centerId: animal?.centerId || "",
        centerName: center?.name || "알 수 없는 센터",
        status: adoption.status,
        notes: adoption.notes || null,
        centerNotes: adoption.centerNotes || null,
        monitoringAgreement: adoption.monitoringAgreement,
        guidelinesAgreement: adoption.guidelinesAgreement,
        meetingScheduledAt: adoption.meetingScheduledAt
          ? new Date(adoption.meetingScheduledAt).toISOString()
          : null,
        contractSentAt: adoption.contractSentAt
          ? new Date(adoption.contractSentAt).toISOString()
          : null,
        adoptionCompletedAt: adoption.adoptionCompletedAt
          ? new Date(adoption.adoptionCompletedAt).toISOString()
          : null,
        monitoringStartedAt: adoption.monitoringStartedAt
          ? new Date(adoption.monitoringStartedAt).toISOString()
          : null,
        monitoringNextCheckAt: adoption.monitoringNextCheckAt
          ? new Date(adoption.monitoringNextCheckAt).toISOString()
          : null,
        monitoringStatus: adoption.monitoringStatus || null,
        createdAt: new Date(adoption.createdAt).toISOString(),
        updatedAt: new Date(adoption.updatedAt).toISOString(),
      };
    });

    // 페이지네이션 결과 생성
    const result = createPaginationResult(
      adoptionsResponse,
      total,
      page,
      limit
    );

    return c.json({
      adoptions: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error) {
    console.error("사용자 입양 신청 목록 조회 오류:", error);
    return c.json({ error: "입양 신청 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /users/{userId}/adoption/{adoptionId} - 사용자 입양 신청 상세 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getUserAdoptionDetailRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const { userId, adoptionId } = c.req.valid("param");

    // 권한 체크: 본인 또는 관리자만 조회 가능
    if (
      currentUser.id !== userId &&
      currentUser.userType !== "센터관리자" &&
      currentUser.userType !== "최고관리자"
    ) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    const db = getDB(c);

    // 입양 신청 상세 정보 조회
    const adoptionResult = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .leftJoin(centers, eq(animals.centerId, centers.id))
      .leftJoin(animalImages, eq(animals.id, animalImages.animalId))
      .leftJoin(user, eq(adoptions.userId, user.id))
      .where(and(eq(adoptions.id, adoptionId), eq(adoptions.userId, userId)))
      .limit(1);

    if (adoptionResult.length === 0) {
      return c.json({ error: "입양 신청을 찾을 수 없습니다" }, 404);
    }

    const adoption = adoptionResult[0].adoptions;
    const animal = adoptionResult[0].animals;
    const center = adoptionResult[0].centers;
    const animalImage = adoptionResult[0].animal_images;
    const userInfo = adoptionResult[0].user;

    // 질문 응답 조회
    const questionResponses = await db
      .select()
      .from(adoptionQuestionResponses)
      .leftJoin(
        adoptionQuestions,
        eq(adoptionQuestionResponses.questionId, adoptionQuestions.id)
      )
      .where(eq(adoptionQuestionResponses.adoptionId, adoptionId));

    // 계약서 정보 조회
    const contractResult = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.adoptionId, adoptionId))
      .limit(1);

    const contract = contractResult.length > 0 ? contractResult[0] : null;

    // 모니터링 포스트 조회
    const monitoringPosts = await db
      .select()
      .from(adoptionMonitoring)
      .leftJoin(posts, eq(adoptionMonitoring.postId, posts.id))
      .where(eq(adoptionMonitoring.adoptionId, adoptionId));

    // 응답 데이터 구성
    const responseData = {
      adoption: {
        id: adoption.id,
        userId: adoption.userId,
        animalId: adoption.animalId,
        animalName: animal?.name || "알 수 없는 동물",
        animalImage: animalImage?.imageUrl || null,
        animalBreed: animal?.breed || null,
        animalAge: animal?.age || null,
        animalGender: animal?.isFemale ? "암컷" : "수컷",
        foundLocation: animal?.foundLocation || null,
        centerId: animal?.centerId || "",
        centerName: center?.name || "알 수 없는 센터",
        centerLocation: center?.location || null,
        status: adoption.status,
        notes: adoption.notes || null,
        centerNotes: adoption.centerNotes || null,
        monitoringAgreement: adoption.monitoringAgreement,
        guidelinesAgreement: adoption.guidelinesAgreement,
        meetingScheduledAt: adoption.meetingScheduledAt
          ? new Date(adoption.meetingScheduledAt).toISOString()
          : null,
        contractSentAt: adoption.contractSentAt
          ? new Date(adoption.contractSentAt).toISOString()
          : null,
        adoptionCompletedAt: adoption.adoptionCompletedAt
          ? new Date(adoption.adoptionCompletedAt).toISOString()
          : null,
        monitoringStartedAt: adoption.monitoringStartedAt
          ? new Date(adoption.monitoringStartedAt).toISOString()
          : null,
        monitoringNextCheckAt: adoption.monitoringNextCheckAt
          ? new Date(adoption.monitoringNextCheckAt).toISOString()
          : null,
        monitoringEndDate: adoption.monitoringEndDate
          ? new Date(adoption.monitoringEndDate).toISOString()
          : null,
        monitoringStatus: adoption.monitoringStatus || null,
        monitoringCompletedChecks: adoption.monitoringCompletedChecks,
        monitoringTotalChecks: adoption.monitoringTotalChecks,
        createdAt: new Date(adoption.createdAt).toISOString(),
        updatedAt: new Date(adoption.updatedAt).toISOString(),
      },
      questionResponses: questionResponses.map((item) => ({
        id: item.adoption_question_responses.id,
        questionId: item.adoption_question_responses.questionId,
        questionContent: item.adoption_questions?.content || "",
        answer: item.adoption_question_responses.answer,
        createdAt: new Date(
          item.adoption_question_responses.createdAt
        ).toISOString(),
      })),
      contract: contract
        ? {
            id: contract.id,
            templateId: contract.templateId,
            contractContent: contract.contractContent,
            guidelinesContent: contract.guidelinesContent,
            userSignatureUrl: contract.userSignatureUrl,
            userSignedAt: contract.userSignedAt
              ? new Date(contract.userSignedAt).toISOString()
              : null,
            centerSignatureUrl: contract.centerSignatureUrl,
            centerSignedAt: contract.centerSignedAt
              ? new Date(contract.centerSignedAt).toISOString()
              : null,
            status: contract.status,
            createdAt: new Date(contract.createdAt).toISOString(),
            updatedAt: new Date(contract.updatedAt).toISOString(),
          }
        : null,
      monitoringPosts: monitoringPosts.map((item) => ({
        id: item.adoption_monitoring.id,
        postId: item.adoption_monitoring.postId,
        postTitle: item.posts?.title || null,
        postContent: item.posts?.content || null,
        createdAt: new Date(item.adoption_monitoring.createdAt).toISOString(),
      })),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("사용자 입양 신청 상세 조회 오류:", error);
    return c.json({ error: "입양 신청 상세 조회 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
