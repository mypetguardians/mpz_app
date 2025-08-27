import { getDB } from "@/db";
import {
  adoptions,
  adoptionMonitoring,
  adoptionMonitoringChecks,
} from "@/db/schema/adoptions";
import { posts } from "@/db/schema/posts";
import { centers } from "@/db/schema/centers";
import { animals } from "@/db/schema/animals";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { Context } from "hono";
import type { AppBindings } from "@/types";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { DBSchema } from "@/db";

type DBDatabase =
  | DrizzleD1Database<DBSchema>
  | ReturnType<typeof import("@/db").getDB>;

/**
 * 입양 모니터링 체크 함수
 * Cloudflare Workers Cron Trigger에서 호출됨
 */
export async function checkAdoptionMonitoring(env: Record<string, unknown>) {
  try {
    console.log("🔍 Starting adoption monitoring check...");

    // 데이터베이스 인스턴스 생성
    const db = getDB({ env } as Context<AppBindings>);
    const today = new Date();

    // 오늘 체크해야 할 입양들 조회
    // monitoringNextCheckAt이 오늘 이전이거나 오늘인 모니터링 상태의 입양들
    const adoptionsToCheck = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .leftJoin(centers, eq(animals.centerId, centers.id)) // 센터 정보도 함께
      .where(
        and(
          eq(adoptions.status, "모니터링"),
          lte(adoptions.monitoringNextCheckAt, today)
        )
      );

    console.log(`📊 Found ${adoptionsToCheck.length} adoptions to check`);

    let checksProcessed = 0;
    let checksWithIssues = 0;

    for (const adoptionRecord of adoptionsToCheck) {
      const adoption = adoptionRecord.adoptions;
      const center = adoptionRecord.centers;

      if (!center) {
        console.warn(`⚠️ Center not found for adoption ${adoption.id}`);
        continue;
      }

      try {
        const checkResult = await performMonitoringCheck(db, adoption, center);
        checksProcessed++;

        if (checkResult.status !== "정상") {
          checksWithIssues++;
        }

        console.log(
          `✅ Processed adoption ${adoption.id}: ${checkResult.status} (${checkResult.postsFound} posts) - Check ${checkResult.checkSequence}/${checkResult.totalChecks}`
        );
      } catch (error) {
        console.error(`❌ Error checking adoption ${adoption.id}:`, error);
      }
    }

    console.log(
      `🎯 Monitoring check completed: ${checksProcessed} processed, ${checksWithIssues} with issues`
    );

    return {
      success: true,
      checked: checksProcessed,
      issues: checksWithIssues,
      timestamp: today.toISOString(),
    };
  } catch (error) {
    console.error("💥 Fatal error in adoption monitoring check:", error);
    throw error;
  }
}

/**
 * 개별 입양에 대한 모니터링 체크 수행
 */
async function performMonitoringCheck(
  db: DBDatabase,
  adoption: typeof adoptions.$inferSelect,
  center: typeof centers.$inferSelect
) {
  const checkDate = new Date();
  const monitoringPeriodMonths = center.monitoringPeriodMonths || 3;
  const monitoringIntervalDays = center.monitoringIntervalDays || 14;

  // 총 체크 횟수 계산 (3개월 = 약 90일 / 14일 간격 = 6-7회)
  const totalDaysInPeriod = monitoringPeriodMonths * 30; // 대략적 일수
  const totalChecks = Math.ceil(totalDaysInPeriod / monitoringIntervalDays);

  // 이전 체크 기록 조회 (최신순)
  const previousChecks = await db
    .select()
    .from(adoptionMonitoringChecks)
    .where(eq(adoptionMonitoringChecks.adoptionId, adoption.id))
    .orderBy(sql`${adoptionMonitoringChecks.checkSequence} DESC`)
    .limit(1);

  // 현재 체크 순서 결정
  const currentCheckSequence =
    previousChecks.length > 0 ? previousChecks[0].checkSequence + 1 : 1;

  // 체크 대상 기간 설정
  let periodStart: Date;
  let periodEnd: Date;
  let expectedCheckDate: Date;

  if (previousChecks.length > 0) {
    // 이전 체크가 있는 경우: 이전 체크의 periodEnd부터 지금까지
    const prevPeriodEnd = previousChecks[0].periodEnd;
    if (!prevPeriodEnd) {
      throw new Error(
        `Previous check ${previousChecks[0].id} has no periodEnd`
      );
    }
    periodStart = new Date(prevPeriodEnd);
    periodEnd = new Date(checkDate);

    const prevNextCheck = previousChecks[0].nextCheckDate;
    if (!prevNextCheck) {
      throw new Error(
        `Previous check ${previousChecks[0].id} has no nextCheckDate`
      );
    }
    expectedCheckDate = new Date(prevNextCheck);
  } else {
    // 첫 번째 체크: 입양완료일부터 첫 번째 체크 기간까지
    if (!adoption.adoptionCompletedAt) {
      throw new Error(`Adoption ${adoption.id} has no completion date`);
    }
    periodStart = new Date(adoption.adoptionCompletedAt);
    expectedCheckDate = new Date(periodStart);
    expectedCheckDate.setDate(
      expectedCheckDate.getDate() + monitoringIntervalDays
    );
    periodEnd = new Date(expectedCheckDate);
  }

  // 해당 기간 동안 사용자가 올린 모니터링 포스트 조회
  const monitoringPosts = await db
    .select()
    .from(adoptionMonitoring)
    .leftJoin(posts, eq(adoptionMonitoring.postId, posts.id))
    .where(
      and(
        eq(adoptionMonitoring.adoptionId, adoption.id),
        gte(posts.createdAt, periodStart),
        lte(posts.createdAt, periodEnd)
      )
    );

  const postsFound = monitoringPosts.length;

  // 마감일까지 남은 일수 계산
  const daysUntilDeadline = Math.floor(
    (expectedCheckDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 상태 판정 로직
  let status: "정상" | "지연" | "미제출";
  let delayDays = 0;

  if (postsFound > 0) {
    status = "정상";
  } else if (daysUntilDeadline >= 0) {
    // 마감일 전이면 아직 지연 아님
    status = "정상"; // 아직 마감일이 지나지 않음
  } else if (daysUntilDeadline >= -7) {
    // 1일~7일 지연
    status = "지연";
    delayDays = -daysUntilDeadline; // 음수를 양수로 변환
  } else {
    // 7일 초과 지연
    status = "미제출";
    delayDays = -daysUntilDeadline;
  }

  // 다음 체크 일자 설정
  const nextCheckDate = new Date(expectedCheckDate);
  nextCheckDate.setDate(nextCheckDate.getDate() + monitoringIntervalDays);

  // 모니터링 전체 종료일 계산 (첫 체크 시에만)
  let monitoringEndDate = adoption.monitoringEndDate;
  if (!monitoringEndDate && adoption.adoptionCompletedAt) {
    const endDate = new Date(adoption.adoptionCompletedAt);
    endDate.setMonth(endDate.getMonth() + monitoringPeriodMonths);
    monitoringEndDate = endDate;
  }

  // 모니터링 체크 기록 저장
  await db.insert(adoptionMonitoringChecks).values({
    adoptionId: adoption.id,
    checkSequence: currentCheckSequence,
    checkDate,
    expectedCheckDate,
    periodStart,
    periodEnd,
    postsFound,
    status,
    delayDays,
    daysUntilDeadline,
    nextCheckDate: currentCheckSequence < totalChecks ? nextCheckDate : null,
    notes:
      status === "정상"
        ? null
        : `${delayDays}일 ${status === "지연" ? "지연" : "미제출"}`,
  });

  // 모니터링 전반적 상태 결정
  let overallMonitoringStatus: "진행중" | "완료" | "지연" = "진행중";
  if (currentCheckSequence >= totalChecks) {
    overallMonitoringStatus = "완료";
  } else if (status === "미제출") {
    overallMonitoringStatus = "지연";
  }

  // 입양 레코드 업데이트
  const updateData: Partial<typeof adoptions.$inferInsert> = {
    monitoringCompletedChecks: currentCheckSequence,
    monitoringTotalChecks: totalChecks,
    monitoringStatus: overallMonitoringStatus,
    updatedAt: checkDate,
  };

  if (monitoringEndDate && !adoption.monitoringEndDate) {
    updateData.monitoringEndDate = monitoringEndDate;
  }

  if (currentCheckSequence < totalChecks) {
    updateData.monitoringNextCheckAt = nextCheckDate;
  } else {
    updateData.monitoringNextCheckAt = null; // 모니터링 완료
  }

  await db
    .update(adoptions)
    .set(updateData)
    .where(eq(adoptions.id, adoption.id));

  // 지연 상태일 때 사용자에게 알림 전송
  if (status === "지연" || status === "미제출") {
    try {
      const { NotificationService } = await import(
        "@/lib/notification-service"
      );
      await NotificationService.sendMonitoringDelayNotification(
        adoption.id,
        adoption.userId,
        delayDays
      );
    } catch (error) {
      console.error("모니터링 지연 알림 전송 실패:", error);
    }
  }

  return {
    adoptionId: adoption.id,
    checkSequence: currentCheckSequence,
    totalChecks,
    checkDate: checkDate.toISOString(),
    expectedCheckDate: expectedCheckDate.toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    postsFound,
    status,
    delayDays,
    daysUntilDeadline,
    nextCheckDate:
      currentCheckSequence < totalChecks ? nextCheckDate.toISOString() : null,
    monitoringStatus: overallMonitoringStatus,
  };
}

/**
 * 모니터링 포스트 등록 함수
 * 사용자가 포스트를 작성할 때 입양 모니터링과 연결하는 함수
 */
export async function linkPostToAdoptionMonitoring(
  db: DBDatabase,
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    // 해당 사용자의 모니터링 중인 입양 조회
    const activeAdoptions = await db
      .select()
      .from(adoptions)
      .where(
        and(eq(adoptions.userId, userId), eq(adoptions.status, "모니터링"))
      );

    if (activeAdoptions.length === 0) {
      return false; // 모니터링 중인 입양이 없음
    }

    // 각 입양에 대해 모니터링 포스트로 등록
    for (const adoption of activeAdoptions) {
      await db.insert(adoptionMonitoring).values({
        adoptionId: adoption.id,
        postId,
      });
    }

    console.log(
      `📝 Linked post ${postId} to ${activeAdoptions.length} adoption monitoring records`
    );
    return true;
  } catch (error) {
    console.error("Error linking post to adoption monitoring:", error);
    return false;
  }
}

/**
 * 특정 입양의 모니터링 상태 조회 (업데이트된 버전)
 */
export async function getAdoptionMonitoringStatus(
  db: DBDatabase,
  adoptionId: string
) {
  try {
    // 입양 정보 조회
    const adoption = await db
      .select()
      .from(adoptions)
      .leftJoin(animals, eq(adoptions.animalId, animals.id))
      .leftJoin(centers, eq(animals.centerId, centers.id))
      .where(eq(adoptions.id, adoptionId))
      .limit(1);

    if (adoption.length === 0) {
      throw new Error("Adoption not found");
    }

    const adoptionData = adoption[0].adoptions;
    const centerData = adoption[0].centers;

    // 최근 모니터링 체크 기록들 조회
    const recentChecks = await db
      .select()
      .from(adoptionMonitoringChecks)
      .where(eq(adoptionMonitoringChecks.adoptionId, adoptionId))
      .orderBy(sql`${adoptionMonitoringChecks.checkSequence} DESC`)
      .limit(10);

    // 전체 모니터링 포스트 수 조회
    const totalPosts = await db
      .select()
      .from(adoptionMonitoring)
      .where(eq(adoptionMonitoring.adoptionId, adoptionId));

    // 다음 모니터링 마감일까지 남은 일수 계산
    let daysUntilNextDeadline = null;
    let nextDeadline = null;

    if (adoptionData.monitoringNextCheckAt) {
      const nextCheck = new Date(adoptionData.monitoringNextCheckAt);
      nextDeadline = nextCheck.toISOString();
      daysUntilNextDeadline = Math.floor(
        (nextCheck.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // 전체 모니터링 기간 남은 일수 계산
    let daysUntilMonitoringEnd = null;
    if (adoptionData.monitoringEndDate) {
      const endDate = new Date(adoptionData.monitoringEndDate);
      daysUntilMonitoringEnd = Math.floor(
        (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      adoptionId,
      status: adoptionData.status,
      monitoringStatus: adoptionData.monitoringStatus,
      monitoringStartedAt: adoptionData.monitoringStartedAt,
      monitoringEndDate: adoptionData.monitoringEndDate,
      nextCheckDate: nextDeadline,
      daysUntilNextDeadline,
      daysUntilMonitoringEnd,
      completedChecks: adoptionData.monitoringCompletedChecks || 0,
      totalChecks: adoptionData.monitoringTotalChecks || 0,
      totalMonitoringPosts: totalPosts.length,
      monitoringProgress: {
        percentage:
          (adoptionData.monitoringTotalChecks || 0) > 0
            ? Math.round(
                ((adoptionData.monitoringCompletedChecks || 0) /
                  (adoptionData.monitoringTotalChecks || 0)) *
                  100
              )
            : 0,
        description: `${adoptionData.monitoringCompletedChecks || 0}/${
          adoptionData.monitoringTotalChecks || 0
        } 체크 완료`,
      },
      centerConfig: {
        monitoringPeriodMonths: centerData?.monitoringPeriodMonths || 3,
        monitoringIntervalDays: centerData?.monitoringIntervalDays || 14,
      },
      recentChecks: recentChecks.map(
        (check: typeof adoptionMonitoringChecks.$inferSelect) => ({
          checkSequence: check.checkSequence,
          checkDate: new Date(check.checkDate).toISOString(),
          expectedCheckDate: new Date(check.expectedCheckDate).toISOString(),
          period: {
            start: new Date(check.periodStart).toISOString(),
            end: new Date(check.periodEnd).toISOString(),
          },
          postsFound: check.postsFound,
          status: check.status,
          delayDays: check.delayDays,
          daysUntilDeadline: check.daysUntilDeadline,
          notes: check.notes,
        })
      ),
    };
  } catch (error) {
    console.error("Error getting adoption monitoring status:", error);
    throw error;
  }
}

/**
 * 입양 모니터링을 시작하는 함수 (입양완료 시 호출)
 */
export async function initializeAdoptionMonitoring(
  db: DBDatabase,
  adoptionId: string,
  centerId: string
) {
  try {
    const now = new Date();

    // 센터 설정 조회
    const center = await db
      .select()
      .from(centers)
      .where(eq(centers.id, centerId))
      .limit(1);

    if (center.length === 0) {
      throw new Error("Center not found");
    }

    const centerData = center[0];
    const monitoringPeriodMonths = centerData.monitoringPeriodMonths || 3;
    const monitoringIntervalDays = centerData.monitoringIntervalDays || 14;

    // 총 체크 횟수 계산
    const totalDaysInPeriod = monitoringPeriodMonths * 30;
    const totalChecks = Math.ceil(totalDaysInPeriod / monitoringIntervalDays);

    // 모니터링 종료일 계산
    const monitoringEndDate = new Date(now);
    monitoringEndDate.setMonth(
      monitoringEndDate.getMonth() + monitoringPeriodMonths
    );

    // 첫 번째 체크 일정
    const firstCheckDate = new Date(now);
    firstCheckDate.setDate(firstCheckDate.getDate() + monitoringIntervalDays);

    // 입양 레코드 업데이트
    await db
      .update(adoptions)
      .set({
        status: "모니터링",
        monitoringStartedAt: now,
        monitoringNextCheckAt: firstCheckDate,
        monitoringEndDate,
        monitoringCompletedChecks: 0,
        monitoringTotalChecks: totalChecks,
        monitoringStatus: "진행중",
        updatedAt: now,
      })
      .where(eq(adoptions.id, adoptionId));

    console.log(
      `🎯 Initialized monitoring for adoption ${adoptionId}: ${totalChecks} checks over ${monitoringPeriodMonths} months`
    );

    return {
      adoptionId,
      monitoringStartedAt: now.toISOString(),
      monitoringEndDate: monitoringEndDate.toISOString(),
      firstCheckDate: firstCheckDate.toISOString(),
      totalChecks,
      monitoringPeriodMonths,
      monitoringIntervalDays,
    };
  } catch (error) {
    console.error("Error initializing adoption monitoring:", error);
    throw error;
  }
}
