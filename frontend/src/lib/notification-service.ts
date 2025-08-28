import { getDB } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { user } from "@/db/schema/auth";
import { centers } from "@/db/schema/centers";
import { eq, and, SQL } from "drizzle-orm";
import { createFCMService } from "./fcm-utils";
import type { Context } from "hono";
import { AppBindings } from "@/types";

const fcm = createFCMService();

export class NotificationService {
  // 커뮤니티 알림
  static async sendCommunityNotification(
    userId: string,
    type: "comment" | "like" | "reply",
    postId: string,
    actorName: string,
    context?: Context<AppBindings>
  ) {
    const db = context ? getDB(context) : getDB({} as Context<AppBindings>);

    const notification = {
      id: crypto.randomUUID(),
      userId,
      type: "커뮤니티" as const,
      title: `${actorName}님이 ${
        type === "comment" ? "댓글" : type === "like" ? "좋아요" : "답글"
      }을 남겼습니다`,
      content: `게시글에 ${
        type === "comment" ? "댓글" : type === "like" ? "좋아요" : "답글"
      }이 추가되었습니다`,
      data: JSON.stringify({ postId, type, actorName }),
      isRead: false,
      createdAt: new Date(),
    };

    // DB에 저장
    await db.insert(notifications).values(notification);

    // FCM 푸시 전송
    try {
      await fcm.sendToUser(userId, notification.title, notification.content, {
        postId,
        type,
      });
    } catch (error) {
      console.error("FCM 전송 실패:", error);
    }
  }

  // 입양 신청 알림
  static async sendAdoptionNotification(
    centerId: string,
    animalName: string,
    userName: string,
    context?: Context<AppBindings>
  ) {
    const db = context ? getDB(context) : getDB({} as Context<AppBindings>);

    // 센터 관리자들 조회 (centers.userId로 조회)
    const centerAdmins = await db
      .select()
      .from(centers)
      .innerJoin(user, eq(centers.userId, user.id))
      .where(
        and(
          eq(centers.id, centerId),
          or(
            eq(user.userType, "센터관리자"),
            eq(user.userType, "센터최고관리자")
          )
        )
      );

    const adminIds = centerAdmins.map((admin) => admin.user.id);

    if (adminIds.length === 0) return;

    // 각 관리자에게 알림 전송
    for (const adminId of adminIds) {
      const notification = {
        id: crypto.randomUUID(),
        userId: adminId,
        type: "입양신청" as const,
        title: "새로운 입양 신청이 도착했습니다",
        content: `${userName}님이 ${animalName}에 대한 입양을 신청했습니다`,
        data: JSON.stringify({ animalName, userName, centerId }),
        isRead: false,
        createdAt: new Date(),
      };

      await db.insert(notifications).values(notification);
    }

    // FCM 푸시 전송 (일괄 전송)
    try {
      await fcm.sendToMultipleUsers(
        adminIds,
        "새로운 입양 신청",
        `${userName}님이 ${animalName}에 대한 입양을 신청했습니다`,
        { type: "adoption", animalName, userName }
      );
    } catch (error) {
      console.error("FCM 전송 실패:", error);
    }
  }

  // 모니터링 지연 알림
  static async sendMonitoringDelayNotification(
    adoptionId: string,
    userId: string,
    delayDays: number,
    context?: Context<AppBindings>
  ) {
    const db = context ? getDB(context) : getDB({} as Context<AppBindings>);

    const notification = {
      id: crypto.randomUUID(),
      userId,
      type: "모니터링" as const,
      title: "모니터링 지연 알림",
      content: `입양 후 모니터링이 ${delayDays}일 지연되었습니다. 포스트를 작성해주세요.`,
      data: JSON.stringify({ adoptionId, delayDays }),
      isRead: false,
      createdAt: new Date(),
    };

    await db.insert(notifications).values(notification);

    // FCM 푸시 전송
    try {
      await fcm.sendToUser(userId, notification.title, notification.content, {
        adoptionId: adoptionId,
        delayDays: delayDays.toString(),
      });
    } catch (error) {
      console.error("FCM 전송 실패:", error);
    }
  }

  // 임시보호 등록 알림
  static async sendFosterNotification(
    centerId: string,
    animalName: string,
    userName: string,
    context?: Context<AppBindings>
  ) {
    const db = context ? getDB(context) : getDB({} as Context<AppBindings>);

    // 센터 관리자들 조회 (centers.userId로 조회)
    const centerAdmins = await db
      .select()
      .from(centers)
      .innerJoin(user, eq(centers.userId, user.id))
      .where(
        and(
          eq(centers.id, centerId),
          or(
            eq(user.userType, "센터관리자"),
            eq(user.userType, "센터최고관리자")
          )
        )
      );

    const adminIds = centerAdmins.map((admin) => admin.user.id);

    if (adminIds.length === 0) return;

    // 각 관리자에게 알림 전송
    for (const adminId of adminIds) {
      const notification = {
        id: crypto.randomUUID(),
        userId: adminId,
        type: "임시보호" as const,
        title: "새로운 임시보호 등록이 도착했습니다",
        content: `${userName}님이 ${animalName}에 대한 임시보호를 신청했습니다`,
        data: JSON.stringify({ animalName, userName, centerId }),
        isRead: false,
        createdAt: new Date(),
      };

      await db.insert(notifications).values(notification);
    }

    // FCM 푸시 전송
    try {
      await fcm.sendToMultipleUsers(
        adminIds,
        "새로운 임시보호 등록",
        `${userName}님이 ${animalName}에 대한 임시보호를 신청했습니다`,
        { type: "foster", animalName, userName }
      );
    } catch (error) {
      console.error("FCM 전송 실패:", error);
    }
  }

  // 시스템 알림
  static async sendSystemNotification(
    userId: string,
    title: string,
    content: string,
    data?: Record<string, string>,
    context?: Context<AppBindings>
  ) {
    const db = context ? getDB(context) : getDB({} as Context<AppBindings>);

    const notification = {
      id: crypto.randomUUID(),
      userId,
      type: "시스템" as const,
      title,
      content,
      data: data ? JSON.stringify(data) : undefined,
      isRead: false,
      createdAt: new Date(),
    };

    await db.insert(notifications).values(notification);

    // FCM 푸시 전송
    try {
      await fcm.sendToUser(userId, title, content, data);
    } catch (error) {
      console.error("FCM 전송 실패:", error);
    }
  }
}
function or(
  arg0: SQL<unknown>,
  arg1: SQL<unknown>
): import("drizzle-orm").SQLWrapper | undefined {
  throw new Error("Function not implemented.");
}
