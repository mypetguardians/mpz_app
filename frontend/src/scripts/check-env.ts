#!/usr/bin/env tsx

import { config, validateConfig } from "@/config";

console.log("🔍 MPZ 환경 설정 검증 중...\n");

try {
  validateConfig(config);

  console.log("\n✅ 환경 설정 검증 완료!");
  console.log("\n📋 현재 설정:");
  console.log("─".repeat(50));
  console.log(`🌍 환경: ${config.env.toUpperCase()}`);
  console.log(`🏃 Node 환경: ${config.nodeEnv}`);
  console.log(`🗄️ 데이터베이스: ${config.database.type}`);
  if (config.database.path) {
    console.log(`📁 DB 경로: ${config.database.path}`);
  }
  if (config.database.id) {
    console.log(`🆔 DB ID: ${config.database.id}`);
  }
  console.log(`🌐 API URL: ${config.api.baseUrl}`);
  console.log(`⏱️ 타임아웃: ${config.api.timeout}ms`);
  console.log(`🔑 JWT 만료: ${config.jwt.expiresIn}`);
  console.log(`📊 로그 레벨: ${config.logLevel}`);
  console.log(
    `🚦 Rate Limit: ${config.rateLimit.max}/${config.rateLimit.windowMs}ms`
  );
  console.log(
    `📡 CORS: ${
      Array.isArray(config.cors.origin)
        ? config.cors.origin.join(", ")
        : config.cors.origin
    }`
  );
  console.log(
    `🔍 모니터링: ${
      config.monitoring.enabled
        ? `활성화 (${config.monitoring.intervalDays}일 간격)`
        : "비활성화"
    }`
  );

  if (config.testing.enabled) {
    console.log("\n🧪 테스트 설정:");
    console.log(
      `🔬 테스트 모드: ${config.testing.fastMode ? "FAST" : "NORMAL"}`
    );
    console.log(
      `🎭 외부 API 모킹: ${
        config.testing.mockExternalApis ? "활성화" : "비활성화"
      }`
    );
  }

  console.log("\n🔗 카카오 설정:");
  console.log(`📱 Client ID: ${config.kakao.clientId}`);
  console.log(
    `🔒 Client Secret: ${config.kakao.clientSecret ? "설정됨" : "❌ 미설정"}`
  );
  console.log(`🔄 Redirect URI: ${config.kakao.redirectUri}`);

  console.log("\n🚀 사용 가능한 명령어:");
  console.log("─".repeat(50));

  if (config.env === "local") {
    console.log("🏠 로컬 개발 (Next.js):");
    console.log("  npm run dev                 # Next.js 개발 서버");
    console.log("  npm run db:studio           # 데이터베이스 관리");
    console.log("  npm test                    # 테스트 실행");
    console.log("  npm run generate:tokens     # JWT 토큰 생성");
  }

  if (config.env === "test") {
    console.log("🧪 테스트 환경:");
    console.log("  npm test                    # 테스트 실행");
    console.log("  npm run test:ui             # 테스트 UI 모드");
    console.log("  npm run test:watch          # 테스트 감시 모드");
    console.log("  npm run test:coverage       # 커버리지 포함 테스트");
    console.log("  npm run generate:tokens:test # 테스트용 JWT 토큰");
    console.log("  npm run env:check:test      # 테스트 환경 검증");
  }

  if (config.env === "dev") {
    console.log("🔧 개발 서버 (Cloudflare Workers):");
    console.log("  npm run workers:dev         # Workers 개발 서버");
    console.log("  npm run deploy:dev          # 개발 서버 배포");
    console.log("  npm run db:migrate:dev      # 개발 DB 마이그레이션");
    console.log("  npm run workers:tail:dev    # 개발 서버 로그");
  }

  if (config.env === "prod") {
    console.log("🚀 프로덕션 (Cloudflare Workers):");
    console.log("  npm run deploy:prod         # 프로덕션 배포");
    console.log("  npm run db:migrate:prod     # 프로덕션 DB 마이그레이션");
    console.log("  npm run workers:tail:prod   # 프로덕션 서버 로그");
  }

  console.log("\n🌐 환경별 URL:");
  console.log("  • Local: http://localhost:3000");
  console.log("  • Test: http://localhost:3001");
  console.log("  • Dev: https://mpz-dev.conscience.workers.dev");
  console.log("  • Prod: https://mpz.conscience.workers.dev");
} catch (error) {
  console.error("❌ 환경 설정 오류:", error);
  console.log("\n🔧 해결 방법:");
  console.log("1. 환경 변수를 확인하세요");
  console.log("2. .env.local 파일을 생성하거나 확인하세요");
  console.log("3. npm run env:setup 으로 환경을 설정하세요");
  process.exit(1);
}

console.log("\n�� 모든 검증이 완료되었습니다!");
