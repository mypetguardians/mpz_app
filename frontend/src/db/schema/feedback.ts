import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const feedback = sqliteTable("feedback", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // 사용자 삭제 시에도 피드백은 유지
  email: text("email"), // 비로그인 사용자나 추가 연락처용
  type: text("type", {
    enum: ["버그신고", "기능요청", "불편사항", "문의사항", "기타"],
  }).notNull(),
  content: text("content").notNull(), // 피드백 내용
  status: text("status", {
    enum: ["접수", "검토중", "처리중", "완료", "보류"],
  })
    .notNull()
    .default("접수"),
  priority: text("priority", {
    enum: ["낮음", "보통", "높음", "긴급"],
  })
    .notNull()
    .default("보통"),
  adminResponse: text("admin_response"), // 관리자 답변
  adminId: text("admin_id").references(() => user.id, { onDelete: "set null" }), // 처리한 관리자
  respondedAt: integer("responded_at", { mode: "timestamp" }), // 답변 시간
  // 메타데이터
  userAgent: text("user_agent"), // 브라우저 정보
  ipAddress: text("ip_address"), // IP 주소 (개인정보 보호를 위해 해시화 권장)
  deviceInfo: text("device_info"), // 디바이스 정보
  pageUrl: text("page_url"), // 피드백 발생 페이지
  // 첨부파일 (향후 확장용)
  attachments: text("attachments", { mode: "json" }), // 첨부파일 URL 배열
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 피드백 카테고리별 통계를 위한 뷰 (선택사항)
export const feedbackStats = sqliteTable("feedback_stats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull(), // YYYY-MM-DD 형식
  type: text("type").notNull(),
  status: text("status").notNull(),
  count: integer("count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
