import { beforeAll, afterAll, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { schema } from "@/db";
import { config } from "@/config";
import fs from "fs";

// 테스트 환경 확인
if (config.env !== "test") {
  throw new Error(
    "Tests must run in test environment. Set NODE_ENV=test or APP_ENV=test"
  );
}

// 테스트용 데이터베이스 설정
export const TEST_DB_PATH = config.database.path || "./test.db";

let testDb: any;
let sqlite: Database.Database;

beforeAll(async () => {
  console.log("🧪 Setting up test environment...");

  // 기존 테스트 DB 제거
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // 테스트 데이터베이스 생성
  sqlite = new Database(TEST_DB_PATH);
  testDb = drizzle(sqlite, { schema });

  // 마이그레이션 실행 (모든 SQL 파일 읽어서 실행)
  const migrationFiles = [
    "./src/db/migrations/0000_true_microbe.sql",
    "./src/db/migrations/0001_bizarre_scarlet_spider.sql",
    "./src/db/migrations/0002_ordinary_mister_sinister.sql",
    "./src/db/migrations/0003_kind_scorpion.sql",
    "./src/db/migrations/0004_high_fallen_one.sql",
  ];

  for (const file of migrationFiles) {
    if (fs.existsSync(file)) {
      const migration = fs.readFileSync(file, "utf8");
      try {
        sqlite.exec(migration);
      } catch (error) {
        console.warn(`⚠️ Migration file ${file} failed:`, error);
      }
    }
  }

  console.log("✅ Test database initialized");
});

beforeEach(async () => {
  // 각 테스트 전에 데이터 초기화
  await clearAllTables();
});

afterAll(async () => {
  // 테스트 완료 후 정리
  console.log("🧹 Cleaning up test environment...");

  if (sqlite) {
    sqlite.close();
  }
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  console.log("✅ Test cleanup completed");
});

async function clearAllTables() {
  // 모든 테이블 데이터 삭제 (외래키 순서 고려)
  const tables = [
    "adoption_monitoring_checks",
    "adoption_monitoring",
    "adoption_contracts",
    "adoptions",
    "phone_verification_tokens",
    "user_settings",
    "replies",
    "comments",
    "post_images",
    "post_tags",
    "posts",
    "animal_favorites",
    "center_favorites",
    "adoption_question_responses",
    "adoption_questions",
    "animal_images",
    "animals",
    "adoption_contract_templates",
    "question_forms",
    "superadmin_notices",
    "notices",
    "centers",
    "verification",
    "session",
    "account",
    "user",
  ];

  for (const table of tables) {
    try {
      sqlite.exec(`DELETE FROM ${table}`);
    } catch (error) {
      // 테이블이 없으면 무시
    }
  }
}

// 테스트 유틸리티 함수들
export async function createTestUser(userData: any = {}) {
  const { user } = await import("@/db/schema/auth");
  const defaultUser = {
    id: "test-user-" + Math.random().toString(36).substring(7),
    email: "test@example.com",
    name: "테스트 사용자",
    userType: "일반사용자",
    ...userData,
  };

  await testDb.insert(user).values(defaultUser);
  return defaultUser;
}

export async function createTestCenter(centerData: any = {}) {
  const { centers } = await import("@/db/schema/centers");
  const defaultCenter = {
    id: "test-center-" + Math.random().toString(36).substring(7),
    userId: "test-center-admin-1",
    name: "테스트 센터",
    centerNumber: "TEST-001",
    location: "서울시 테스트구",
    isPublic: true,
    ...centerData,
  };

  await testDb.insert(centers).values(defaultCenter);
  return defaultCenter;
}

export async function createTestAnimal(animalData: any = {}) {
  const { animals } = await import("@/db/schema/animals");
  const defaultAnimal = {
    id: "test-animal-" + Math.random().toString(36).substring(7),
    name: "테스트 동물",
    breed: "믹스",
    age: 3,
    isFemale: false,
    status: "보호중" as const,
    centerId: "test-center-1",
    ...animalData,
  };

  await testDb.insert(animals).values(defaultAnimal);
  return defaultAnimal;
}

export { testDb };
