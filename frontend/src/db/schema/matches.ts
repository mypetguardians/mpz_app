import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { animals } from "./animals";

// 매칭 질문지 템플릿
export const matchingQuestionnaires = sqliteTable("matching_questionnaires", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 객관식 질문들
export const matchingQuestions = sqliteTable("matching_questions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  questionnaireId: text("questionnaire_id")
    .notNull()
    .references(() => matchingQuestionnaires.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull().default(0),
  questionText: text("question_text").notNull(),
  questionType: text("question_type", {
    enum: ["radio", "checkbox", "select"],
  }).notNull(),
  options: text("options").notNull(), // JSON 형태: ["옵션1", "옵션2", "옵션3"]
  weight: integer("weight").notNull().default(1), // 질문별 가중치
  category: text("category"), // 질문 카테고리 (예: "성격", "활동성", "환경" 등)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 사용자의 매칭 질문 응답
export const matchingResponses = sqliteTable("matching_responses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionnaireId: text("questionnaire_id")
    .notNull()
    .references(() => matchingQuestionnaires.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => matchingQuestions.id, { onDelete: "cascade" }),
  selectedOptions: text("selected_options").notNull(), // JSON 형태: ["선택된옵션1", "선택된옵션2"]
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 매칭 세션 (사용자가 한 번에 응답한 질문지)
export const matchingSessions = sqliteTable("matching_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionnaireId: text("questionnaire_id")
    .notNull()
    .references(() => matchingQuestionnaires.id, { onDelete: "cascade" }),

  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 매칭 결과 및 보고서
export const matchingResults = sqliteTable("matching_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => matchingSessions.id, { onDelete: "cascade" }),
  animalId: text("animal_id")
    .notNull()
    .references(() => animals.id, { onDelete: "cascade" }),
  matchScore: integer("match_score").notNull(), // 0-100 점수
  compatibilityReport: text("compatibility_report").notNull(), // GPT 생성 상세 보고서
  matchingFactors: text("matching_factors").notNull(), // JSON: 매칭 요인들
  potentialChallenges: text("potential_challenges"), // 예상되는 어려움
  recommendations: text("recommendations"), // 구체적인 추천사항
  recommendationLevel: text("recommendation_level", {
    enum: ["매우추천", "추천", "보통", "비추천"],
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 사용자 선호도 설정 (매칭 결과 저장용)
export const userPreferences = sqliteTable("user_preferences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .references(() => matchingSessions.id, { onDelete: "cascade" }),
  // 선호도 데이터 (JSON 형태로 저장)
  preferences: text("preferences").notNull(), // 전체 응답 데이터
  animalType: text("animal_type"), // 강아지/고양이 등
  sizePreference: text("size_preference"), // 소형/중형/대형
  activityLevel: text("activity_level"), // 활동성 수준
  experienceLevel: text("experience_level"), // 경험 수준
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
