import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { centers } from "./centers";

export const notices = sqliteTable("notices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 최고관리자가 센터관리자들에게 전달하는 공지사항
export const superadminNotices = sqliteTable("superadmin_notices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
