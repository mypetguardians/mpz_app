import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { posts, postImages } from "@/db/schema/posts";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  uploadToR2,
  deleteFromR2,
  extractR2KeyFromUrl,
  validateImageFile,
  generateSafeFileName,
  uploadMultipleFiles,
} from "@/lib/r2-utils";

const app = new OpenAPIHono<AppBindings>();

// POST /posts/:postId/images - 포스트 이미지 업로드
app.post("/posts/:postId/images", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { postId } = c.req.param();
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

    // 포스트 존재 확인
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return c.json({ error: "포스트를 찾을 수 없습니다" }, 404);
    }

    // 권한 확인 (포스트 작성자만)
    if (post[0].userId !== currentUser.id) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    // R2 버킷 가져오기
    const bucket = c.env.ANIMAL_IMAGES_BUCKET;
    if (!bucket) {
      return c.json({ error: "스토리지 설정이 없습니다" }, 500);
    }

    // 안전한 파일명 생성
    const fileName = generateSafeFileName(imageFile.name, `posts/${postId}`);

    // R2에 업로드 (메타데이터 포함)
    const imageUrl = await uploadToR2(imageFile, bucket, fileName, {
      metadata: {
        postId,
        uploadedBy: currentUser.id,
        originalSize: imageFile.size.toString(),
        imageType: "post_content",
      },
      httpMetadata: {
        contentType: imageFile.type,
        cacheControl: "public, max-age=31536000", // 1년 캐시
      },
    });

    // 현재 이미지 개수 확인하여 orderIndex 설정
    const existingImages = await db
      .select()
      .from(postImages)
      .where(eq(postImages.postId, postId));

    const orderIndex = existingImages.length;

    // DB에 이미지 정보 저장
    const imageId = crypto.randomUUID();
    await db.insert(postImages).values({
      id: imageId,
      postId,
      imageUrl,
      orderIndex,
    });

    return c.json(
      {
        message: "포스트 이미지가 성공적으로 업로드되었습니다",
        imageId,
        imageUrl,
        orderIndex,
        fileName,
      },
      201
    );
  } catch (error) {
    console.error("포스트 이미지 업로드 오류:", error);

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

    return c.json(
      { error: "포스트 이미지 업로드 중 오류가 발생했습니다" },
      500
    );
  }
});

// POST /posts/:postId/images/batch - 포스트 다중 이미지 업로드
app.post("/posts/:postId/images/batch", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { postId } = c.req.param();
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

    // 최대 업로드 개수 제한 (포스트는 최대 5개)
    if (imageFiles.length > 5) {
      return c.json(
        { error: "포스트당 최대 5개의 이미지만 업로드 가능합니다" },
        400
      );
    }

    const db = getDB(c);

    // 포스트 존재 확인
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return c.json({ error: "포스트를 찾을 수 없습니다" }, 404);
    }

    // 권한 확인 (포스트 작성자만)
    if (post[0].userId !== currentUser.id) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    // R2 버킷 가져오기
    const bucket = c.env.ANIMAL_IMAGES_BUCKET;
    console.log("R2 버킷 확인:", {
      bucketExists: !!bucket,
      bucketType: typeof bucket,
      envKeys: Object.keys(c.env),
    });

    if (!bucket) {
      console.error("R2 버킷이 설정되지 않았습니다. 환경 변수:", c.env);
      return c.json({ error: "스토리지 설정이 없습니다" }, 500);
    }

    // 현재 이미지 개수 확인
    const existingImages = await db
      .select()
      .from(postImages)
      .where(eq(postImages.postId, postId));

    const currentOrderIndex = existingImages.length;

    // 다중 업로드 처리
    console.log("R2 업로드 시작:", {
      fileCount: imageFiles.length,
      postId,
      userId: currentUser.id,
    });

    let uploadResults;
    try {
      uploadResults = await uploadMultipleFiles(
        imageFiles,
        bucket,
        `posts/${postId}`,
        {
          metadata: {
            postId,
            uploadedBy: currentUser.id,
            batchUpload: "true",
            imageType: "post_content",
          },
          httpMetadata: {
            cacheControl: "public, max-age=31536000",
          },
        }
      );
      console.log("R2 업로드 성공:", uploadResults.length, "개 파일");
    } catch (uploadError) {
      console.error("R2 업로드 실패:", uploadError);
      throw new Error(
        `R2 업로드 실패: ${
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError)
        }`
      );
    }

    // DB에 이미지 정보들 저장
    const imageRecords = uploadResults.map((result, index) => ({
      id: crypto.randomUUID(),
      postId,
      imageUrl: result.url,
      orderIndex: currentOrderIndex + index,
    }));

    console.log("저장할 이미지 레코드:", imageRecords);

    try {
      await db.insert(postImages).values(imageRecords);
      console.log("이미지 레코드 저장 성공");
    } catch (dbError) {
      console.error("데이터베이스 저장 실패:", dbError);
      throw new Error(
        `데이터베이스 저장 실패: ${
          dbError instanceof Error ? dbError.message : String(dbError)
        }`
      );
    }

    return c.json(
      {
        message: `${uploadResults.length}개의 포스트 이미지가 성공적으로 업로드되었습니다`,
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
    console.error("포스트 다중 이미지 업로드 오류:", error);

    // 더 구체적인 에러 처리
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
      if (error.message.includes("스토리지") || error.message.includes("R2")) {
        return c.json({ error: "스토리지 서비스 연결에 실패했습니다" }, 500);
      }
      if (error.message.includes("데이터베이스")) {
        return c.json({ error: "데이터베이스 연결에 실패했습니다" }, 500);
      }
    }

    // 에러 타입별 상세 로깅
    console.error("에러 타입:", typeof error);
    console.error(
      "에러 스택:",
      error instanceof Error ? error.stack : "스택 없음"
    );
    console.error(
      "에러 메시지:",
      error instanceof Error ? error.message : String(error)
    );

    return c.json(
      { error: "포스트 다중 이미지 업로드 중 오류가 발생했습니다" },
      500
    );
  }
});

// DELETE /posts/:postId/images/:imageId - 포스트 이미지 삭제
app.delete("/posts/:postId/images/:imageId", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { postId, imageId } = c.req.param();
    const db = getDB(c);

    // 이미지 존재 확인
    const image = await db
      .select()
      .from(postImages)
      .where(and(eq(postImages.id, imageId), eq(postImages.postId, postId)))
      .limit(1);

    if (image.length === 0) {
      return c.json({ error: "이미지를 찾을 수 없습니다" }, 404);
    }

    // 포스트 소유자 확인
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return c.json({ error: "포스트를 찾을 수 없습니다" }, 404);
    }

    if (post[0].userId !== currentUser.id) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    // R2 버킷 가져오기
    const bucket = c.env.ANIMAL_IMAGES_BUCKET;
    if (!bucket) {
      return c.json({ error: "스토리지 설정이 없습니다" }, 500);
    }

    // R2에서 이미지 삭제
    const r2Key = extractR2KeyFromUrl(image[0].imageUrl);
    await deleteFromR2(bucket, r2Key);

    // DB에서 이미지 정보 삭제
    await db.delete(postImages).where(eq(postImages.id, imageId));

    // 남은 이미지들의 orderIndex 재정렬
    const remainingImages = await db
      .select()
      .from(postImages)
      .where(eq(postImages.postId, postId))
      .orderBy(postImages.orderIndex);

    for (let i = 0; i < remainingImages.length; i++) {
      await db
        .update(postImages)
        .set({ orderIndex: i })
        .where(eq(postImages.id, remainingImages[i].id));
    }

    return c.json(
      { message: "포스트 이미지가 성공적으로 삭제되었습니다" },
      200
    );
  } catch (error) {
    console.error("포스트 이미지 삭제 오류:", error);
    return c.json({ error: "포스트 이미지 삭제 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /posts/:postId/images/order - 포스트 이미지 순서 변경
app.put("/posts/:postId/images/order", async (c) => {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return c.json({ error: "로그인이 필요합니다" }, 401);
  }

  try {
    const { postId } = c.req.param();
    const body = await c.req.json();
    const { imageOrders } = body;

    if (!Array.isArray(imageOrders)) {
      return c.json({ error: "imageOrders는 배열이어야 합니다" }, 400);
    }

    const db = getDB(c);

    // 포스트 존재 및 권한 확인
    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return c.json({ error: "포스트를 찾을 수 없습니다" }, 404);
    }

    if (post[0].userId !== currentUser.id) {
      return c.json({ error: "권한이 없습니다" }, 403);
    }

    // 해당 포스트의 모든 이미지 ID 확인
    const existingImages = await db
      .select()
      .from(postImages)
      .where(eq(postImages.postId, postId));

    const existingImageIds = existingImages.map((img) => img.id);

    // 요청된 이미지 ID들이 모두 존재하는지 확인
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
        .update(postImages)
        .set({ orderIndex: imageOrder.orderIndex })
        .where(
          and(
            eq(postImages.id, imageOrder.imageId),
            eq(postImages.postId, postId)
          )
        );
    }

    return c.json(
      { message: "포스트 이미지 순서가 성공적으로 변경되었습니다" },
      200
    );
  } catch (error) {
    console.error("포스트 이미지 순서 변경 오류:", error);
    return c.json(
      { error: "포스트 이미지 순서 변경 중 오류가 발생했습니다" },
      500
    );
  }
});

export default app;
