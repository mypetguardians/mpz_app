import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { animals } from "./animals";
import { centers, adoptionContractTemplates } from "./centers";
import { posts } from "./posts";

// 입양 신청 - 휴대폰 인증 완료된 사용자만 가능
export const adoptions = sqliteTable("adoptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  animalId: text("animal_id")
    .notNull()
    .references(() => animals.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["신청", "미팅", "계약서작성", "입양완료", "모니터링", "취소"],
  })
    .notNull()
    .default("신청"),
  notes: text("notes"),
  // 입양 신청 시 동의 사항들
  monitoringAgreement: integer("monitoring_agreement", {
    mode: "boolean",
  }).notNull(),
  guidelinesAgreement: integer("guidelines_agreement", {
    mode: "boolean",
  }).notNull(),
  // contractAgreement 제거 - 계약서는 나중에 별도로 처리
  // 단계별 처리 시간 추적
  meetingScheduledAt: integer("meeting_scheduled_at", { mode: "timestamp" }), // 미팅 일정
  contractSentAt: integer("contract_sent_at", { mode: "timestamp" }), // 계약서 전송 시간
  adoptionCompletedAt: integer("adoption_completed_at", { mode: "timestamp" }), // 입양 완료 시간
  monitoringStartedAt: integer("monitoring_started_at", { mode: "timestamp" }), // 모니터링 시작 시간
  monitoringNextCheckAt: integer("monitoring_next_check_at", {
    mode: "timestamp",
  }), // 다음 모니터링 확인 시간
  monitoringEndDate: integer("monitoring_end_date", { mode: "timestamp" }), // 모니터링 종료 예정일
  monitoringCompletedChecks: integer("monitoring_completed_checks").default(0), // 완료된 모니터링 체크 수
  monitoringTotalChecks: integer("monitoring_total_checks").default(0), // 총 필요한 모니터링 체크 수
  monitoringStatus: text("monitoring_status", {
    enum: ["진행중", "완료", "지연", "중단"],
  }).default("진행중"), // 모니터링 전반적 상태
  // 센터 관리자의 처리 메모
  centerNotes: text("center_notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 센터별 입양 질문들
export const adoptionQuestions = sqliteTable("adoption_questions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull().default(0),
  content: text("content").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 사용자의 질문 응답
export const adoptionQuestionResponses = sqliteTable(
  "adoption_question_responses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adoptionId: text("adoption_id")
      .notNull()
      .references(() => adoptions.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => adoptionQuestions.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }
);

// 입양 계약서 및 서명 관리
export const adoptionContracts = sqliteTable("adoption_contracts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  adoptionId: text("adoption_id")
    .notNull()
    .references(() => adoptions.id, { onDelete: "cascade" }),
  templateId: text("template_id")
    .notNull()
    .references(() => adoptionContractTemplates.id), // 사용된 템플릿 참조
  contractContent: text("contract_content").notNull(), // 실제 계약서 내용 (템플릿 기반 생성)
  guidelinesContent: text("guidelines_content"), // 입양 유의사항
  userSignatureUrl: text("user_signature_url"), // 사용자 서명 이미지
  userSignedAt: integer("user_signed_at", { mode: "timestamp" }), // 사용자 서명 시간
  centerSignatureUrl: text("center_signature_url"), // 센터 서명 이미지
  centerSignedAt: integer("center_signed_at", { mode: "timestamp" }), // 센터 서명 시간
  status: text("status", {
    enum: ["대기중", "사용자서명완료", "센터서명완료", "계약완료"],
  })
    .notNull()
    .default("대기중"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 입양 후 모니터링 기록
export const adoptionMonitoring = sqliteTable("adoption_monitoring", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  adoptionId: text("adoption_id")
    .notNull()
    .references(() => adoptions.id, { onDelete: "cascade" }),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 모니터링 주기별 체크 기록
export const adoptionMonitoringChecks = sqliteTable(
  "adoption_monitoring_checks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adoptionId: text("adoption_id")
      .notNull()
      .references(() => adoptions.id, { onDelete: "cascade" }),
    checkSequence: integer("check_sequence").notNull(), // 체크 순서 (1, 2, 3, ... 6)
    checkDate: integer("check_date", { mode: "timestamp" }).notNull(), // 체크 실행 일자
    expectedCheckDate: integer("expected_check_date", {
      mode: "timestamp",
    }).notNull(), // 예정된 체크 일자
    periodStart: integer("period_start", { mode: "timestamp" }).notNull(), // 모니터링 대상 기간 시작
    periodEnd: integer("period_end", { mode: "timestamp" }).notNull(), // 모니터링 대상 기간 종료
    postsFound: integer("posts_found").notNull().default(0), // 해당 기간 중 발견된 포스트 수
    status: text("status", {
      enum: ["정상", "지연", "미제출"],
    }).notNull(),
    delayDays: integer("delay_days").default(0), // 지연 일수 (0이면 정상)
    daysUntilDeadline: integer("days_until_deadline"), // 마감일까지 남은 일수 (음수면 지연)
    nextCheckDate: integer("next_check_date", { mode: "timestamp" }), // 다음 체크 예정일
    notes: text("notes"), // 추가 메모
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }
);
