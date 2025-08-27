import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const centers = sqliteTable("centers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  centerNumber: text("center_number"), // 보호소 번호 (국가 지정한 번호 000 - 000 - 0000)
  description: text("description"),
  location: text("location"),
  region: text("region", {
    enum: [
      "서울",
      "부산",
      "대구",
      "인천",
      "광주",
      "대전",
      "울산",
      "세종",
      "경기",
      "강원",
      "충북",
      "충남",
      "전북",
      "전남",
      "경북",
      "경남",
      "제주",
    ],
  }),
  phoneNumber: text("phone_number"),
  adoptionProcedure: text("adoption_procedure"),
  adoptionGuidelines: text("adoption_guidelines"), // 센터별 입양 유의사항
  hasMonitoring: integer("has_monitoring", { mode: "boolean" })
    .notNull()
    .default(false), // 모니터링 실시 여부
  monitoringPeriodMonths: integer("monitoring_period_months").default(3), // 모니터링 전체 기간 (개월)
  monitoringIntervalDays: integer("monitoring_interval_days").default(14), // 모니터링 체크 간격 (일)
  monitoringDescription: text("monitoring_description"), // 모니터링 방법/설명
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false), // 공개 여부 (입양자, 모두)
  adoptionPrice: integer("adoption_price").notNull().default(0),
  imageUrl: text("image_url"),
  isSubscriber: integer("is_subscriber", { mode: "boolean" })
    .notNull()
    .default(false), // 구독자 여부
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 센터별 입양 계약서 템플릿
export const adoptionContractTemplates = sqliteTable(
  "adoption_contract_templates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    centerId: text("center_id")
      .notNull()
      .references(() => centers.id, { onDelete: "cascade" }),
    title: text("title").notNull(), // 계약서 제목
    description: text("description"), // 계약서 설명/목적
    content: text("content").notNull(), // 계약서 본문 내용
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // 활성화 여부
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }
);
