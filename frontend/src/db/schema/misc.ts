import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { centers } from "./centers";

export const favorites = sqliteTable("favorites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull(),
  targetType: text("target_type", { enum: ["animal", "center"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const personalityTests = sqliteTable("personality_tests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  testResults: text("test_results", { mode: "json" }),
  recommendedAnimals: text("recommended_animals", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const questionForms = sqliteTable("question_forms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  type: text("type", {
    enum: ["text", "textarea", "radio", "checkbox", "select"],
  }).notNull(),
  options: text("options"), // JSON array for radio, checkbox, select
  isRequired: integer("is_required", { mode: "boolean" })
    .notNull()
    .default(false),
  sequence: integer("sequence").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const userSettings = sqliteTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  phone: text("phone"),
  phoneVerification: integer("phone_verification", { mode: "boolean" }).default(
    false
  ),
  name: text("name"), // 실명 (입양 신청용)
  birth: text("birth"), // 생년월일 (YYYY-MM-DD)
  address: text("address"), // 주소
  addressIsPublic: integer("address_is_public", { mode: "boolean" }).default(
    false
  ),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 전화번호 인증 토큰 (입양 신청용)
export const phoneVerificationTokens = sqliteTable(
  "phone_verification_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    token: text("token").notNull(), // 6자리 랜덤 토큰
    isUsed: integer("is_used", { mode: "boolean" }).default(false),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(), // 5분 후 만료
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }
);
