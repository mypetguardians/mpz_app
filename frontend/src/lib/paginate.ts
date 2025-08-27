import { SQL } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { animals } from "@/db/schema/animals";
import type { centers } from "@/db/schema/centers";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function validatePaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function executeCountQuery<
  TSchema extends Record<string, unknown> = Record<string, unknown>
>(
  db: DrizzleD1Database<TSchema>,
  table: typeof animals | typeof centers,
  whereConditions?: SQL<unknown>[]
): Promise<number> {
  const { count } = await import("drizzle-orm");
  const { and } = await import("drizzle-orm");

  const countResult = await db
    .select({ count: count() })
    .from(table)
    .where(
      whereConditions && whereConditions.length > 0
        ? and(...whereConditions)
        : undefined
    );

  return Number(countResult[0]?.count) || 0;
}

export async function executeCountQueryWithJoin<
  TSchema extends Record<string, unknown> = Record<string, unknown>
>(
  db: DrizzleD1Database<TSchema>,
  whereConditions: SQL<unknown>[],
  region?:
    | "서울"
    | "부산"
    | "대구"
    | "인천"
    | "광주"
    | "대전"
    | "울산"
    | "세종"
    | "경기"
    | "강원"
    | "충북"
    | "충남"
    | "전북"
    | "전남"
    | "경북"
    | "경남"
    | "제주"
): Promise<number> {
  const { count, eq, and } = await import("drizzle-orm");
  const { animals } = await import("@/db/schema/animals");
  const { centers } = await import("@/db/schema/centers");

  const joinConditions = [];
  if (whereConditions && whereConditions.length > 0) {
    joinConditions.push(and(...whereConditions));
  }
  if (region) {
    joinConditions.push(eq(centers.region, region));
  }

  const countResult = await db
    .select({ count: count() })
    .from(animals)
    .leftJoin(centers, eq(animals.centerId, centers.id))
    .where(joinConditions.length > 0 ? and(...joinConditions) : undefined);

  return Number(countResult[0]?.count) || 0;
}
