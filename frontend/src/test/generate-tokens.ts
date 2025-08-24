#!/usr/bin/env tsx

import {
  createUserJWT,
  createCenterAdminJWT,
  createSuperAdminJWT,
  createExpiredJWT,
} from "./utils/auth";

console.log("🔑 MPZ API 테스트용 JWT 토큰들\n");

console.log("👤 일반사용자 토큰:");
console.log(createUserJWT());
console.log("");

console.log("🏢 센터관리자 토큰:");
console.log(createCenterAdminJWT());
console.log("");

console.log("👑 최고관리자 토큰:");
console.log(createSuperAdminJWT());
console.log("");

console.log("⏰ 만료된 토큰 (테스트용):");
console.log(createExpiredJWT());
console.log("");

console.log("📋 사용법:");
console.log("1. 위 토큰을 복사하세요");
console.log("2. Swagger UI (http://localhost:3000/api/docs)를 열어주세요");
console.log('3. 우측 상단의 "Authorize" 🔓 버튼을 클릭하세요');
console.log('4. "Bearer" 필드에 토큰을 입력하세요 (Bearer 접두사 없이 토큰만)');
console.log('5. "Authorize" 버튼을 클릭하여 인증을 완료하세요');
console.log("6. 🔒 자물쇠 아이콘이 닫힌 상태가 되면 인증 성공입니다");
console.log("");
console.log("📡 cURL 사용법:");
console.log(
  'curl -H "Authorization: Bearer 토큰" http://localhost:3000/api/endpoint'
);
console.log("");
console.log("🌐 서버 환경:");
console.log("- Development (Local): http://localhost:3000");
console.log("- Development (Workers): https://mpz-dev.conscience.workers.dev");
console.log("- Production (Workers): https://mpz.conscience.workers.dev");
console.log("");

// package.json 스크립트 제안
console.log("💡 package.json에 추가할 스크립트:");
console.log('"generate:tokens": "tsx src/test/generate-tokens.ts"');
