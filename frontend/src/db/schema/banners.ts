import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 배너 테이블
export const banners = sqliteTable("banners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type", {
    enum: ["main", "sub"],
  })
    .notNull()
    .default("main"),
  title: text("title"), // 선택사항
  description: text("description"), // 선택사항
  alt: text("alt").notNull(), // 이미지 대체 텍스트 (필수)
  imageUrl: text("image_url").notNull(), // R2 이미지 URL
  orderIndex: integer("order_index").notNull().default(0), // 캐러셀 순서
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // 활성화 상태
  linkUrl: text("link_url"), // 클릭 시 이동할 URL (선택사항)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
