/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { centers } from "@/db/schema/centers";
import { animals, animalImages } from "@/db/schema/animals";
import { eq, and, desc, like, gte, lte, isNotNull, isNull } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import {
  validatePaginationParams,
  createPaginationResult,
  executeCountQuery,
} from "@/lib/paginate";
import {
  getCentersByLocationRoute,
  getCenterByIdRoute,
  getCenterAnimalsRoute,
  updateCenterRoute,
  getMyCenterRoute,
} from "@/server/openapi/routes/center";

const app = new OpenAPIHono<AppBindings>();

// GET /centers - 센터 목록 조회 (지역명 검색)
// @ts-expect-error - OpenAPI type complexity
app.openapi(getCentersByLocationRoute, async (c) => {
  try {
    const query = c.req.valid("query");
    const db = getDB(c);

    // 검색 조건 생성
    const whereConditions = [];

    if (query.location) {
      whereConditions.push(like(centers.location, `%${query.location}%`));
    }

    if (query.region) {
      whereConditions.push(eq(centers.region, query.region));
    }

    // 모든 센터 조회 (주소 공개 여부와 관계없이)
    const centersList = await db
      .select()
      .from(centers)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(centers.createdAt));

    // 응답 데이터 변환 (주소 공개 여부에 따라 location 정보 조건부 노출)
    const centersResponse = centersList.map((center) => ({
      id: center.id,
      userId: center.userId, // userId 필드 추가
      name: center.name,
      centerNumber: center.centerNumber,
      description: center.description,
      location: center.isPublic ? center.location : null, // 주소 공개 설정에 따라 조건부 노출
      region: center.region,
      phoneNumber: center.phoneNumber,
      adoptionProcedure: center.adoptionProcedure,
      adoptionGuidelines: center.adoptionGuidelines,
      hasMonitoring: center.hasMonitoring,
      monitoringPeriodMonths: center.monitoringPeriodMonths,
      monitoringIntervalDays: center.monitoringIntervalDays,
      monitoringDescription: center.monitoringDescription,
      verified: center.verified,
      isPublic: center.isPublic,
      adoptionPrice: center.adoptionPrice,
      imageUrl: center.imageUrl,
      createdAt: new Date(center.createdAt).toISOString(),
      updatedAt: new Date(center.updatedAt).toISOString(),
    }));

    return c.json({ centers: centersResponse });
  } catch (error) {
    console.error("Centers list error:", error);
    return c.json({ error: "센터 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /centers/animals - 우리 센터에서 등록한 동물 보기
// @ts-expect-error - OpenAPI type complexity
app.openapi(getCenterAnimalsRoute, async (c) => {
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

    const query = c.req.valid("query");
    const db = getDB(c);

    // 사용자의 센터 ID 가져오기
    let centerId: string;
    if (userType === "센터관리자") {
      const userCenters = await db
        .select()
        .from(centers)
        .where(eq(centers.userId, currentUser.id))
        .limit(1);
      console.log(userCenters);
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

    // 페이지네이션 파라미터 검증
    const { page, limit, offset } = validatePaginationParams({
      page: query.page,
      limit: query.limit,
    });

    // 필터 조건 생성
    const whereConditions = [eq(animals.centerId, centerId)];

    if (query.status) {
      whereConditions.push(eq(animals.status, query.status));
    }

    if (query.breed) {
      whereConditions.push(like(animals.breed, `%${query.breed}%`));
    }

    if (query.gender) {
      const isFemale = query.gender === "female";
      whereConditions.push(eq(animals.isFemale, isFemale));
    }

    if (query.weight) {
      switch (query.weight) {
        case "10kg_under":
          whereConditions.push(lte(animals.weight, 10));
          break;
        case "25kg_under":
          whereConditions.push(
            and(gte(animals.weight, 10.1), lte(animals.weight, 25))!
          );
          break;
        case "over_25kg":
          whereConditions.push(gte(animals.weight, 25.1));
          break;
      }
    }

    if (query.age) {
      switch (query.age) {
        case "2_under":
          whereConditions.push(lte(animals.age, 2));
          break;
        case "7_under":
          whereConditions.push(and(gte(animals.age, 3), lte(animals.age, 7))!);
          break;
        case "over_7":
          whereConditions.push(gte(animals.age, 8));
          break;
      }
    }

    if (query.hasTrainerComment) {
      if (query.hasTrainerComment === "true") {
        whereConditions.push(isNotNull(animals.trainerComment));
      } else {
        whereConditions.push(isNull(animals.trainerComment));
      }
    }

    // 전체 개수 조회
    const total = await executeCountQuery(db as any, animals, whereConditions);

    // 동물 목록 조회 (이미지와 함께)
    const animalsList = await db
      .select()
      .from(animals)
      .leftJoin(animalImages, eq(animals.id, animalImages.animalId))
      .where(and(...whereConditions))
      .orderBy(desc(animals.createdAt))
      .limit(limit)
      .offset(offset);

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
          createdAt: new Date(animal.createdAt as string | number | Date).toISOString(),
          updatedAt: new Date(animal.updatedAt as string | number | Date).toISOString(),
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
    console.error("Center animals list error:", error);
    return c.json({ error: "센터 동물 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /centers/{id} - 보호소 상세 정보 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getCenterByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const db = getDB(c);

    // 보호소 조회
    const center = await db
      .select()
      .from(centers)
      .where(eq(centers.id, id))
      .limit(1);

    if (center.length === 0) {
      return c.json({ error: "보호소를 찾을 수 없습니다123" }, 404);
    }

    const centerData = center[0];

    // 응답 데이터 변환 (주소 공개 여부에 따라 location 정보 조건부 노출)
    const responseData = {
      id: centerData.id,
      userId: centerData.userId, // userId 필드 추가
      name: centerData.name,
      centerNumber: centerData.centerNumber,
      description: centerData.description,
      location: centerData.isPublic ? centerData.location : null, // 주소 공개 설정에 따라 조건부 노출
      region: centerData.region,
      phoneNumber: centerData.phoneNumber,
      adoptionProcedure: centerData.adoptionProcedure,
      adoptionGuidelines: centerData.adoptionGuidelines,
      hasMonitoring: centerData.hasMonitoring,
      monitoringPeriodMonths: centerData.monitoringPeriodMonths,
      monitoringIntervalDays: centerData.monitoringIntervalDays,
      monitoringDescription: centerData.monitoringDescription,
      verified: centerData.verified,
      isPublic: centerData.isPublic,
      adoptionPrice: centerData.adoptionPrice,
      imageUrl: centerData.imageUrl,
      createdAt: new Date(centerData.createdAt).toISOString(),
      updatedAt: new Date(centerData.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Center detail error:", error);
    return c.json({ error: "보호소 정보 조회 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /centers/settings - 센터 설정 수정
// @ts-expect-error - OpenAPI type complexity
app.openapi(updateCenterRoute, async (c) => {
  try {
    // 권한 체크
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json(
        { error: "센터 관리자만 센터 설정을 수정할 수 있습니다" },
        403
      );
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 사용자의 센터 찾기
    const userCenters = await db
      .select()
      .from(centers)
      .where(eq(centers.userId, currentUser.id))
      .limit(1);

    if (userCenters.length === 0) {
      return c.json({ error: "등록된 센터가 없습니다" }, 404);
    }

    const userCenter = userCenters[0];

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof centers.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.centerNumber !== undefined)
      updateData.centerNumber = body.centerNumber;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.region !== undefined)
      updateData.region = body.region as
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
        | "제주";
    if (body.phoneNumber !== undefined)
      updateData.phoneNumber = body.phoneNumber;
    if (body.adoptionProcedure !== undefined)
      updateData.adoptionProcedure = body.adoptionProcedure;
    if (body.adoptionGuidelines !== undefined)
      updateData.adoptionGuidelines = body.adoptionGuidelines;
    if (body.hasMonitoring !== undefined)
      updateData.hasMonitoring = body.hasMonitoring;
    if (body.monitoringPeriodMonths !== undefined)
      updateData.monitoringPeriodMonths = body.monitoringPeriodMonths;
    if (body.monitoringIntervalDays !== undefined)
      updateData.monitoringIntervalDays = body.monitoringIntervalDays;
    if (body.monitoringDescription !== undefined)
      updateData.monitoringDescription = body.monitoringDescription;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.adoptionPrice !== undefined)
      updateData.adoptionPrice = body.adoptionPrice;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    // DB 업데이트
    const updatedResult = await db
      .update(centers)
      .set(updateData)
      .where(eq(centers.id, userCenter.id))
      .returning();

    const updatedCenter = updatedResult[0];
    const responseData = {
      id: updatedCenter.id,
      name: updatedCenter.name,
      centerNumber: updatedCenter.centerNumber,
      description: updatedCenter.description,
      location: updatedCenter.location,
      region: updatedCenter.region,
      phoneNumber: updatedCenter.phoneNumber,
      adoptionProcedure: updatedCenter.adoptionProcedure,
      adoptionGuidelines: updatedCenter.adoptionGuidelines,
      hasMonitoring: updatedCenter.hasMonitoring,
      monitoringPeriodMonths: updatedCenter.monitoringPeriodMonths,
      monitoringIntervalDays: updatedCenter.monitoringIntervalDays,
      monitoringDescription: updatedCenter.monitoringDescription,
      verified: updatedCenter.verified,
      isPublic: updatedCenter.isPublic,
      adoptionPrice: updatedCenter.adoptionPrice,
      imageUrl: updatedCenter.imageUrl,
      createdAt: new Date(updatedCenter.createdAt).toISOString(),
      updatedAt: new Date(updatedCenter.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Center update error:", error);
    return c.json({ error: "센터 설정 수정 중 오류가 발생했습니다" }, 500);
  }
});

// GET /centers/me - 내 센터 정보 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getMyCenterRoute, async (c) => {
  try {
    console.log("GET /centers/me - 시작");

    // 권한 체크
    const currentUser = await getCurrentUser(c);
    console.log("GET /centers/me - currentUser:", currentUser);

    if (!currentUser) {
      console.log("GET /centers/me - 사용자 인증 실패");
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    console.log("GET /centers/me - userType:", userType);

    if (!userType || userType !== "센터관리자") {
      console.log("GET /centers/me - 권한 없음:", userType);
      return c.json({ error: "센터 관리자 권한이 필요합니다" }, 403);
    }

    const db = getDB(c);
    console.log("GET /centers/me - DB 연결 성공");

    // 사용자의 센터 찾기
    const userCenters = await db
      .select()
      .from(centers)
      .where(eq(centers.userId, currentUser.id))
      .limit(1);

    console.log("GET /centers/me - userCenters 조회 결과:", userCenters);

    if (userCenters.length === 0) {
      console.log("GET /centers/me - 센터 없음");
      return c.json({ error: "등록된 센터가 없습니다" }, 404);
    }

    const userCenter = userCenters[0];
    console.log("GET /centers/me - userCenter:", userCenter);

    // 응답 데이터 변환
    const responseData = {
      id: userCenter.id,
      userId: userCenter.userId,
      name: userCenter.name,
      centerNumber: userCenter.centerNumber,
      description: userCenter.description,
      location: userCenter.location,
      region: userCenter.region,
      phoneNumber: userCenter.phoneNumber,
      adoptionProcedure: userCenter.adoptionProcedure,
      adoptionGuidelines: userCenter.adoptionGuidelines,
      hasMonitoring: userCenter.hasMonitoring,
      monitoringPeriodMonths: userCenter.monitoringPeriodMonths,
      monitoringIntervalDays: userCenter.monitoringIntervalDays,
      monitoringDescription: userCenter.monitoringDescription,
      verified: userCenter.verified,
      isPublic: userCenter.isPublic,
      adoptionPrice: userCenter.adoptionPrice,
      imageUrl: userCenter.imageUrl,
      isSubscriber: userCenter.isSubscriber,
      createdAt: new Date(userCenter.createdAt).toISOString(),
      updatedAt: new Date(userCenter.updatedAt).toISOString(),
    };

    console.log("GET /centers/me - 응답 데이터:", responseData);
    return c.json(responseData);
  } catch (error) {
    console.error("Get my center error:", error);
    return c.json({ error: "센터 정보를 가져오는데 실패했습니다" }, 500);
  }
});

export default app;
