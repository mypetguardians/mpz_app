import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { centers } from "./centers";
import { animals } from "./animals";

// 센터 찜 테이블
export const centerFavorites = sqliteTable(
  "center_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    centerId: text("center_id")
      .notNull()
      .references(() => centers.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.centerId] }),
  })
);

// 동물 찜 테이블
export const animalFavorites = sqliteTable(
  "animal_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    animalId: text("animal_id")
      .notNull()
      .references(() => animals.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.animalId] }),
  })
);
