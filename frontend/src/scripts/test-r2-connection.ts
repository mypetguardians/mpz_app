#!/usr/bin/env tsx

/**
 * R2 연결 테스트 스크립트
 *
 * 사용법:
 * npx tsx src/scripts/test-r2-connection.ts
 */

import { generatePublicUrl, generateSafeFileName, validateImageFile } from "@/lib/r2-utils";

console.log("🚀 R2 연결 테스트 스크립트");
console.log("=".repeat(50));

// 1. URL 생성 테스트
console.log("\n📎 URL 생성 테스트:");
const testKey = "animals/test123/1704067200000-a1b2c3d4-sample.jpg";
const publicUrl = generatePublicUrl(testKey);
console.log(`생성된 URL: ${publicUrl}`);

// 2. 파일명 생성 테스트
console.log("\n📁 파일명 생성 테스트:");
const originalName = "테스트 이미지.jpg";
const safeFileName = generateSafeFileName(originalName, "animals/test123");
console.log(`원본 파일명: ${originalName}`);
console.log(`안전한 파일명: ${safeFileName}`);

// 3. 파일 검증 테스트
console.log("\n🔍 파일 검증 테스트:");
const mockFile = {
  name: "test-image.jpg",
  type: "image/jpeg",
  size: 1024 * 1024, // 1MB
} as File;

const validation = validateImageFile(mockFile);
console.log(`파일 검증 결과: ${validation.isValid ? "✅ 통과" : "❌ 실패"}`);
if (!validation.isValid) {
  console.log(`에러: ${validation.error}`);
}

// 4. 실제 R2 URL 접근 테스트
console.log("\n🌐 R2 도메인 접근 테스트:");
const testUrl =
  "https://8d401410410a61e14cc2e67a1349462c.r2.cloudflarestorage.com/mpz-animal-images";
console.log(`R2 버킷 URL: ${testUrl}`);

try {
  // 간단한 HEAD 요청으로 도메인 접근성 확인
  console.log("버킷 접근성 확인 중...");

  fetch(testUrl, { method: "HEAD" })
    .then((response) => {
      if (response.ok || response.status === 403) {
        // 403은 정상 - 권한이 없지만 도메인은 접근 가능
        console.log("✅ R2 버킷 도메인 접근 가능");
        console.log(`응답 상태: ${response.status} ${response.statusText}`);
      } else {
        console.log("❌ R2 버킷 접근 실패");
        console.log(`응답 상태: ${response.status} ${response.statusText}`);
      }
    })
    .catch((error) => {
      console.log("❌ 네트워크 오류:", error instanceof Error ? error.message : String(error));
    });
} catch (error) {
  console.log("❌ 네트워크 오류:", error instanceof Error ? error.message : String(error));
}

// 5. 예상되는 업로드 흐름 시뮬레이션
console.log("\n🔄 업로드 흐름 시뮬레이션:");
console.log("1. 파일 검증 ✅");
console.log("2. 안전한 파일명 생성 ✅");
console.log("3. R2에 업로드 (실제 파일 없이 시뮬레이션)");
console.log("4. 공개 URL 생성 ✅");
console.log("5. DB에 메타데이터 저장 (스킵)");

const simulatedUploadUrl = generatePublicUrl(safeFileName);
console.log(`시뮬레이션된 업로드 URL: ${simulatedUploadUrl}`);

// 6. 환경 설정 확인
console.log("\n⚙️ 환경 설정 확인:");
console.log(`환경: ${process.env.NODE_ENV || "undefined"}`);
console.log(`APP_ENV: ${process.env.APP_ENV || "undefined"}`);
console.log(`CLOUDFLARE_ACCOUNT_ID: ${process.env.CLOUDFLARE_ACCOUNT_ID ? "설정됨" : "설정되지 않음"}`);

console.log("\n✨ 테스트 완료!");
console.log("\n📚 다음 단계:");
console.log("1. npm run r2:setup - R2 버킷 생성");
console.log("2. npm run workers:deploy:dev - 개발 서버 배포");
console.log("3. API 엔드포인트 호출 테스트");
console.log("4. 프론트엔드에서 업로드 UI 구현");

export {};
