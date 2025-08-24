import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { animals, animalImages } from "@/db/schema/animals";
import { centers, adoptionContractTemplates } from "@/db/schema/centers";
import {
  adoptions,
  adoptionQuestions,
  adoptionQuestionResponses,
  adoptionContracts,
} from "@/db/schema/adoptions";
import { userSettings, phoneVerificationTokens } from "@/db/schema/misc";
import { user } from "@/db/schema/auth";
import { eq, and, gt, desc, count } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import {
  getAdoptionPreCheckRoute,
  submitAdoptionApplicationRoute,
  sendPhoneVerificationRoute,
  verifyPhoneCodeRoute,
} from "@/server/openapi/routes/adoption";
import { signContractRoute } from "@/server/openapi/routes/center-adoption";
import { validatePaginationParams } from "@/lib/paginate";

const app = new OpenAPIHono<AppBindings>();

// 6자리 랜덤 토큰 생성 함수
function generateVerificationToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /adoption/phone/send-verification - 전화번호 인증코드 발송
// @ts-expect-error - OpenAPI type complexity
app.openapi(sendPhoneVerificationRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "일반사용자") {
      return c.json({ error: "일반사용자만 전화번호 인증이 가능합니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 1분 내에 발송된 인증번호가 있는지 확인 (스팸 방지)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentTokens = await db
      .select()
      .from(phoneVerificationTokens)
      .where(
        and(
          eq(phoneVerificationTokens.userId, currentUser.id),
          gt(phoneVerificationTokens.createdAt, oneMinuteAgo)
        )
      )
      .limit(1);

    if (recentTokens.length > 0) {
      return c.json({ error: "1분 후에 다시 시도해주세요" }, 429);
    }

    // 6자리 랜덤 토큰 생성
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

    // 토큰 저장
    await db.insert(phoneVerificationTokens).values({
      userId: currentUser.id,
      phoneNumber: body.phoneNumber,
      token: verificationToken,
      expiresAt,
    });

    // TODO: 실제로는 SMS API를 통해 인증번호를 발송해야 함
    // 개발 환경에서는 콘솔에 출력
    console.log(
      `📱 [인증번호] ${body.phoneNumber}로 발송: ${verificationToken}`
    );

    return c.json({
      success: true,
      message: "인증번호가 발송되었습니다. 5분 내에 입력해주세요.",
    });
  } catch (error) {
    console.error("Send phone verification error:", error);
    return c.json({ error: "인증번호 발송 중 오류가 발생했습니다" }, 500);
  }
});

// POST /adoption/phone/verify - 전화번호 인증코드 확인
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(verifyPhoneCodeRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "일반사용자") {
      return c.json({ error: "일반사용자만 전화번호 인증이 가능합니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 유효한 토큰 조회
    const validTokens = await db
      .select()
      .from(phoneVerificationTokens)
      .where(
        and(
          eq(phoneVerificationTokens.userId, currentUser.id),
          eq(phoneVerificationTokens.phoneNumber, body.phoneNumber),
          eq(phoneVerificationTokens.token, body.verificationCode),
          eq(phoneVerificationTokens.isUsed, false),
          gt(phoneVerificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (validTokens.length === 0) {
      return c.json(
        { error: "인증번호가 일치하지 않거나 만료되었습니다" },
        400
      );
    }

    // 토큰을 사용됨으로 표시
    await db
      .update(phoneVerificationTokens)
      .set({ isUsed: true })
      .where(eq(phoneVerificationTokens.id, validTokens[0].id));

    // 사용자의 전화번호 인증 상태 업데이트
    await db
      .update(user)
      .set({
        phoneNumber: body.phoneNumber,
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
      })
      .where(eq(user.id, currentUser.id));

    return c.json({
      success: true,
      message: "전화번호 인증이 완료되었습니다.",
      isVerified: true,
    });
  } catch (error) {
    console.error("Verify phone code error:", error);
    return c.json({ error: "전화번호 인증 중 오류가 발생했습니다" }, 500);
  }
});

// GET /adoption/pre-check/{animalId} - 입양 신청 사전 확인
// @ts-expect-error - OpenAPI type complexity
app.openapi(getAdoptionPreCheckRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "일반사용자") {
      return c.json({ error: "일반사용자만 입양 신청이 가능합니다" }, 403);
    }

    const { animalId } = c.req.valid("param");
    const db = getDB(c);

    // 동물 정보 조회 (센터 정보와 함께)
    const animalResult = await db
      .select()
      .from(animals)
      .leftJoin(centers, eq(animals.centerId, centers.id))
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animalResult.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    const animal = animalResult[0].animals;
    const center = animalResult[0].centers;

    if (!center) {
      return c.json({ error: "센터 정보를 찾을 수 없습니다" }, 404);
    }

    // 입양 가능한 상태인지 확인
    const canApply =
      animal.status === "보호중" || animal.status === "임시보호중";

    // 이미 입양 신청을 했는지 확인
    const existingApplicationResult = await db
      .select()
      .from(adoptions)
      .where(
        and(
          eq(adoptions.userId, currentUser.id),
          eq(adoptions.animalId, animalId)
        )
      )
      .limit(1);

    // 취소되지 않은 신청이 있는지 확인
    const existingApplication =
      existingApplicationResult.length > 0 &&
      existingApplicationResult[0].status !== "취소";

    // 현재 사용자 정보 조회 (전화번호 인증 상태 포함)
    const currentUserData = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    const isPhoneVerified = currentUserData[0]?.isPhoneVerified || false;

    // 사용자 설정 정보 조회 (전화번호가 인증된 경우에만)
    let userSettingsData = null;
    let needsUserSettings = true;

    if (isPhoneVerified) {
      const userSettingsResult = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, currentUser.id))
        .limit(1);

      if (userSettingsResult.length > 0) {
        const settings = userSettingsResult[0];
        userSettingsData = {
          phone: settings.phone || currentUserData[0]?.phoneNumber || undefined,
          phoneVerification: true,
          name: settings.name || undefined,
          birth: settings.birth || undefined,
          address: settings.address || undefined,
          addressIsPublic: settings.addressIsPublic,
        };

        // 필수 정보가 모두 있는지 확인
        needsUserSettings =
          !settings.name || !settings.birth || !settings.address;
      } else {
        // userSettings가 없지만 전화번호는 인증됨
        userSettingsData = {
          phone: currentUserData[0]?.phoneNumber || undefined,
          phoneVerification: true,
          name: undefined,
          birth: undefined,
          address: undefined,
          addressIsPublic: false,
        };
        needsUserSettings = true;
      }
    }

    // 센터의 입양 질문들 조회
    const questionsResult = await db
      .select()
      .from(adoptionQuestions)
      .where(
        and(
          eq(adoptionQuestions.centerId, center.id),
          eq(adoptionQuestions.isActive, true)
        )
      )
      .orderBy(adoptionQuestions.sequence);

    // 센터의 계약서 템플릿 조회
    const contractTemplateResult = await db
      .select()
      .from(adoptionContractTemplates)
      .where(
        and(
          eq(adoptionContractTemplates.centerId, center.id),
          eq(adoptionContractTemplates.isActive, true)
        )
      )
      .limit(1);

    const responseData = {
      canApply: canApply && !existingApplication,
      isPhoneVerified,
      needsUserSettings,
      animal: {
        id: animal.id,
        name: animal.name,
        status: animal.status,
        centerId: animal.centerId,
        centerName: center.name,
      },
      userSettings: userSettingsData || undefined,
      adoptionQuestions: questionsResult.map((q) => ({
        id: q.id,
        content: q.content,
        sequence: q.sequence,
      })),
      centerInfo: {
        hasMonitoring: center.hasMonitoring,
        monitoringDescription: center.monitoringDescription || undefined,
        adoptionGuidelines: center.adoptionGuidelines || undefined,
        adoptionPrice: center.adoptionPrice,
      },
      contractTemplate:
        contractTemplateResult.length > 0
          ? {
              id: contractTemplateResult[0].id,
              title: contractTemplateResult[0].title,
              content: contractTemplateResult[0].content,
            }
          : undefined,
      existingApplication,
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Get adoption pre-check error:", error);
    return c.json({ error: "입양 신청 사전 확인 중 오류가 발생했습니다" }, 500);
  }
});

// POST /adoption/contract/sign - 계약서 서명 (사용자용)
// @ts-expect-error - OpenAPI type complexity
app.openapi(signContractRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "일반사용자") {
      return c.json({ error: "일반사용자만 계약서 서명이 가능합니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 계약서 조회 및 권한 확인
    const contractResult = await db
      .select()
      .from(adoptionContracts)
      .leftJoin(adoptions, eq(adoptionContracts.adoptionId, adoptions.id))
      .where(
        and(
          eq(adoptionContracts.id, body.contractId),
          eq(adoptions.userId, currentUser.id),
          eq(adoptionContracts.status, "대기중")
        )
      )
      .limit(1);

    if (contractResult.length === 0) {
      return c.json({ error: "서명 가능한 계약서를 찾을 수 없습니다" }, 404);
    }

    const contract = contractResult[0].adoption_contracts;
    const adoption = contractResult[0].adoptions;

    if (!contract || !adoption) {
      return c.json(
        { error: "계약서 또는 입양 신청 정보를 찾을 수 없습니다" },
        404
      );
    }

    // 계약서에 사용자 서명 저장
    await db
      .update(adoptionContracts)
      .set({
        userSignatureUrl: body.signatureData, // Base64 서명 데이터
        userSignedAt: new Date(),
        status: "사용자서명완료",
        updatedAt: new Date(),
      })
      .where(eq(adoptionContracts.id, body.contractId));

    // 입양 신청 상태를 "입양완료"로 변경
    await db
      .update(adoptions)
      .set({
        status: "입양완료",
        adoptionCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adoptions.id, adoption.id));

    return c.json({
      message: "계약서 서명이 완료되었습니다. 입양이 완료되었습니다!",
      adoptionStatus: "입양완료",
    });
  } catch (error) {
    console.error("Sign contract error:", error);
    return c.json({ error: "계약서 서명 중 오류가 발생했습니다" }, 500);
  }
});

// POST /adoption/apply - 입양 신청 제출 (contractAgreement 제거)
app.openapi(submitAdoptionApplicationRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "일반사용자") {
      return c.json({ error: "일반사용자만 입양 신청이 가능합니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 현재 사용자의 전화번호 인증 상태 확인
    const currentUserData = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    const isPhoneVerified = currentUserData[0]?.isPhoneVerified || false;

    if (!isPhoneVerified) {
      return c.json({ error: "전화번호 인증이 필요합니다" }, 403);
    }

    // 동물 정보 조회
    const animalResult = await db
      .select()
      .from(animals)
      .leftJoin(centers, eq(animals.centerId, centers.id))
      .where(eq(animals.id, body.animalId))
      .limit(1);

    if (animalResult.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    const animal = animalResult[0].animals;
    const center = animalResult[0].centers;

    if (!center) {
      return c.json({ error: "센터 정보를 찾을 수 없습니다" }, 404);
    }

    // 입양 가능한 상태인지 확인
    if (animal.status !== "보호중" && animal.status !== "임시보호중") {
      return c.json({ error: "현재 입양 신청이 불가능한 동물입니다" }, 403);
    }

    // 이미 입양 신청을 했는지 확인 (취소되지 않은 신청)
    const existingApplicationResult = await db
      .select()
      .from(adoptions)
      .where(
        and(
          eq(adoptions.userId, currentUser.id),
          eq(adoptions.animalId, body.animalId)
        )
      )
      .limit(1);

    if (
      existingApplicationResult.length > 0 &&
      existingApplicationResult[0].status !== "취소"
    ) {
      return c.json(
        { error: "이미 해당 동물에 대한 입양 신청을 하셨습니다" },
        403
      );
    }

    // 사용자 설정 저장 또는 업데이트 (필요한 경우만)
    if (body.userSettings) {
      const existingUserSettings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, currentUser.id))
        .limit(1);

      if (existingUserSettings.length > 0) {
        // 기존 설정 업데이트
        await db
          .update(userSettings)
          .set({
            phone: body.userSettings.phone,
            phoneVerification: body.userSettings.phoneVerification,
            name: body.userSettings.name,
            birth: body.userSettings.birth,
            address: body.userSettings.address,
            addressIsPublic: body.userSettings.addressIsPublic,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, currentUser.id));
      } else {
        // 새로운 설정 생성
        await db.insert(userSettings).values({
          userId: currentUser.id,
          phone: body.userSettings.phone,
          phoneVerification: body.userSettings.phoneVerification,
          name: body.userSettings.name,
          birth: body.userSettings.birth,
          address: body.userSettings.address,
          addressIsPublic: body.userSettings.addressIsPublic,
        });
      }
    }

    // 입양 신청 생성 (contractAgreement 제거)
    const adoptionResult = await db
      .insert(adoptions)
      .values({
        userId: currentUser.id,
        animalId: body.animalId,
        notes: body.notes,
        monitoringAgreement: body.monitoringAgreement,
        guidelinesAgreement: body.guidelinesAgreement,
      })
      .returning();

    const createdAdoption = adoptionResult[0];

    // 질문 응답 저장
    if (body.questionResponses.length > 0) {
      const questionResponseValues = body.questionResponses.map((response) => ({
        adoptionId: createdAdoption.id,
        questionId: response.questionId,
        answer: response.answer,
      }));

      await db.insert(adoptionQuestionResponses).values(questionResponseValues);
    }

    // 응답 데이터 생성
    const responseData = {
      id: createdAdoption.id,
      animalId: createdAdoption.animalId,
      animalName: animal.name,
      centerName: center.name,
      status: createdAdoption.status,
      notes: createdAdoption.notes || undefined,
      createdAt: new Date(createdAdoption.createdAt).toISOString(),
      updatedAt: new Date(createdAdoption.updatedAt).toISOString(),
    };

    // 센터 관리자들에게 입양 신청 알림 전송
    try {
      const { NotificationService } = await import(
        "@/lib/notification-service"
      );
      await NotificationService.sendAdoptionNotification(
        center.id,
        animal.name,
        currentUser.nickname || currentUser.name || "사용자",
        c
      );
    } catch (error) {
      console.error("알림 전송 실패:", error);
    }

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Submit adoption application error:", error);
    return c.json({ error: "입양 신청 제출 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
