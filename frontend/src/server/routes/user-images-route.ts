import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  uploadToR2,
  deleteFromR2,
  extractR2KeyFromUrl,
  validateImageFile,
  generateSafeFileName,
} from "@/lib/r2-utils";

const app = new OpenAPIHono<AppBindings>();

// POST /users/profile/image - 사용자 프로필 이미지 업로드
app.post("/users/profile/image", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
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

    // R2 버킷 가져오기
    const bucket = c.env.ANIMAL_IMAGES_BUCKET;
    if (!bucket) {
      return c.json({ error: "스토리지 설정이 없습니다" }, 500);
    }

    // 기존 프로필 이미지가 있다면 삭제
    if (currentUser.image) {
      try {
        const oldR2Key = extractR2KeyFromUrl(currentUser.image);
        await deleteFromR2(bucket, oldR2Key);
      } catch (error) {
        console.warn("기존 프로필 이미지 삭제 실패:", error);
        // 기존 이미지 삭제 실패해도 업로드는 계속 진행
      }
    }

    // 안전한 파일명 생성
    const fileName = generateSafeFileName(
      imageFile.name,
      `users/${currentUser.id}`
    );

    // R2에 업로드 (메타데이터 포함)
    const imageUrl = await uploadToR2(imageFile, bucket, fileName, {
      metadata: {
        userId: currentUser.id,
        uploadedBy: currentUser.id,
        originalSize: imageFile.size.toString(),
        imageType: "user_profile",
      },
      httpMetadata: {
        contentType: imageFile.type,
        cacheControl: "public, max-age=31536000", // 1년 캐시
      },
    });

    // DB에 프로필 이미지 URL 업데이트
    await db
      .update(user)
      .set({ image: imageUrl })
      .where(eq(user.id, currentUser.id));

    return c.json(
      {
        message: "프로필 이미지가 성공적으로 업로드되었습니다",
        userId: currentUser.id,
        imageUrl,
        fileName,
      },
      201
    );
  } catch (error) {
    console.error("프로필 이미지 업로드 오류:", error);

    // 오류 타입에 따른 적절한 응답
    if (error instanceof Error) {
      if (error.message.includes("파일")) {
        return c.json({ error: error.message }, 400);
      }
      if (error.message.includes("권한")) {
        return c.json({ error: error.message }, 403);
      }
    }

    return c.json(
      { error: "프로필 이미지 업로드 중 오류가 발생했습니다" },
      500
    );
  }
});

// DELETE /users/profile/image - 사용자 프로필 이미지 삭제
app.delete("/users/profile/image", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const db = getDB(c);

    if (!currentUser.image) {
      return c.json({ error: "삭제할 프로필 이미지가 없습니다" }, 400);
    }

    // R2 버킷 가져오기
    const bucket = c.env.ANIMAL_IMAGES_BUCKET;
    if (!bucket) {
      return c.json({ error: "스토리지 설정이 없습니다" }, 500);
    }

    // R2에서 이미지 삭제
    const r2Key = extractR2KeyFromUrl(currentUser.image);
    await deleteFromR2(bucket, r2Key);

    // DB에서 프로필 이미지 URL 제거
    await db
      .update(user)
      .set({ image: null })
      .where(eq(user.id, currentUser.id));

    return c.json(
      { message: "프로필 이미지가 성공적으로 삭제되었습니다" },
      200
    );
  } catch (error) {
    console.error("프로필 이미지 삭제 오류:", error);
    return c.json({ error: "프로필 이미지 삭제 중 오류가 발생했습니다" }, 500);
  }
});

// GET /users/profile/image - 사용자 프로필 이미지 정보 조회
app.get("/users/profile/image", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    return c.json({
      userId: currentUser.id,
      imageUrl: currentUser.image,
      hasImage: !!currentUser.image,
    });
  } catch (error) {
    console.error("프로필 이미지 조회 오류:", error);
    return c.json({ error: "프로필 이미지 조회 중 오류가 발생했습니다" }, 500);
  }
});

// GET /users/:userId/profile/image - 다른 사용자 프로필 이미지 조회 (공개용)
app.get("/users/:userId/profile/image", async (c) => {
  try {
    const { userId } = c.req.param();
    const db = getDB(c);

    // 사용자 정보 조회
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (targetUser.length === 0) {
      return c.json({ error: "사용자를 찾을 수 없습니다" }, 404);
    }

    return c.json({
      userId: targetUser[0].id,
      imageUrl: targetUser[0].image,
      nickname: targetUser[0].nickname,
      hasImage: !!targetUser[0].image,
    });
  } catch (error) {
    console.error("사용자 프로필 이미지 조회 오류:", error);
    return c.json(
      { error: "사용자 프로필 이미지 조회 중 오류가 발생했습니다" },
      500
    );
  }
});

export default app;
