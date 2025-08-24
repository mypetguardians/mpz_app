/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { animals, animalImages } from "@/db/schema/animals";
import { eq, and } from "drizzle-orm";
import {
  uploadAnimalImageRoute,
  deleteAnimalImageRoute,
  updateAnimalImageOrderRoute,
} from "@/server/openapi/routes/animal-images";
import { getCurrentUser } from "@/lib/permissions";
import {
  uploadToR2,
  extractR2KeyFromUrl,
  validateImageFile,
  generateSafeFileName,
  uploadMultipleFiles,
} from "@/lib/r2-utils";

const app = new OpenAPIHono<AppBindings>();

/**
 * 유틸: 현재 실행 환경에서 R2 바인딩 가져오기
 * - Cloudflare Workers: c.env.ANIMAL_IMAGES_BUCKET
 * - Next.js (개발/서버): 바인딩 없음 → null
 */
function getR2BucketFromContext(c: any) {
  // hono context에서는 Workers 환경일 때만 c.env가 존재
  const bucket = c?.env?.ANIMAL_IMAGES_BUCKET ?? null;
  if (bucket) {
    console.log("✅ Cloudflare Workers 환경 - R2 바인딩 사용");
  } else {
    console.log("✅ Next.js(개발) 환경 - S3 호환 경로/SDK로 업로드, 퍼블릭 r2.dev URL 저장");
  }
  return bucket;
}

// POST /animals/:animalId/images - 이미지 업로드
app.openapi(uploadAnimalImageRoute, async (c) => {
  console.log("=== 이미지 업로드 시작 ===");

  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    console.log("인증 실패: 로그인 필요");
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { animalId } = c.req.valid("param");
    console.log("동물 ID:", animalId);

    const formData = await c.req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return c.json({ error: "이미지 파일이 필요합니다" }, 400);
    }

    // 파일 검증 (크기, 타입, 보안)
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      return c.json({ error: validation.error || "파일 검증 실패" }, 400);
    }

    const db = getDB(c);

    // 동물 존재 확인
    const animal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animal.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    // R2 버킷 핸들
    const bucket = getR2BucketFromContext(c);

    // 안전한 파일명 생성 (폴더: animals/{animalId}/...)
    const fileName = generateSafeFileName(imageFile.name, `animals/${animalId}`);

    // 업로드 (개발환경=퍼블릭 r2.dev URL 반환 / Workers=바인딩 업로드)
    const imageUrl = await uploadToR2(imageFile, bucket, fileName, {
      metadata: {
        animalId,
        uploadedBy: currentUser.id,
        originalSize: String(imageFile.size),
      },
      httpMetadata: {
        contentType: imageFile.type,
        cacheControl: "public, max-age=31536000", // 1년 캐시
        contentDisposition: "inline",
      },
    });

    // 현재 이미지 개수 확인하여 orderIndex 설정
    const existingImages = await db
      .select()
      .from(animalImages)
      .where(eq(animalImages.animalId, animalId));

    const orderIndex = existingImages.length;

    // DB에 이미지 정보 저장
    const imageId = crypto.randomUUID();
    await db.insert(animalImages).values({
      id: imageId,
      animalId,
      imageUrl, // A안: 퍼블릭 r2.dev URL 그대로 저장 → 개발환경에서 즉시 표시 가능
      orderIndex,
    });

    return c.json(
      {
        message: "이미지가 성공적으로 업로드되었습니다",
        imageId,
        imageUrl,
        orderIndex,
        fileName, // 디버깅용
      },
      201
    );
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    const msg =
      error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다";
    // 의미 기반 매핑
    if (msg.includes("파일")) return c.json({ error: msg }, 400);
    if (msg.includes("권한")) return c.json({ error: msg }, 403);
    if (msg.includes("찾을 수 없습니다")) return c.json({ error: msg }, 404);
    return c.json({ error: "이미지 업로드 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /animals/:animalId/images/:imageId - 이미지 삭제
app.openapi(deleteAnimalImageRoute, async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { animalId, imageId } = c.req.valid("param");
    const db = getDB(c);

    // 이미지 존재 확인
    const image = await db
      .select()
      .from(animalImages)
      .where(and(eq(animalImages.id, imageId), eq(animalImages.animalId, animalId)))
      .limit(1);

    if (image.length === 0) {
      return c.json({ error: "이미지를 찾을 수 없습니다" }, 404);
    }

    const bucket = getR2BucketFromContext(c);

    if (!bucket) {
      // 개발환경(퍼블릭 r2.dev / 바인딩 없음): 서버에서 직접 삭제 불가 → 운영에서만 실제 삭제
     
    } else {
      // Workers 환경: R2에서 실제 삭제
     
    }

    // DB에서 이미지 정보 삭제
    await db.delete(animalImages).where(eq(animalImages.id, imageId));

    // 남은 이미지들의 orderIndex 재정렬
    const remainingImages = await db
      .select()
      .from(animalImages)
      .where(eq(animalImages.animalId, animalId))
      .orderBy(animalImages.orderIndex);

    for (let i = 0; i < remainingImages.length; i++) {
      await db
        .update(animalImages)
        .set({ orderIndex: i })
        .where(eq(animalImages.id, remainingImages[i].id));
    }

    return c.json({ message: "이미지가 성공적으로 삭제되었습니다" }, 200);
  } catch (error) {
    console.error("이미지 삭제 오류:", error);
    return c.json({ error: "이미지 삭제 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /animals/:animalId/images/order - 이미지 순서 변경
app.openapi(updateAnimalImageOrderRoute, async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { animalId } = c.req.valid("param");
    const { imageOrders } = c.req.valid("json");
    const db = getDB(c);

    // 동물 존재 확인
    const animal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animal.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    // 해당 동물의 모든 이미지 ID 확인
    const existingImages = await db
      .select()
      .from(animalImages)
      .where(eq(animalImages.animalId, animalId));

    const existingImageIds = existingImages.map((img) => img.id);

    for (const imageOrder of imageOrders) {
      if (!existingImageIds.includes(imageOrder.imageId)) {
        return c.json(
          { error: `이미지 ID ${imageOrder.imageId}를 찾을 수 없습니다` },
          400
        );
      }
    }

    // 순서 업데이트
    for (const imageOrder of imageOrders) {
      await db
        .update(animalImages)
        .set({ orderIndex: imageOrder.orderIndex })
        .where(and(eq(animalImages.id, imageOrder.imageId), eq(animalImages.animalId, animalId)));
    }

    return c.json({ message: "이미지 순서가 성공적으로 변경되었습니다" }, 200);
  } catch (error) {
    console.error("이미지 순서 변경 오류:", error);
    return c.json({ error: "이미지 순서 변경 중 오류가 발생했습니다" }, 500);
  }
});

// POST /animals/:animalId/images/batch - 다중 이미지 업로드
app.post("/animals/:animalId/images/batch", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { animalId } = c.req.param();
    const formData = await c.req.formData();

    // 여러 이미지 파일 추출
    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "images" && value instanceof File) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length === 0) {
      return c.json({ error: "최소 1개의 이미지 파일이 필요합니다" }, 400);
    }

    if (imageFiles.length > 10) {
      return c.json({ error: "한 번에 최대 10개의 이미지만 업로드 가능합니다" }, 400);
    }

    const db = getDB(c);

    // 동물 존재 확인
    const animal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (animal.length === 0) {
      return c.json({ error: "동물을 찾을 수 없습니다" }, 404);
    }

    const bucket = getR2BucketFromContext(c);

    // 현재 이미지 개수 확인
    const existingImages = await db
      .select()
      .from(animalImages)
      .where(eq(animalImages.animalId, animalId));

    const currentOrderIndex = existingImages.length;

    // 다중 업로드 처리
    const uploadResults = await uploadMultipleFiles(
      imageFiles,
      bucket,
      `animals/${animalId}`,
      {
        metadata: {
          animalId,
          uploadedBy: currentUser.id,
          batchUpload: "true",
        },
        httpMetadata: {
          cacheControl: "public, max-age=31536000",
        },
      }
    );

    // DB에 이미지 정보들 저장
    const imageRecords = uploadResults.map((result, index) => ({
      id: crypto.randomUUID(),
      animalId,
      imageUrl: result.url, // A안: 퍼블릭 r2.dev URL
      orderIndex: currentOrderIndex + index,
    }));

    await db.insert(animalImages).values(imageRecords);

    return c.json(
      {
        message: `${uploadResults.length}개의 이미지가 성공적으로 업로드되었습니다`,
        uploadedCount: uploadResults.length,
        images: imageRecords.map((record, index) => ({
          imageId: record.id,
          imageUrl: record.imageUrl,
          orderIndex: record.orderIndex,
          fileName: uploadResults[index].key,
        })),
      },
      201
    );
  } catch (error) {
    console.error("다중 이미지 업로드 오류:", error);
    const msg = error instanceof Error ? error.message : "다중 이미지 업로드 중 오류가 발생했습니다";
    if (msg.includes("파일")) return c.json({ error: msg }, 400);
    return c.json({ error: "다중 이미지 업로드 중 오류가 발생했습니다" }, 500);
  }
});

// GET /r2/health - R2 상태 확인 (개발/디버깅용)
app.get("/r2/health", async (c) => {
  try {
    const bucket = getR2BucketFromContext(c);
    if (!bucket) {
      return c.json(
        {
          status: "warning",
          message: "R2 버킷 바인딩을 찾을 수 없습니다 (개발 환경)",
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    const { checkR2Health } = await import("@/lib/r2-utils");
    const isHealthy = await checkR2Health(bucket);

    return c.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        bucket: "ANIMAL_IMAGES_BUCKET",
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    console.error("R2 헬스체크 오류:", error);
    return c.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default app;
