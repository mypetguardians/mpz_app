import { checkAdoptionMonitoring } from "./scheduler/adoption-monitoring";

// Cloudflare Workers 타입 정의
interface ScheduledEvent {
  cron: string;
  type: "scheduled";
  scheduledTime: number;
}

/**
 * Cloudflare Workers Scheduled Event Handler
 * wrangler.toml에서 cron trigger로 설정된 스케줄에 따라 실행됨
 */
export async function handleScheduled(
  event: ScheduledEvent,
  env: Record<string, unknown>
) {
  try {
    console.log("⏰ Scheduled event triggered:", event.cron);

    // 크론 표현식에 따라 다른 작업 실행
    switch (event.cron) {
      case "0 9 * * *": // 매일 오전 9시 (UTC 기준)
        console.log("🔄 Running daily adoption monitoring check...");
        const result = await checkAdoptionMonitoring(env);
        console.log("✅ Daily monitoring check completed:", result);
        break;

      // 추가 스케줄 작업들을 여기에 추가할 수 있습니다
      // case "0 0 * * 0": // 매주 일요일 자정
      //   console.log("🗓️ Running weekly maintenance...");
      //   await runWeeklyMaintenance(env);
      //   break;

      default:
        console.log("❓ Unknown cron schedule:", event.cron);
    }
  } catch (error) {
    console.error("💥 Error in scheduled handler:", error);

    // 실패 시 외부 모니터링 서비스에 알림을 보낼 수 있습니다
    // await notifyError(error, env);

    throw error; // Workers에서 오류를 추적할 수 있도록 다시 throw
  }
}

/**
 * 수동으로 모니터링 체크를 실행하는 함수 (테스트/디버깅용)
 */
export async function runManualMonitoringCheck(env: Record<string, unknown>) {
  try {
    console.log("🔧 Running manual monitoring check...");
    const result = await checkAdoptionMonitoring(env);
    console.log("✅ Manual monitoring check completed:", result);
    return result;
  } catch (error) {
    console.error("💥 Error in manual monitoring check:", error);
    throw error;
  }
}
