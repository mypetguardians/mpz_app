#!/usr/bin/env node

import { execSync } from "child_process";

console.log("🚀 R2 버킷 설정 시작...");

async function setupR2Buckets() {
  try {
    // 개발 환경 R2 버킷 생성
    console.log("📦 개발 환경 R2 버킷 생성 중...");

    try {
      execSync("npx wrangler r2 bucket create mpz-animal-images-dev", {
        stdio: "inherit",
      });
      console.log("✅ 개발 환경 R2 버킷 생성 완료");
    } catch (error) {
      console.log("ℹ️ 개발 환경 R2 버킷이 이미 존재합니다");
    }

    // 프로덕션 환경 R2 버킷 생성
    console.log("📦 프로덕션 환경 R2 버킷 생성 중...");

    try {
      execSync("npx wrangler r2 bucket create mpz-animal-images", {
        stdio: "inherit",
      });
      console.log("✅ 프로덕션 환경 R2 버킷 생성 완료");
    } catch (error) {
      console.log("ℹ️ 프로덕션 환경 R2 버킷이 이미 존재합니다");
    }

    // 버킷 목록 확인
    console.log("📋 R2 버킷 목록 확인 중...");
    execSync("npx wrangler r2 bucket list", {
      stdio: "inherit",
    });

    console.log("🎉 R2 버킷 설정 완료!");
    console.log("");
    console.log("다음 단계:");
    console.log("1. wrangler.toml 또는 wrangler.jsonc에 R2 버킷 바인딩 추가");
    console.log("2. 애플리케이션 배포");
    console.log("3. 이미지 업로드 테스트");
  } catch (error) {
    console.error("❌ R2 버킷 설정 실패:", error);
    process.exit(1);
  }
}

setupR2Buckets();
