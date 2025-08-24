import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { drizzle } from "drizzle-orm/d1";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import type { Context } from "hono";

import type { AppBindings } from "@/types";
import { schema } from "@/db";

let authInstance: ReturnType<typeof betterAuth>;

export function getAuth(c: Context<AppBindings>) {
  if (!authInstance) {
    // 로컬 환경에서는 SQLite 사용
    let db;
    if (process.env.NODE_ENV === "development" || !c.env.DB) {
      const sqlite = new Database("./sqlite.db");
      db = drizzleSQLite(sqlite, { schema });
    } else {
      db = drizzle(c.env.DB, { schema });
    }

    authInstance = betterAuth({
      secret:
        process.env.BETTER_AUTH_SECRET ||
        c.env.BETTER_AUTH_SECRET ||
        "my-super-secret-key-for-development-only",
      baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      plugins: [nextCookies()],
      database: drizzleAdapter(db, {
        provider: "sqlite",
      }),
    });
  }
  return authInstance;
}
