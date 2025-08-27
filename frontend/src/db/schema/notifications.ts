import { sql } from "drizzle-orm";
import { user } from "./auth";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notifications = sqliteTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  type: text("type", {
    enum: ["커뮤니티", "입양신청", "임시보호", "모니터링", "시스템"],
  }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  data: text("data"), // JSON string for additional data
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  pushToken: text("push_token"), // FCM 토큰 저장
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  readAt: integer("read_at", { mode: "timestamp" }),
});

export const pushTokens = sqliteTable("push_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  token: text("token").notNull().unique(),
  platform: text("platform", { enum: ["web", "ios", "android"] }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  lastUsed: integer("last_used", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
