#!/usr/bin/env tsx

import fs from "fs";

console.log("🛠️ MPZ 환경 설정 도우미\n");

const envExampleTemplate = `# MPZ API 환경 변수 설정
# 이 파일을 .env로 복사하고 실제 값으로 변경하세요
# cp .env.example .env

# 환경 설정
NODE_ENV=development
APP_ENV=local

# JWT 설정 (32자 이상 강력한 랜덤 문자열)
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum

# 카카오 API (카카오 개발자 콘솔에서 발급)
KAKAO_CLIENT_ID=0ac4fb684d8e1e469976ec2b35f73857
KAKAO_CLIENT_SECRET=your-kakao-client-secret-here
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/callback

# 데이터베이스 ID (Cloudflare D1)
DEV_DATABASE_ID=88198d53-9b61-4260-a200-2f30c9873335
PROD_DATABASE_ID=your-production-database-id

# Cloudflare 설정 (Workers 배포용)
CLOUDFLARE_ACCOUNT_ID=8d401410410a61e14cc2e67a1349462c
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# 로그 및 성능 설정
LOG_LEVEL=debug
RATE_LIMIT_MAX=1000
MONITORING_ENABLED=false

# 외부 서비스 API 키들 (선택사항)
UPLOAD_API_KEY=your-upload-service-api-key
EMAIL_API_KEY=your-email-service-api-key
`;

const localEnvTemplate = `# MPZ API 로컬 개발 환경 설정
# 🔒 이 파일은 Git에 커밋되지 않습니다

# 환경 설정
NODE_ENV=development
APP_ENV=local

# JWT 설정 (32자 이상 랜덤 문자열 - 실제 값으로 변경하세요!)
JWT_SECRET=local-jwt-secret-32-characters-minimum-change-this

# 카카오 로그인
KAKAO_CLIENT_ID=0ac4fb684d8e1e469976ec2b35f73857
KAKAO_CLIENT_SECRET=your-kakao-client-secret-here
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/callback

# 데이터베이스 ID (Cloudflare D1)
DEV_DATABASE_ID=88198d53-9b61-4260-a200-2f30c9873335
PROD_DATABASE_ID=your-production-database-id

# Cloudflare 설정 (Workers 배포용)
CLOUDFLARE_ACCOUNT_ID=8d401410410a61e14cc2e67a1349462c
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token

# 로그 및 성능 설정
LOG_LEVEL=debug
RATE_LIMIT_MAX=1000
MONITORING_ENABLED=false
`;

function createEnvExample() {
  const examplePath = ".env.example";

  try {
    fs.writeFileSync(examplePath, envExampleTemplate);
    console.log(`✅ ${examplePath} 파일이 생성되었습니다 (팀 공유용)`);
    console.log(
      `📋 팀원들이 이 파일을 참고하여 .env 파일을 생성할 수 있습니다`
    );
  } catch (error) {
    console.error(`❌ ${examplePath} 파일 생성 실패:`, error);
  }
}

function createLocalEnv() {
  const envPath = ".env";

  if (fs.existsSync(envPath)) {
    console.log(`✅ ${envPath} 파일이 이미 존재합니다`);
    return;
  }

  try {
    fs.writeFileSync(envPath, localEnvTemplate);
    console.log(`✅ ${envPath} 파일이 생성되었습니다 (로컬 개발용)`);
    console.log(`🔒 이 파일은 Git에 커밋되지 않습니다`);
  } catch (error) {
    console.error(`❌ ${envPath} 파일 생성 실패:`, error);
  }
}

function showFileStructure() {
  console.log("\n📁 환경 변수 파일 구조:");
  console.log("─".repeat(50));

  const files = [
    {
      file: ".env",
      desc: "실제 환경 변수",
      git: "❌ Git 제외",
      security: "🔒",
    },
    {
      file: ".env.example",
      desc: "팀 공유 예시",
      git: "✅ Git 추적",
      security: "📋",
    },
    {
      file: "wrangler.dev.jsonc",
      desc: "개발 Workers 설정",
      git: "✅ Git 추적",
      security: "🔧",
    },
    {
      file: "wrangler.prod.jsonc",
      desc: "프로덕션 Workers 설정",
      git: "✅ Git 추적",
      security: "🚀",
    },
  ];

  files.forEach(({ file, desc, git, security }) => {
    const exists = fs.existsSync(file) ? "✅" : "❌";
    console.log(
      `  ${exists} ${file.padEnd(20)} ${security} ${desc.padEnd(20)} ${git}`
    );
  });
}

function showSetupInstructions() {
  console.log("\n🔧 환경 설정 가이드:");
  console.log("─".repeat(50));

  console.log("\n1️⃣ 로컬 개발 환경:");
  console.log("  cp .env.example .env");
  console.log("  # .env 파일을 편집하여 실제 값 설정");
  console.log("  # - KAKAO_CLIENT_SECRET: 실제 카카오 시크릿");
  console.log("  # - JWT_SECRET: 강력한 32자 이상 시크릿");

  console.log("\n2️⃣ Workers 배포 시 환경 변수 자동 사용:");
  console.log("  # 개발 환경 배포");
  console.log("  NODE_ENV=development APP_ENV=dev npm run workers:deploy:dev");
  console.log("  # 프로덕션 환경 배포");
  console.log("  NODE_ENV=production APP_ENV=prod npm run workers:deploy:prod");

  console.log("\n3️⃣ 민감한 정보는 wrangler secret으로:");
  console.log("  wrangler secret put JWT_SECRET --config wrangler.dev.jsonc");
  console.log(
    "  wrangler secret put KAKAO_CLIENT_SECRET --config wrangler.dev.jsonc"
  );
}

function showEnvironmentInfo() {
  console.log("\n🌍 환경별 설정:");
  console.log("─".repeat(50));

  console.log("\n🏠 Local (Next.js):");
  console.log("  • 파일: .env");
  console.log("  • URL: http://localhost:3000");
  console.log("  • 명령어: npm run dev");
  console.log("  • DB: SQLite (./sqlite.db)");

  console.log("\n🧪 Test (Vitest):");
  console.log("  • 파일: vitest.config.ts + .env");
  console.log("  • URL: http://localhost:3001");
  console.log("  • 명령어: npm test");
  console.log("  • DB: SQLite (./test.db)");

  console.log("\n🔧 Development (Workers):");
  console.log("  • 설정: wrangler.dev.jsonc + .env");
  console.log("  • URL: https://mpz-dev.conscience.workers.dev");
  console.log("  • 명령어: npm run workers:deploy:dev");
  console.log("  • DB: Cloudflare D1 (DEV_DATABASE_ID)");

  console.log("\n🚀 Production (Workers):");
  console.log("  • 설정: wrangler.prod.jsonc + .env");
  console.log("  • URL: https://mpz.conscience.workers.dev");
  console.log("  • 명령어: npm run workers:deploy:prod");
  console.log("  • DB: Cloudflare D1 (PROD_DATABASE_ID)");
}

function showSecurityNotes() {
  console.log("\n🔒 보안 주의사항:");
  console.log("─".repeat(50));

  console.log("\n✅ 안전한 것 (Git 추적):");
  console.log("  • .env.example (예시 파일)");
  console.log("  • wrangler.*.jsonc (비민감 설정)");
  console.log("  • src/config/ (코드 레벨 설정)");

  console.log("\n🔒 보호되는 것 (Git 제외):");
  console.log("  • .env (실제 환경 변수)");
  console.log("  • JWT_SECRET, KAKAO_CLIENT_SECRET");
  console.log("  • 데이터베이스 ID, API 키");

  console.log("\n🎯 장점:");
  console.log("  • 표준적인 .env / .env.example 구조");
  console.log("  • 하나의 .env 파일로 모든 환경 관리");
  console.log("  • wrangler 설정은 공개 가능");
  console.log("  • 팀 협업 시 .env.example 공유");
}

// 실행
createEnvExample();
createLocalEnv();
showFileStructure();
showSetupInstructions();
showEnvironmentInfo();
showSecurityNotes();

console.log("\n🎉 환경 설정 가이드 완료!");
console.log("🔒 .env 파일에 실제 값을 설정하고 절대 Git에 커밋하지 마세요!");
