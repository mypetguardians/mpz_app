import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { centerFavorites, animalFavorites } from "@/db/schema/favorites";
import { centers } from "@/db/schema/centers";
import { animals } from "@/db/schema/animals";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
} from "@/lib/paginate";
import {
  toggleCenterFavoriteRoute,
  getCenterFavoritesRoute,
  toggleAnimalFavoriteRoute,
  getAnimalFavoritesRoute,
  checkCenterFavoriteRoute,
  checkAnimalFavoriteRoute,
} from "@/server/openapi/routes/favorites";

const app = new OpenAPIHono<AppBindings>();

// POST /favorites/centers/{centerId}/toggle - 센터 찜 토글
// @ts-expect-error - OpenAPI type complexity
app.openapi(toggleCenterFavoriteRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const { centerId } = c.req.valid("param");
    const db = getDB(c);

    // 센터 존재 확인
    const centerExists = await db
      .select()
      .from(centers)
      .where(eq(centers.id, centerId))
      .limit(1);

    if (centerExists.length === 0) {
      return c.json({ error: "센터를 찾을 수 없습니다" }, 404);
    }

    // 현재 찜 상태 확인
    const existingFavorite = await db
      .select()
      .from(centerFavorites)
      .where(
        and(
          eq(centerFavorites.userId, currentUser.id),
          eq(centerFavorites.centerId, centerId)
        )
      )
      .limit(1);

    let isFavorited: boolean;
    let message: string;

    if (existingFavorite.length > 0) {
      // 찜 해제
      await db
        .delete(centerFavorites)
        .where(
          and(
            eq(centerFavorites.userId, currentUser.id),
            eq(centerFavorites.centerId, centerId)
          )
        );
      isFavorited = false;
      message = "센터 찜이 해제되었습니다";
    } else {
      // 찜 추가
      await db.insert(centerFavorites).values({
        userId: currentUser.id,
        centerId: centerId,
      });
      isFavorited = true;
      message = "센터를 찜했습니다";
    }

    // 총 찜 개수 조회
    const totalFavoritesResult = await db
      .select()
      .from(centerFavorites)
      .where(eq(centerFavorites.centerId, centerId));

    const totalFavorites = totalFavoritesResult.length;

    return c.json({
      isFavorited,
      message,
      totalFavorites,
    });
  } catch (error) {
    console.error("Toggle center favorite error:", error);
    return c.json({ error: "센터 찜 토글 중 오류가 발생했습니다" }, 500);
  }
});

// GET /favorites/centers - 내가 찜한 센터 목록 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getCenterFavoritesRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const query = c.req.valid("query");
    const db = getDB(c);

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // 총 개수 조회
    const totalResult = await db
      .select()
      .from(centerFavorites)
      .where(eq(centerFavorites.userId, currentUser.id));

    const total = totalResult.length;

    // 찜한 센터 목록 조회 (센터 정보와 함께)
    const favoritesList = await db
      .select()
      .from(centerFavorites)
      .leftJoin(centers, eq(centerFavorites.centerId, centers.id))
      .where(eq(centerFavorites.userId, currentUser.id))
      .orderBy(desc(centerFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    // 응답 데이터 변환
    const centersResponse = favoritesList.map((item) => ({
      id: item.center_favorites.centerId,
      name: item.centers?.name || "알 수 없는 센터",
      location: item.centers?.isPublic ? item.centers?.location : null,
      region: item.centers?.region,
      phoneNumber: item.centers?.phoneNumber,
      imageUrl: item.centers?.imageUrl,
      isFavorited: true,
      favoritedAt: new Date(item.center_favorites.createdAt).toISOString(),
    }));

    // 페이지네이션 결과 생성
    const result = createPaginationResult(centersResponse, total, page, limit);

    return c.json({
      centers: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    });
  } catch (error) {
    console.error("Get center favorites error:", error);
    return c.json({ error: "찜한 센터 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// POST /favorites/animals/{animalId}/toggle - 동물 찜 토글
// @ts-expect-error - OpenAPI type complexity
app.openapi(toggleAnimalFavoriteRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const { animalId } = c.req.valid("param");
    const db = getDB(c);

    // 동물 존재 확인
    const animalExists = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animalExists.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    // 현재 찜 상태 확인
    const existingFavorite = await db
      .select()
      .from(animalFavorites)
      .where(
        and(
          eq(animalFavorites.userId, currentUser.id),
          eq(animalFavorites.animalId, animalId)
        )
      )
      .limit(1);

    let isFavorited: boolean;
    let message: string;

    if (existingFavorite.length > 0) {
      // 찜 해제
      await db
        .delete(animalFavorites)
        .where(
          and(
            eq(animalFavorites.userId, currentUser.id),
            eq(animalFavorites.animalId, animalId)
          )
        );
      isFavorited = false;
      message = "동물 찜이 해제되었습니다";
    } else {
      // 찜 추가
      await db.insert(animalFavorites).values({
        userId: currentUser.id,
        animalId: animalId,
      });
      isFavorited = true;
      message = "동물을 찜했습니다";
    }

    // 총 찜 개수 조회
    const totalFavoritesResult = await db
      .select()
      .from(animalFavorites)
      .where(eq(animalFavorites.animalId, animalId));

    const totalFavorites = totalFavoritesResult.length;

    return c.json({
      isFavorited,
      message,
      totalFavorites,
    });
  } catch (error) {
    console.error("Toggle animal favorite error:", error);
    return c.json({ error: "동물 찜 토글 중 오류가 발생했습니다" }, 500);
  }
});

// GET /favorites/animals - 내가 찜한 동물 목록 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getAnimalFavoritesRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const query = c.req.valid("query");
    const db = getDB(c);

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // 총 개수 조회
    const totalResult = await db
      .select()
      .from(animalFavorites)
      .where(eq(animalFavorites.userId, currentUser.id));

    const total = totalResult.length;

    // 찜한 동물 목록 조회 (동물 및 센터 정보와 함께)
    const favoritesList = await db
      .select()
      .from(animalFavorites)
      .leftJoin(animals, eq(animalFavorites.animalId, animals.id))
      .leftJoin(centers, eq(animals.centerId, centers.id))
      .where(eq(animalFavorites.userId, currentUser.id))
      .orderBy(desc(animalFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    // 응답 데이터 변환
    const animalsResponse = favoritesList.map((item) => ({
      id: item.animal_favorites.animalId,
      name: item.animals?.name || "알 수 없는 동물",
      breed: item.animals?.breed,
      age: item.animals?.age || 0,
      isFemale: item.animals?.isFemale || false,
      status: item.animals?.status || ("보호중" as const),
      personality: item.animals?.personality,
      centerId: item.animals?.centerId || "",
      centerName: item.centers?.name || "알 수 없는 센터",
      isFavorited: true,
      favoritedAt: new Date(item.animal_favorites.createdAt).toISOString(),
    }));

    // 페이지네이션 결과 생성
    const result = createPaginationResult(animalsResponse, total, page, limit);

    return c.json({
      animals: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev,
    });
  } catch (error) {
    console.error("Get animal favorites error:", error);
    return c.json({ error: "찜한 동물 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /favorites/centers/{centerId}/status - 센터 찜 상태 확인
// @ts-expect-error - OpenAPI type complexity
app.openapi(checkCenterFavoriteRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const { centerId } = c.req.valid("param");
    const db = getDB(c);

    // 센터 존재 확인
    const centerExists = await db
      .select()
      .from(centers)
      .where(eq(centers.id, centerId))
      .limit(1);

    if (centerExists.length === 0) {
      return c.json({ error: "센터를 찾을 수 없습니다" }, 404);
    }

    // 찜 상태 확인
    const favoriteExists = await db
      .select()
      .from(centerFavorites)
      .where(
        and(
          eq(centerFavorites.userId, currentUser.id),
          eq(centerFavorites.centerId, centerId)
        )
      )
      .limit(1);

    // 총 찜 개수 조회
    const totalFavoritesResult = await db
      .select()
      .from(centerFavorites)
      .where(eq(centerFavorites.centerId, centerId));

    const totalFavorites = totalFavoritesResult.length;

    return c.json({
      isFavorited: favoriteExists.length > 0,
      totalFavorites,
    });
  } catch (error) {
    console.error("Check center favorite error:", error);
    return c.json({ error: "센터 찜 상태 확인 중 오류가 발생했습니다" }, 500);
  }
});

// GET /favorites/animals/{animalId}/status - 동물 찜 상태 확인
// @ts-expect-error - OpenAPI type complexity
app.openapi(checkAnimalFavoriteRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const { animalId } = c.req.valid("param");
    const db = getDB(c);

    // 동물 존재 확인
    const animalExists = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animalExists.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    // 찜 상태 확인
    const favoriteExists = await db
      .select()
      .from(animalFavorites)
      .where(
        and(
          eq(animalFavorites.userId, currentUser.id),
          eq(animalFavorites.animalId, animalId)
        )
      )
      .limit(1);

    // 총 찜 개수 조회
    const totalFavoritesResult = await db
      .select()
      .from(animalFavorites)
      .where(eq(animalFavorites.animalId, animalId));

    const totalFavorites = totalFavoritesResult.length;

    return c.json({
      isFavorited: favoriteExists.length > 0,
      totalFavorites,
    });
  } catch (error) {
    console.error("Check animal favorite error:", error);
    return c.json({ error: "동물 찜 상태 확인 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
