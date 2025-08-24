/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { animals, animalImages } from "@/db/schema/animals";
import { centers } from "@/db/schema/centers";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import {
  getCurrentUser,
  isCenterOwner,
  type UserType,
} from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
  executeCountQuery,
  executeCountQueryWithJoin,
} from "@/lib/paginate";
import {
  createAnimalRoute,
  getAnimalsRoute,
  getAnimalByIdRoute,
  updateAnimalRoute,
  deleteAnimalRoute,
  updateAnimalStatusRoute,
  getBreedsRoute,
  getRelatedAnimalsByDistanceRoute,
} from "@/server/openapi/routes/animal";

const app = new OpenAPIHono<AppBindings>();

// POST /animals - 동물 등록 (센터 관리자 이상 권한 필요)
// @ts-expect-error - OpenAPI type complexity
app.openapi(createAnimalRoute, async (c) => {
  try {
    // 권한 체크
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType === "일반사용자") {
      return c.json({ error: "센터 관리자 이상의 권한이 필요합니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 센터 ID 결정
    let centerId: string;
    if (userType === "센터관리자") {
      // 센터 관리자는 자신의 센터에만 등록 가능
      const userCenters = await db
        .select()
        .from(centers)
        .where(eq(centers.userId, currentUser.id))
        .limit(1);

      if (userCenters.length === 0) {
        return c.json({ error: "등록된 센터가 없습니다" }, 400);
      }
      centerId = userCenters[0].id;
    } else {
      // 훈련사나 최고관리자는 센터 ID를 요청에서 받아야 함
      const requestCenterId = c.req.query("centerId");
      if (!requestCenterId) {
        return c.json({ error: "센터 ID가 필요합니다" }, 400);
      }
      centerId = requestCenterId;
    }

    // 동물 정보 생성
    const animalData = {
      centerId,
      name: body.name,
      isFemale: body.is_female,
      age: body.age,
      weight: body.weight,
      color: body.color,
      breed: body.breed,
      description: body.description || null,
      status: body.status || "보호중",
      waitingDays: 0,
      activityLevel: body.activity_level || null,
      sensitivity: body.sensitivity || null,
      sociability: body.sociability || null,
      separationAnxiety: body.separation_anxiety || null,
      specialNotes: body.special_notes || null,
      healthNotes: body.health_notes || null,
      basicTraining: body.basic_training || null,
      trainerComment: body.trainer_comment || null,
      announceNumber: body.announce_number || null,
      announcementDate: body.announcement_date || null,
      foundLocation: body.found_location || null,
      personality: body.personality || null,
    };

    // DB에 동물 정보 삽입
    const result = await db.insert(animals).values(animalData).returning();
    const createdAnimal = result[0];

    // 응답 데이터 변환
    const responseData = {
      id: createdAnimal.id,
      name: createdAnimal.name,
      isFemale: createdAnimal.isFemale,
      age: createdAnimal.age,
      weight: createdAnimal.weight,
      color: createdAnimal.color,
      breed: createdAnimal.breed,
      description: createdAnimal.description,
      status: createdAnimal.status,
      waitingDays: createdAnimal.waitingDays,
      activityLevel: createdAnimal.activityLevel,
      sensitivity: createdAnimal.sensitivity,
      sociability: createdAnimal.sociability,
      separationAnxiety: createdAnimal.separationAnxiety,
      specialNotes: createdAnimal.specialNotes,
      healthNotes: createdAnimal.healthNotes,
      basicTraining: createdAnimal.basicTraining,
      trainerComment: createdAnimal.trainerComment,
      announceNumber: createdAnimal.announceNumber,
      announcementDate: createdAnimal.announcementDate,
      foundLocation: createdAnimal.foundLocation,
      personality: createdAnimal.personality,
      centerId: createdAnimal.centerId,
      createdAt: new Date(createdAnimal.createdAt).toISOString(),
      updatedAt: new Date(createdAnimal.updatedAt).toISOString(),
    };

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Animal creation error:", error);
    return c.json({ error: "동물 등록 중 오류가 발생했습니다" }, 500);
  }
});

// GET /animals - 동물 목록 조회
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getAnimalsRoute, async (c) => {
  try {
    const query = c.req.valid("query");
    const db = getDB(c);

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // 필터 조건 생성
    const whereConditions = [];

    // 기본 필터
    if (query.status) {
      whereConditions.push(eq(animals.status, query.status));
    }
    if (query.centerId) {
      whereConditions.push(eq(animals.centerId, query.centerId));
    }

    // 추가 필터들
    if (query.gender) {
      const isFemale = query.gender === "female";
      whereConditions.push(eq(animals.isFemale, isFemale));
    }

    if (query.weight) {
      const { gte, lte, and } = await import("drizzle-orm");
      switch (query.weight) {
        case "10kg_under":
          whereConditions.push(lte(animals.weight, 10));
          break;
        case "25kg_under":
          whereConditions.push(
            and(gte(animals.weight, 10.1), lte(animals.weight, 25))
          );
          break;
        case "over_25kg":
          whereConditions.push(gte(animals.weight, 25.1));
          break;
      }
    }

    if (query.age) {
      const { gte, lte, and } = await import("drizzle-orm");
      switch (query.age) {
        case "2_under":
          whereConditions.push(lte(animals.age, 2));
          break;
        case "7_under":
          whereConditions.push(and(gte(animals.age, 3), lte(animals.age, 7)));
          break;
        case "over_7":
          whereConditions.push(gte(animals.age, 8));
          break;
      }
    }

    if (query.hasTrainerComment) {
      const { isNotNull, isNull } = await import("drizzle-orm");
      if (query.hasTrainerComment === "true") {
        whereConditions.push(isNotNull(animals.trainerComment));
      } else {
        whereConditions.push(isNull(animals.trainerComment));
      }
    }

    if (query.breed) {
      const { like } = await import("drizzle-orm");
      whereConditions.push(like(animals.breed, `%${query.breed}%`));
    }

    // region 필터를 위한 센터 정보 필요 여부 확인
    const needsCenterJoin = query.region;

    // 전체 개수 조회 (페이지네이션을 위해 필수)
    let total: number;
    if (needsCenterJoin) {
      // region 필터가 있을 때는 센터와 JOIN하여 카운트
      total = await executeCountQueryWithJoin(
        db as Parameters<typeof executeCountQueryWithJoin>[0],
        whereConditions.filter(Boolean) as SQL<unknown>[],
        query.region
      );
    } else {
      // 일반적인 카운트
      total = await executeCountQuery(
        db as any,
        animals,
        whereConditions.filter(Boolean) as SQL<unknown>[]
      );
    }

    // 동물 목록 조회 (이미지와 함께)
    let animalsList;
    if (needsCenterJoin) {
      // 센터와 JOIN하여 region 필터링
      animalsList = await db
        .select()
        .from(animals)
        .leftJoin(centers, eq(animals.centerId, centers.id))
        .leftJoin(animalImages, eq(animals.id, animalImages.animalId))
        .where(
          and(
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
            eq(centers.region, query.region!)
          )
        )
        .orderBy(desc(animals.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      // 일반적인 조회
      animalsList = await db
        .select()
        .from(animals)
        .leftJoin(animalImages, eq(animals.id, animalImages.animalId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(animals.createdAt))
        .limit(limit)
        .offset(offset);
    }

    // 응답 데이터 변환 (이미지 그룹화 포함)
    const animalsMap = new Map();
    
    animalsList.forEach((item: Record<string, any>) => {
      // JOIN 결과인 경우 item.animals에서, 일반 결과인 경우 item에서 직접 접근
      const animal = item.animals || item;
      const animalImage = item.animal_images;
      
      const animalId = animal.id as string;
      
      if (!animalsMap.has(animalId)) {
        animalsMap.set(animalId, {
          id: animal.id,
          name: animal.name,
          isFemale: animal.isFemale,
          age: animal.age,
          weight: animal.weight,
          color: animal.color,
          breed: animal.breed,
          description: animal.description,
          status: animal.status,
          waitingDays: animal.waitingDays,
          activityLevel: animal.activityLevel,
          sensitivity: animal.sensitivity,
          sociability: animal.sociability,
          separationAnxiety: animal.separationAnxiety,
          specialNotes: animal.specialNotes,
          healthNotes: animal.healthNotes,
          basicTraining: animal.basicTraining,
          trainerComment: animal.trainerComment,
          announceNumber: animal.announceNumber,
          announcementDate: animal.announcementDate,
          foundLocation: animal.foundLocation,
          personality: animal.personality,
          centerId: animal.centerId,
          createdAt: new Date(
            animal.createdAt as string | number | Date
          ).toISOString(),
          updatedAt: new Date(
            animal.updatedAt as string | number | Date
          ).toISOString(),
          animalImages: []
        });
      }
      
      // 이미지가 있으면 추가
      if (animalImage && animalImage.id) {
        const existingAnimal = animalsMap.get(animalId);
        existingAnimal.animalImages.push({
          id: animalImage.id,
          imageUrl: animalImage.imageUrl,
          orderIndex: animalImage.orderIndex
        });
      }
    });
    
    // Map을 배열로 변환하고 이미지를 orderIndex로 정렬
    const animalsResponse = Array.from(animalsMap.values()).map(animal => ({
      ...animal,
      animalImages: animal.animalImages.sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex)
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
    console.error("Animals list error:", error);
    return c.json({ error: "동물 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /animals/{animalId} - 동물 상세 조회
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(getAnimalByIdRoute, async (c) => {
  try {
    const { animalId } = c.req.valid("param");
    const db = getDB(c);

    // 동물 정보와 이미지 함께 조회
    const animalResult = await db
      .select()
      .from(animals)
      .leftJoin(animalImages, eq(animals.id, animalImages.animalId))
      .where(eq(animals.id, animalId));

    if (animalResult.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    // 동물 정보와 이미지 정보 분리
    const animal = animalResult[0].animals;
    const images = animalResult
      .filter(item => item.animal_images && item.animal_images.id)
      .map(item => ({
        id: item.animal_images!.id,
        imageUrl: item.animal_images!.imageUrl,
        orderIndex: item.animal_images!.orderIndex
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const responseData = {
      id: animal.id,
      name: animal.name,
      isFemale: animal.isFemale,
      age: animal.age,
      weight: animal.weight,
      color: animal.color,
      breed: animal.breed,
      description: animal.description,
      status: animal.status,
      waitingDays: animal.waitingDays,
      activityLevel: animal.activityLevel,
      sensitivity: animal.sensitivity,
      sociability: animal.sociability,
      separationAnxiety: animal.separationAnxiety,
      specialNotes: animal.specialNotes,
      healthNotes: animal.healthNotes,
      basicTraining: animal.basicTraining,
      trainerComment: animal.trainerComment,
      announceNumber: animal.announceNumber,
      announcementDate: animal.announcementDate,
      foundLocation: animal.foundLocation,
      personality: animal.personality,
      centerId: animal.centerId,
      createdAt: new Date(animal.createdAt).toISOString(),
      updatedAt: new Date(animal.updatedAt).toISOString(),
      animalImages: images,
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Animal detail error:", error);
    return c.json({ error: "동물 상세 조회 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /animals/{animalId} - 동물 정보 수정
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(updateAnimalRoute, async (c) => {
  try {
    const { animalId } = c.req.valid("param");

    // 권한 체크
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType === "일반사용자") {
      return c.json({ error: "센터 관리자 이상의 권한이 필요합니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 동물 존재 및 권한 확인
    const existingAnimal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (existingAnimal.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    // 센터 관리자인 경우 자신의 센터 동물인지 확인
    if (userType === "센터관리자") {
      const isOwner = await isCenterOwner(c, existingAnimal[0].centerId);
      if (!isOwner) {
        return c.json({ error: "해당 동물에 대한 권한이 없습니다" }, 403);
      }
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof animals.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.is_female !== undefined) updateData.isFemale = body.is_female;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.weight !== undefined) updateData.weight = body.weight;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.breed !== undefined) updateData.breed = body.breed;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.activity_level !== undefined)
      updateData.activityLevel = body.activity_level;
    if (body.sensitivity !== undefined)
      updateData.sensitivity = body.sensitivity;
    if (body.sociability !== undefined)
      updateData.sociability = body.sociability;
    if (body.separation_anxiety !== undefined)
      updateData.separationAnxiety = body.separation_anxiety;
    if (body.special_notes !== undefined)
      updateData.specialNotes = body.special_notes;
    if (body.health_notes !== undefined)
      updateData.healthNotes = body.health_notes;
    if (body.basic_training !== undefined)
      updateData.basicTraining = body.basic_training;
    if (body.trainer_comment !== undefined)
      updateData.trainerComment = body.trainer_comment;
    if (body.announce_number !== undefined)
      updateData.announceNumber = body.announce_number;
    if (body.announcement_date !== undefined)
      updateData.announcementDate = body.announcement_date;
    if (body.found_location !== undefined)
      updateData.foundLocation = body.found_location;
    if (body.personality !== undefined)
      updateData.personality = body.personality;

    // DB 업데이트
    const updatedResult = await db
      .update(animals)
      .set(updateData)
      .where(eq(animals.id, animalId))
      .returning();

    const updatedAnimal = updatedResult[0];
    const responseData = {
      id: updatedAnimal.id,
      name: updatedAnimal.name,
      isFemale: updatedAnimal.isFemale,
      age: updatedAnimal.age,
      weight: updatedAnimal.weight,
      color: updatedAnimal.color,
      breed: updatedAnimal.breed,
      description: updatedAnimal.description,
      status: updatedAnimal.status,
      waitingDays: updatedAnimal.waitingDays,
      activityLevel: updatedAnimal.activityLevel,
      sensitivity: updatedAnimal.sensitivity,
      sociability: updatedAnimal.sociability,
      separationAnxiety: updatedAnimal.separationAnxiety,
      specialNotes: updatedAnimal.specialNotes,
      healthNotes: updatedAnimal.healthNotes,
      basicTraining: updatedAnimal.basicTraining,
      trainerComment: updatedAnimal.trainerComment,
      announceNumber: updatedAnimal.announceNumber,
      announcementDate: updatedAnimal.announcementDate,
      foundLocation: updatedAnimal.foundLocation,
      personality: updatedAnimal.personality,
      centerId: updatedAnimal.centerId,
      createdAt: new Date(updatedAnimal.createdAt).toISOString(),
      updatedAt: new Date(updatedAnimal.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Animal update error:", error);
    return c.json({ error: "동물 정보 수정 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /animals/{animalId} - 동물 정보 삭제
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(deleteAnimalRoute, async (c) => {
  try {
    const { animalId } = c.req.valid("param");

    // 권한 체크
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType === "일반사용자") {
      return c.json({ error: "센터 관리자 이상의 권한이 필요합니다" }, 403);
    }

    const db = getDB(c);

    // 동물 존재 및 권한 확인
    const existingAnimal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (existingAnimal.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    // 센터 관리자인 경우 자신의 센터 동물인지 확인
    if (userType === "센터관리자") {
      const isOwner = await isCenterOwner(c, existingAnimal[0].centerId);
      if (!isOwner) {
        return c.json({ error: "해당 동물에 대한 권한이 없습니다" }, 403);
      }
    }

    // 동물 정보 삭제
    await db.delete(animals).where(eq(animals.id, animalId));

    return c.json({ message: "동물 정보가 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error("Animal deletion error:", error);
    return c.json({ error: "동물 정보 삭제 중 오류가 발생했습니다" }, 500);
  }
});

// PATCH /animals/{animalId}/status - 동물 상태 변경
// @ts-expect-error - Type complexity issue with OpenAPI/Hono
app.openapi(updateAnimalStatusRoute, async (c) => {
  try {
    const { animalId } = c.req.valid("param");

    // 권한 체크
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType === "일반사용자") {
      return c.json({ error: "센터 관리자 이상의 권한이 필요합니다" }, 403);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 동물 존재 및 권한 확인
    const existingAnimal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (existingAnimal.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    const animal = existingAnimal[0];

    // 센터 관리자인 경우 자신의 센터 동물인지 확인
    if (userType === "센터관리자") {
      const isOwner = await isCenterOwner(c, animal.centerId);
      if (!isOwner) {
        return c.json({ error: "해당 동물에 대한 권한이 없습니다" }, 403);
      }
    }

    // 상태 변경 로직
    const previousStatus = animal.status;
    const newStatus = body.status;

    // 동일한 상태로 변경하려는 경우 체크
    if (previousStatus === newStatus) {
      return c.json(
        {
          error: `동물의 상태가 이미 '${newStatus}'입니다`,
        },
        400
      );
    }

    // 상태 업데이트
    await db
      .update(animals)
      .set({
        status: newStatus,
      })
      .where(eq(animals.id, animalId));

    // 상태 변경 로그 추가 (선택사항 - 향후 확장 가능)
    const statusChangeMessage = `${animal.name}의 상태가 '${previousStatus}'에서 '${newStatus}'로 변경되었습니다`;

    if (body.reason) {
      console.log(`[상태 변경] ${statusChangeMessage} (사유: ${body.reason})`);
    } else {
      console.log(`[상태 변경] ${statusChangeMessage}`);
    }

    return c.json({
      id: animal.id,
      name: animal.name,
      previousStatus,
      newStatus,
      updatedAt: new Date().toISOString(),
      message: statusChangeMessage,
    });
  } catch (error) {
    console.error("Animal status update error:", error);
    return c.json({ error: "동물 상태 변경 중 오류가 발생했습니다" }, 500);
  }
});

// GET /animals/breeds - 품종 목록 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getBreedsRoute, async (c) => {
  try {
    const db = getDB(c);

    // breed 컬럼의 고유한 값들을 가져오기
    const breedsResult = await db
      .select()
      .from(animals)
      .where(sql`${animals.breed} IS NOT NULL AND ${animals.breed} != ''`);

    // breed 값들을 추출하고 null/빈 문자열 제거, 중복 제거
    const breeds = [
      ...new Set(
        breedsResult
          .map((item) => item.breed)
          .filter((breed) => breed && breed.trim() !== "")
      ),
    ].sort();

    return c.json({
      breeds,
      total: breeds.length,
    });
  } catch (error) {
    console.error("Breeds list error:", error);
    return c.json({ error: "품종 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /animals/{animalId}/related - 거리 기반 관련 동물 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getRelatedAnimalsByDistanceRoute, async (c) => {
  try {
    const { animalId } = c.req.valid("param");
    const { limit = 6 } = c.req.valid("query");
    const db = getDB(c);

    // 현재 동물 정보 조회
    const currentAnimal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (currentAnimal.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    const animal = currentAnimal[0];

    // 같은 지역의 다른 동물들을 가져오기 (거리 기반 정렬)
    // 실제 거리 계산이 어려우므로 같은 지역 내에서 최신순으로 정렬
    const relatedAnimals = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.centerId, animal.centerId), // 같은 보호소
          sql`${animals.id} != ${animalId}`, // 현재 동물 제외
          eq(animals.status, "보호중") // 보호중인 동물만
        )
      )
      .orderBy(desc(animals.createdAt)) // 최신순
      .limit(limit);

    // 응답 데이터 변환
    const animalsResponse = relatedAnimals.map((relatedAnimal) => ({
      id: relatedAnimal.id,
      name: relatedAnimal.name,
      isFemale: relatedAnimal.isFemale,
      age: relatedAnimal.age,
      weight: relatedAnimal.weight,
      color: relatedAnimal.color,
      breed: relatedAnimal.breed,
      description: relatedAnimal.description,
      status: relatedAnimal.status,
      waitingDays: relatedAnimal.waitingDays,
      activityLevel: relatedAnimal.activityLevel,
      sensitivity: relatedAnimal.sensitivity,
      sociability: relatedAnimal.sociability,
      separationAnxiety: relatedAnimal.separationAnxiety,
      specialNotes: relatedAnimal.specialNotes,
      healthNotes: relatedAnimal.healthNotes,
      basicTraining: relatedAnimal.basicTraining,
      trainerComment: relatedAnimal.trainerComment,
      announceNumber: relatedAnimal.announceNumber,
      announcementDate: relatedAnimal.announcementDate,
      foundLocation: relatedAnimal.foundLocation,
      personality: relatedAnimal.personality,
      centerId: relatedAnimal.centerId,
      animalImages: [], // 빈 배열 임시설정
      createdAt: new Date(relatedAnimal.createdAt).toISOString(),
      updatedAt: new Date(relatedAnimal.updatedAt).toISOString(),
    }));

    return c.json({
      animals: animalsResponse,
      total: animalsResponse.length,
    });
  } catch (error) {
    console.error("Related animals error:", error);
    return c.json({ error: "관련 동물 조회 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
