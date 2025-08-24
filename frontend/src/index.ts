import app from "./server";
import { handleScheduled } from "./server/scheduled";

// Cloudflare Workers 타입 정의
interface ScheduledEvent {
  cron: string;
  type: "scheduled";
  scheduledTime: number;
}

interface CFExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  props: Record<string, unknown>;
}

interface Env {
  DB: unknown; // D1 Database
  BUCKET?: unknown; // R2 Bucket
  CACHE?: unknown; // KV Namespace
  NODE_ENV?: string;
  [key: string]: unknown;
}

// Cloudflare Workers 엔트리 포인트
const worker = {
  // HTTP 요청 처리
  async fetch(
    request: Request,
    env: Env,
    ctx: CFExecutionContext
  ): Promise<Response> {
    try {
      return await app.fetch(request, env, ctx);
    } catch (error) {
      console.error("❌ Error in fetch handler:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },

  // 크론잡 스케줄 처리
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: CFExecutionContext
  ): Promise<void> {
    try {
      console.log(
        `🔔 Scheduled event triggered: ${event.cron} at ${new Date(
          event.scheduledTime
        ).toISOString()}`
      );

      // 긴 실행 시간을 위해 waitUntil 사용
      ctx.waitUntil(handleScheduled(event, env));

      console.log("✅ Scheduled event handler completed");
    } catch (error) {
      console.error("💥 Error in scheduled handler:", error);
      throw error;
    }
  },
};

export default worker;
