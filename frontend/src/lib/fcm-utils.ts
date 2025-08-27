import { getDB } from "@/db";
import { pushTokens } from "@/db/schema/notifications";
import { eq, and } from "drizzle-orm";
import type { Context } from "hono";
import type { AppBindings } from "@/types";

interface FCMConfig {
  serverKey: string;
  projectId: string;
}

interface FCMMessage {
  to?: string;
  registration_ids?: string[];
  notification?: {
    title: string;
    body: string;
    icon?: string;
    click_action?: string;
  };
  data?: Record<string, string>;
  priority?: "high" | "normal";
}

export class FCMService {
  private serverKey: string;
  private projectId: string;

  constructor(config: FCMConfig) {
    this.serverKey = config.serverKey;
    this.projectId = config.projectId;
  }

  async sendNotification(message: FCMMessage): Promise<Response> {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${this.serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FCM Error: ${response.status} - ${error}`);
    }

    return response;
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    // 사용자의 모든 활성 토큰에 전송
    const tokens = await this.getUserTokens(userId);

    if (tokens.length === 0) return;

    const message: FCMMessage = {
      registration_ids: tokens,
      notification: {
        title,
        body,
        icon: "/favicon.ico",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      data: {
        ...data,
        userId,
        timestamp: Date.now().toString(),
      },
      priority: "high",
    };

    return this.sendNotification(message);
  }

  async sendToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    const allTokens: string[] = [];

    for (const userId of userIds) {
      const tokens = await this.getUserTokens(userId);
      allTokens.push(...tokens);
    }

    if (allTokens.length === 0) return;

    // FCM은 한 번에 최대 1000개 토큰까지 전송 가능
    const chunks = this.chunkArray(allTokens, 1000);

    const promises = chunks.map((chunk) => {
      const message: FCMMessage = {
        registration_ids: chunk,
        notification: { title, body },
        data,
        priority: "high",
      };
      return this.sendNotification(message);
    });

    return Promise.all(promises);
  }

  private async getUserTokens(userId: string): Promise<string[]> {
    const db = getDB({} as Context<AppBindings>);
    const result = await db
      .select()
      .from(pushTokens)
      .where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));

    return result.map((r) => r.token);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// 환경변수에서 FCM 설정 로드
export function createFCMService(): FCMService {
  const serverKey = process.env.FCM_SERVER_KEY || "";
  const projectId = process.env.FCM_PROJECT_ID || "";

  if (!serverKey || !projectId) {
    throw new Error(
      "FCM 설정이 누락되었습니다. FCM_SERVER_KEY와 FCM_PROJECT_ID를 설정해주세요."
    );
  }

  return new FCMService({ serverKey, projectId });
}
