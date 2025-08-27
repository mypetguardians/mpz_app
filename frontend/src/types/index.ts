import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import type { Session, User } from "better-auth";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import type { Env } from "hono";

import type { getAuth } from "@/lib/auth";
import type { schema } from "@/db";

// 실제 데이터베이스 스키마 타입
export type DBSchema = typeof schema;

// export interface AppBindings extends Env {
//   Bindings: {
//     DB?: D1Database; // 로컬에서는 optional
//     ANIMAL_IMAGES_BUCKET?: R2Bucket; // R2 버킷
//     BETTER_AUTH_SECRET: string;
//     BETTER_AUTH_URL: string;
//     FRONTEND_URL?: string;
//     KAKAO_CLIENT_ID?: string;
//     KAKAO_CLIENT_SECRET?: string;
//   };
//   Variables: {
//     auth: ReturnType<typeof getAuth>;
//     db: DrizzleD1Database<DBSchema> | ReturnType<typeof drizzleSQLite>;
//     session: Session | null;
//     user: User | null;
//   };
// } 

export interface AppBindings extends Env {
  Bindings: {
    DB?: D1Database; // 로컬에서는 optional
    ANIMAL_IMAGES_BUCKET?: R2Bucket; // R2 버킷
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    FRONTEND_URL?: string;
    KAKAO_CLIENT_ID?: string;
    KAKAO_CLIENT_SECRET?: string;
  };
  Variables: {
    auth: ReturnType<typeof getAuth>;
    db: DrizzleD1Database<DBSchema> | ReturnType<typeof drizzleSQLite>;
    session: Session | null;
    user: User | null;
  };
}