import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { centers } from "@/db/schema/centers";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  uploadToR2,
  deleteFromR2,
  extractR2KeyFromUrl,
  validateImageFile,
  generateSafeFileName,
} from "@/lib/r2-utils";
import { isCenterOwner } from "@/lib/permissions";

const app = new OpenAPIHono<AppBindings>();

// POST /centers/:centerId/image - 센터 이미지 업로드
app.post("/centers/:centerId/image", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { centerId } = c.req.param();
    const formData = await c.req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return c.json({ error: "이미지 파일이 필요합니다" }, 400);
    }

    // 파일 검증 (크기, 타입, 보안)
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      return c.json({ error: validation.error || "파일 검증 실패" }, 400);
    }

    const db = getDB(c);

    // 센터 존재 확인
    const center = await db
      .select()
      .from(centers)
      .where(eq(centers.id, centerId))
      .limit(1);

    if (center.length === 0) {
      return c.json({ error: "센터를 찾을 수 없습니다" }, 404);
    }

    const hasPermission = await isCenterOwner(c, centerId);
    if (!hasPermission) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    // R2 버킷 가져오기
    const bucket = c.env.ANIMAL_IMAGES_BUCKET;
    if (!bucket) {
      return c.json({ error: "스토리지 설정이 없습니다" }, 500);
    }

    // 기존 이미지가 있다면 삭제
    if (center[0].imageUrl) {
      try {
        const oldR2Key = extractR2KeyFromUrl(center[0].imageUrl);
        await deleteFromR2(bucket, oldR2Key);
      } catch (error) {
        console.warn("기존 이미지 삭제 실패:", error);
        // 기존 이미지 삭제 실패해도 업로드는 계속 진행
      }
    }

    // 안전한 파일명 생성
    const fileName = generateSafeFileName(
      imageFile.name,
      `centers/${centerId}`
    );

    // R2에 업로드 (메타데이터 포함)
    const imageUrl = await uploadToR2(imageFile, bucket, fileName, {
      metadata: {
        centerId,
        uploadedBy: currentUser.id,
        originalSize: imageFile.size.toString(),
        imageType: "center_profile",
      },
      httpMetadata: {
        contentType: imageFile.type,
        cacheControl: "public, max-age=31536000", // 1년 캐시
      },
    });

    // DB에 이미지 URL 업데이트
    await db.update(centers).set({ imageUrl }).where(eq(centers.id, centerId));

    return c.json(
      {
        message: "센터 이미지가 성공적으로 업로드되었습니다",
        centerId,
        imageUrl,
        fileName,
      },
      201
    );
  } catch (error) {
    console.error("센터 이미지 업로드 오류:", error);

    // 오류 타입에 따른 적절한 응답
    if (error instanceof Error) {
      if (error.message.includes("파일")) {
        return c.json({ error: error.message }, 400);
      }
      if (error.message.includes("권한")) {
        return c.json({ error: error.message }, 403);
      }
      if (error.message.includes("찾을 수 없습니다")) {
        return c.json({ error: error.message }, 404);
      }
    }

    return c.json({ error: "센터 이미지 업로드 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /centers/:centerId/image - 센터 이미지 삭제
app.delete("/centers/:centerId/image", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { centerId } = c.req.param();
    const db = getDB(c);

    // 센터 존재 확인
    const center = await db
      .select()
      .from(centers)
      .where(eq(centers.id, centerId))
      .limit(1);

    if (center.length === 0) {
      return c.json({ error: "센터를 찾을 수 없습니다" }, 404);
    }

    if (!center[0].imageUrl) {
      return c.json({ error: "삭제할 이미지가 없습니다" }, 400);
    }

    // TODO: 권한 확인
    const hasPermission = await isCenterOwner(c, centerId);
    if (!hasPermission) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    // R2 버킷 가져오기
    const bucket = c.env.ANIMAL_IMAGES_BUCKET;
    if (!bucket) {
      return c.json({ error: "스토리지 설정이 없습니다" }, 500);
    }

    // R2에서 이미지 삭제
    const r2Key = extractR2KeyFromUrl(center[0].imageUrl);
    await deleteFromR2(bucket, r2Key);

    // DB에서 이미지 URL 제거
    await db
      .update(centers)
      .set({ imageUrl: null })
      .where(eq(centers.id, centerId));

    return c.json({ message: "센터 이미지가 성공적으로 삭제되었습니다" }, 200);
  } catch (error) {
    console.error("센터 이미지 삭제 오류:", error);
    return c.json({ error: "센터 이미지 삭제 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
