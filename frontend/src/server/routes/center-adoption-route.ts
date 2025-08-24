import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import type { Context } from "hono";
import { getDB } from "@/db";
import { animals } from "@/db/schema/animals";
import { centers, adoptionContractTemplates } from "@/db/schema/centers";
import {
  adoptions,
  adoptionQuestions,
  adoptionQuestionResponses,
  adoptionContracts,
} from "@/db/schema/adoptions";
import { userSettings } from "@/db/schema/misc";
import { user } from "@/db/schema/auth";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
} from "@/lib/paginate";
import {
  getCenterAdoptionsRoute,
  updateAdoptionStatusRoute,
  sendContractRoute,
  getMonitoringStatusRoute,
  runManualMonitoringCheckRoute,
} from "@/server/openapi/routes/center-adoption";
import {
  getAdoptionMonitoringStatus,
  checkAdoptionMonitoring,
  initializeAdoptionMonitoring,
} from "@/server/scheduler/adoption-monitoring";

const app = new OpenAPIHono<AppBindings>();

// Helper function to get user's center
async function getUserCenter(
  c: Context<AppBindings>,
  currentUser: typeof user.$inferSelect
) {
  const db = getDB(c);
  const userCenters = await db
    .select()
    .from(centers)
    .where(eq(centers.userId, currentUser.id))
    .limit(1);

  if (userCenters.length === 0) {
    return null;
  }
  return userCenters[0];
}

// Helper function to check if contact info should be visible
function shouldShowContactInfo(status: string): boolean {
  return ["미팅", "계약서작성", "입양완료", "모니터링"].includes(status);
}

// GET /center-admin/adoptions - 센터 입양 신청 목록 조회
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getCenterAdoptionsRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const query = c.req.valid("query");
    const db = getDB(c);

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // 필터 조건 생성
    const whereConditions: SQL<unknown>[] = [];

    // 내 센터의 동물들에 대한 입양 신청만 조회
    whereConditions.push(eq(animals.centerId, userCenter.id));

    // 상태 필터
    if (query.status) {
      whereConditions.push(eq(adoptions.status, query.status));
    }

    // 특정 동물 필터
    if (query.animalId) {
      whereConditions.push(eq(adoptions.animalId, query.animalId));
    }

    // 전체 개수 조회
    const totalResult = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .where(and(...whereConditions));

    const total = totalResult.length;

    // 입양 신청 목록 조회
    const adoptionsList = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .leftJoin(user, eq(adoptions.userId, user.id))
      .leftJoin(userSettings, eq(adoptions.userId, userSettings.userId))
      .where(and(...whereConditions))
      .orderBy(desc(adoptions.createdAt))
      .limit(limit)
      .offset(offset);

    // 각 입양 신청에 대한 질문 응답 조회
    const adoptionIds = adoptionsList.map((item) => item.adoptions.id);
    const responses =
      adoptionIds.length > 0
        ? await db
            .select()
            .from(adoptionQuestionResponses)
            .leftJoin(
              adoptionQuestions,
              eq(adoptionQuestionResponses.questionId, adoptionQuestions.id)
            )
            .where(
              and(
                eq(adoptionQuestions.centerId, userCenter.id)
                // adoptionId가 adoptionIds에 포함된 것들만
              )
            )
        : [];

    // 응답 데이터 변환
    const adoptionsResponse = adoptionsList.map((item) => {
      const adoption = item.adoptions;
      const animal = item.animals;
      const userInfo = item.user;
      const userSettingsInfo = item.user_settings;

      const showContactInfo = shouldShowContactInfo(adoption.status);

      // 해당 입양 신청의 질문 응답 필터링
      const adoptionResponses = responses.filter(
        (r) => r.adoption_question_responses?.adoptionId === adoption.id
      );

      return {
        id: adoption.id,
        userId: adoption.userId,
        animalId: adoption.animalId,
        animalName: animal?.name || "알 수 없는 동물",
        status: adoption.status,
        notes: adoption.notes || undefined,
        centerNotes: adoption.centerNotes || undefined,
        userInfo: {
          name: userSettingsInfo?.name || userInfo?.name || "정보 없음",
          phone: showContactInfo
            ? userSettingsInfo?.phone || userInfo?.phoneNumber
            : undefined,
          address: showContactInfo ? userSettingsInfo?.address : undefined,
          addressIsPublic: userSettingsInfo?.addressIsPublic || false,
        },
        questionResponses: adoptionResponses.map((r) => ({
          questionId: r.adoption_question_responses?.questionId || "",
          questionContent: r.adoption_questions?.content || "",
          answer: r.adoption_question_responses?.answer || "",
        })),
        agreements: {
          monitoring: adoption.monitoringAgreement,
          guidelines: adoption.guidelinesAgreement,
        },
        timeline: {
          appliedAt: new Date(adoption.createdAt).toISOString(),
          meetingScheduledAt: adoption.meetingScheduledAt
            ? new Date(adoption.meetingScheduledAt).toISOString()
            : undefined,
          contractSentAt: adoption.contractSentAt
            ? new Date(adoption.contractSentAt).toISOString()
            : undefined,
          adoptionCompletedAt: adoption.adoptionCompletedAt
            ? new Date(adoption.adoptionCompletedAt).toISOString()
            : undefined,
          monitoringStartedAt: adoption.monitoringStartedAt
            ? new Date(adoption.monitoringStartedAt).toISOString()
            : undefined,
          monitoringNextCheckAt: adoption.monitoringNextCheckAt
            ? new Date(adoption.monitoringNextCheckAt).toISOString()
            : undefined,
        },
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
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    });
  } catch (error) {
    console.error("Get center adoptions error:", error);
    return c.json({ error: "입양 신청 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /center-admin/adoptions/{adoptionId}/status - 입양 신청 상태 변경
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(updateAdoptionStatusRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const { adoptionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 입양 신청이 존재하고 내 센터의 것인지 확인
    const adoptionResult = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .where(
        and(eq(adoptions.id, adoptionId), eq(animals.centerId, userCenter.id))
      )
      .limit(1);

    if (adoptionResult.length === 0) {
      return c.json({ error: "입양 신청을 찾을 수 없습니다" }, 404);
    }

    const adoption = adoptionResult[0].adoptions;

    // 상태 변경 로직 검증
    const newStatus = body.status;
    const currentStatus = adoption.status;

    // 상태 변경 유효성 검사
    const validTransitions: Record<string, string[]> = {
      신청: ["미팅", "취소"],
      미팅: ["계약서작성", "취소"],
      계약서작성: ["취소"], // 입양완료는 사용자 서명 후 자동
      입양완료: ["모니터링", "취소"],
      모니터링: ["취소"],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return c.json(
        { error: `${currentStatus}에서 ${newStatus}로 변경할 수 없습니다` },
        400
      );
    }

    // 모니터링으로 변경하는 경우 센터에서 모니터링을 설정했는지 확인
    if (newStatus === "모니터링" && !userCenter.hasMonitoring) {
      return c.json({ error: "모니터링을 설정하지 않았어요." }, 400);
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof adoptions.$inferInsert> = {
      status: newStatus,
      centerNotes: body.centerNotes,
      updatedAt: new Date(),
    };

    // 상태별 특별 처리
    if (newStatus === "미팅" && body.meetingScheduledAt) {
      updateData.meetingScheduledAt = new Date(body.meetingScheduledAt);
    }

    if (newStatus === "입양완료") {
      updateData.adoptionCompletedAt = new Date();
    }

    if (newStatus === "모니터링") {
      // 모니터링 초기화 - 새로운 함수 사용
      try {
        const monitoringInit = await initializeAdoptionMonitoring(
          db,
          adoptionId,
          userCenter.id
        );
        console.log(
          `✅ Monitoring initialized for adoption ${adoptionId}:`,
          monitoringInit
        );

        // updateData에서 모니터링 관련 필드는 initializeAdoptionMonitoring에서 처리하므로 제거
        delete updateData.status; // status는 initializeAdoptionMonitoring에서 설정
      } catch (error) {
        console.error("Error initializing monitoring:", error);
        return c.json({ error: "모니터링 초기화 중 오류가 발생했습니다" }, 500);
      }
    }

    // DB 업데이트 (모니터링이 아닌 경우만)
    if (newStatus !== "모니터링") {
      await db
        .update(adoptions)
        .set(updateData)
        .where(eq(adoptions.id, adoptionId));
    } else {
      // 모니터링의 경우 centerNotes만 별도 업데이트
      if (body.centerNotes) {
        await db
          .update(adoptions)
          .set({
            centerNotes: body.centerNotes,
            updatedAt: new Date(),
          })
          .where(eq(adoptions.id, adoptionId));
      }
    }

    // 업데이트된 입양 신청 조회 및 응답
    const updatedAdoption = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .leftJoin(user, eq(adoptions.userId, user.id))
      .leftJoin(userSettings, eq(adoptions.userId, userSettings.userId))
      .where(eq(adoptions.id, adoptionId))
      .limit(1);

    if (updatedAdoption.length === 0) {
      return c.json({ error: "업데이트된 입양 신청을 찾을 수 없습니다" }, 500);
    }

    const result = updatedAdoption[0];
    const showContactInfo = shouldShowContactInfo(result.adoptions.status);

    const responseData = {
      id: result.adoptions.id,
      userId: result.adoptions.userId,
      animalId: result.adoptions.animalId,
      animalName: result.animals?.name || "알 수 없는 동물",
      status: result.adoptions.status,
      notes: result.adoptions.notes || undefined,
      centerNotes: result.adoptions.centerNotes || undefined,
      userInfo: {
        name: result.user_settings?.name || result.user?.name || "정보 없음",
        phone: showContactInfo
          ? result.user_settings?.phone || result.user?.phoneNumber
          : undefined,
        address: showContactInfo ? result.user_settings?.address : undefined,
        addressIsPublic: result.user_settings?.addressIsPublic || false,
      },
      questionResponses: [], // 간단 응답에서는 생략
      agreements: {
        monitoring: result.adoptions.monitoringAgreement,
        guidelines: result.adoptions.guidelinesAgreement,
      },
      timeline: {
        appliedAt: new Date(result.adoptions.createdAt).toISOString(),
        meetingScheduledAt: result.adoptions.meetingScheduledAt
          ? new Date(result.adoptions.meetingScheduledAt).toISOString()
          : undefined,
        contractSentAt: result.adoptions.contractSentAt
          ? new Date(result.adoptions.contractSentAt).toISOString()
          : undefined,
        adoptionCompletedAt: result.adoptions.adoptionCompletedAt
          ? new Date(result.adoptions.adoptionCompletedAt).toISOString()
          : undefined,
        monitoringStartedAt: result.adoptions.monitoringStartedAt
          ? new Date(result.adoptions.monitoringStartedAt).toISOString()
          : undefined,
        monitoringNextCheckAt: result.adoptions.monitoringNextCheckAt
          ? new Date(result.adoptions.monitoringNextCheckAt).toISOString()
          : undefined,
      },
      createdAt: new Date(result.adoptions.createdAt).toISOString(),
      updatedAt: new Date(result.adoptions.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update adoption status error:", error);
    return c.json({ error: "입양 신청 상태 변경 중 오류가 발생했습니다" }, 500);
  }
});

// POST /center-admin/adoptions/{adoptionId}/send-contract - 계약서 전송
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(sendContractRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const { adoptionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 입양 신청 확인 (계약서작성 상태여야 함)
    const adoptionResult = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .where(
        and(
          eq(adoptions.id, adoptionId),
          eq(animals.centerId, userCenter.id),
          eq(adoptions.status, "계약서작성")
        )
      )
      .limit(1);

    if (adoptionResult.length === 0) {
      return c.json(
        { error: "계약서 작성 단계의 입양 신청을 찾을 수 없습니다" },
        404
      );
    }

    // 계약서 템플릿 조회
    const template = await db
      .select()
      .from(adoptionContractTemplates)
      .where(eq(adoptionContractTemplates.id, body.templateId))
      .limit(1);

    if (template.length === 0) {
      return c.json({ error: "계약서 템플릿을 찾을 수 없습니다" }, 404);
    }

    // 계약서 내용 생성 (템플릿 + 커스텀 내용)
    const contractContent = body.customContent || template[0].content;

    // 계약서 생성
    const contractResult = await db
      .insert(adoptionContracts)
      .values({
        adoptionId,
        templateId: body.templateId,
        contractContent,
        guidelinesContent: userCenter.adoptionGuidelines,
        status: "대기중",
      })
      .returning();

    const createdContract = contractResult[0];

    // 입양 신청에 계약서 전송 시간 기록
    await db
      .update(adoptions)
      .set({
        contractSentAt: new Date(),
        centerNotes: body.centerNotes,
        updatedAt: new Date(),
      })
      .where(eq(adoptions.id, adoptionId));

    return c.json({
      message: "계약서가 성공적으로 전송되었습니다",
      contractId: createdContract.id,
    });
  } catch (error) {
    console.error("Send contract error:", error);
    return c.json({ error: "계약서 전송 중 오류가 발생했습니다" }, 500);
  }
});

// GET /center-admin/adoptions/{adoptionId}/monitoring-status - 모니터링 상태 조회
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getMonitoringStatusRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const { adoptionId } = c.req.valid("param");
    const db = getDB(c);

    // 입양 신청이 존재하고 내 센터의 것인지 확인
    const adoptionResult = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .where(
        and(eq(adoptions.id, adoptionId), eq(animals.centerId, userCenter.id))
      )
      .limit(1);

    if (adoptionResult.length === 0) {
      return c.json({ error: "입양 신청을 찾을 수 없습니다" }, 404);
    }

    // 모니터링 상태 조회
    const monitoringStatus = await getAdoptionMonitoringStatus(db, adoptionId);

    return c.json(monitoringStatus);
  } catch (error) {
    console.error("Get monitoring status error:", error);
    return c.json({ error: "모니터링 상태 조회 중 오류가 발생했습니다" }, 500);
  }
});

// POST /center-admin/monitoring/manual-check - 수동 모니터링 체크 실행
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(runManualMonitoringCheckRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "최고관리자") {
      return c.json({ error: "최고관리자만 접근할 수 있습니다" }, 403);
    }

    const env = c.env; // Cloudflare Workers environment
    const result = await checkAdoptionMonitoring(env);

    return c.json(result);
  } catch (error) {
    console.error("Manual monitoring check error:", error);
    return c.json({ error: "수동 모니터링 체크 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
