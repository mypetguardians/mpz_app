import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import type { Context } from "hono";

import type { AppBindings } from "@/types";
import * as authSchema from "./schema/auth";
import * as postsSchema from "./schema/posts";
import * as commentsSchema from "./schema/comments";
import * as centersSchema from "./schema/centers";
import * as animalsSchema from "./schema/animals";
import * as adoptionsSchema from "./schema/adoptions";
import * as matchesSchema from "./schema/matches";
import * as miscSchema from "./schema/misc";
import * as noticesSchema from "./schema/notices";
import * as favoritesSchema from "./schema/favorites";
import * as feedbackSchema from "./schema/feedback";
import * as bannerSchema from "./schema/banners";
import * as notificationsSchema from "./schema/notifications";

export const schema = {
  ...authSchema,
  ...postsSchema,
  ...commentsSchema,
  ...centersSchema,
  ...animalsSchema,
  ...adoptionsSchema,
  ...matchesSchema,
  ...miscSchema,
  ...noticesSchema,
  ...favoritesSchema,
  ...feedbackSchema,
  ...bannerSchema,
  ...notificationsSchema,
};
export type DBSchema = typeof schema;

let dbInstance: DrizzleD1Database<DBSchema> | ReturnType<typeof drizzleSQLite>;

export function getDB(c: Context<AppBindings>) {
  if (!dbInstance) {
    // 로컬 환경에서는 SQLite 사용
    if (process.env.NODE_ENV === "development" || !c.env.DB) {
      const sqlite = new Database("./sqlite.db");
      dbInstance = drizzleSQLite(sqlite, { schema });
    } else {
      // 프로덕션에서는 D1 사용
      dbInstance = drizzle(c.env.DB, { schema });
    }
  }
  return dbInstance;
}

// 개별 스키마들도 export
export {
  authSchema,
  postsSchema,
  commentsSchema,
  centersSchema,
  animalsSchema,
  adoptionsSchema,
  matchesSchema,
  miscSchema,
  noticesSchema,
  favoritesSchema,
  feedbackSchema,
  bannerSchema,
  notificationsSchema,
};
