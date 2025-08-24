import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { banners } from "@/db/schema/banners";
import { eq, and, desc, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/permissions";
import {
  getBannersRoute,
  createBannerRoute,
  updateBannerRoute,
  deleteBannerRoute,
  uploadBannerImageRoute,
} from "@/server/openapi/routes/banner";
import {
  validateImageFile,
  generateSafeFileName,
  uploadToR2,
  deleteFromR2,
} from "@/lib/r2-utils";

const app = new OpenAPIHono<AppBindings>();

// 권한 체크 함수
async function checkSuperAdminPermission(c: any) {
  const currentUser = await getCurrentUser(c);
  if (!currentUser) {
    return { error: "로그인이 필요합니다", status: 401 };
  }

  if (currentUser.userType !== "최고관리자") {
    return { error: "최고관리자만 접근 가능합니다", status: 403 };
  }

  return { currentUser };
}

// GET /banner - 배너 목록 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getBannersRoute, async (c) => {
  try {
    const db = getDB(c);
    const query = c.req.valid("query");

    // 쿼리 조건 구성
    const whereConditions = [];

    if (query.type) {
      whereConditions.push(eq(banners.type, query.type));
    }

    whereConditions.push(eq(banners.isActive, true));

    // 배너 목록 조회 (활성화된 것만, 순서대로)
    const bannersList = await db
      .select()
      .from(banners)
      .where(and(...whereConditions))
      .orderBy(asc(banners.orderIndex), desc(banners.createdAt));

    // 응답 데이터 변환
    const bannersResponse = bannersList.map((banner) => ({
      id: banner.id,
      type: banner.type,
      title: banner.title || null,
      description: banner.description || null,
      alt: banner.alt,
      imageUrl: banner.imageUrl,
      orderIndex: banner.orderIndex,
      isActive: banner.isActive,
      linkUrl: banner.linkUrl || null,
      createdAt: new Date(banner.createdAt).toISOString(),
      updatedAt: new Date(banner.updatedAt).toISOString(),
    }));

    return c.json({
      banners: bannersResponse,
      total: bannersResponse.length,
    });
  } catch (error) {
    console.error("배너 목록 조회 오류:", error);
    return c.json({ error: "배너 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// POST /banner/image - 배너 이미지 업로드
// @ts-expect-error - OpenAPI type complexity
app.openapi(uploadBannerImageRoute, async (c) => {
  try {
    // 권한 체크
    const permissionCheck = await checkSuperAdminPermission(c);
    if ("error" in permissionCheck) {
      return c.json({ error: permissionCheck.error }, permissionCheck.status);
    }

    const formData = await c.req.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      return c.json({ error: "이미지 파일이 필요합니다" }, 400);
    }

    // 이미지 파일 검증
    const validation = validateImageFile(imageFile);
    if (!validation.isValid) {
      return c.json({ error: validation.error }, 400);
    }

    const db = getDB(c);

    // 안전한 파일명 생성
    const fileName = generateSafeFileName(imageFile.name, "banner");
    const r2Key = `banner-images/${fileName}`;

    // R2에 업로드
    const uploadResult = await uploadToR2(imageFile, r2Key, {
      metadata: {
        uploadedBy: permissionCheck.currentUser.id,
        originalSize: imageFile.size.toString(),
        type: "banner",
      },
      httpMetadata: {
        cacheControl: "public, max-age=31536000", // 1년 캐시
      },
    });

    if (!uploadResult.success) {
      return c.json({ error: "이미지 업로드에 실패했습니다" }, 500);
    }

    return c.json({
      imageUrl: uploadResult.publicUrl,
      message: "배너 이미지가 성공적으로 업로드되었습니다",
    });
  } catch (error) {
    console.error("배너 이미지 업로드 오류:", error);
    return c.json({ error: "이미지 업로드 중 오류가 발생했습니다" }, 500);
  }
});

// POST /banner - 배너 생성
// @ts-expect-error - OpenAPI type complexity
app.openapi(createBannerRoute, async (c) => {
  try {
    // 권한 체크
    const permissionCheck = await checkSuperAdminPermission(c);
    if ("error" in permissionCheck) {
      return c.json({ error: permissionCheck.error }, permissionCheck.status);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // 배너 생성
    const newBanner = await db
      .insert(banners)
      .values({
        type: body.type,
        title: body.title || null,
        description: body.description || null,
        alt: body.alt,
        imageUrl: body.imageUrl || "", // 이미지 URL은 별도 업로드 후 설정
        orderIndex: body.orderIndex || 0,
        isActive: body.isActive ?? true,
        linkUrl: body.linkUrl || null,
      })
      .returning();

    const createdBanner = newBanner[0];

    return c.json(
      {
        id: createdBanner.id,
        type: createdBanner.type,
        title: createdBanner.title || null,
        description: createdBanner.description || null,
        alt: createdBanner.alt,
        imageUrl: createdBanner.imageUrl,
        orderIndex: createdBanner.orderIndex,
        isActive: createdBanner.isActive,
        linkUrl: createdBanner.linkUrl || null,
        createdAt: new Date(createdBanner.createdAt).toISOString(),
        updatedAt: new Date(createdBanner.updatedAt).toISOString(),
      },
      201
    );
  } catch (error) {
    console.error("배너 생성 오류:", error);
    return c.json({ error: "배너 생성 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /banner/{id} - 배너 수정
// @ts-expect-error - OpenAPI type complexity
app.openapi(updateBannerRoute, async (c) => {
  try {
    // 권한 체크
    const permissionCheck = await checkSuperAdminPermission(c);
    if ("error" in permissionCheck) {
      return c.json({ error: permissionCheck.error }, permissionCheck.status);
    }

    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 기존 배너 조회
    const existingBanner = await db
      .select()
      .from(banners)
      .where(eq(banners.id, id))
      .limit(1);

    if (existingBanner.length === 0) {
      return c.json({ error: "배너를 찾을 수 없습니다" }, 404);
    }

    // 업데이트할 데이터 구성
    const updateData: any = {};

    if (body.type !== undefined) updateData.type = body.type;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.alt !== undefined) updateData.alt = body.alt;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.orderIndex !== undefined) updateData.orderIndex = body.orderIndex;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.linkUrl !== undefined) updateData.linkUrl = body.linkUrl;

    updateData.updatedAt = new Date();

    // 배너 업데이트
    const updatedBanner = await db
      .update(banners)
      .set(updateData)
      .where(eq(banners.id, id))
      .returning();

    const banner = updatedBanner[0];

    return c.json({
      id: banner.id,
      type: banner.type,
      title: banner.title || null,
      description: banner.description || null,
      alt: banner.alt,
      imageUrl: banner.imageUrl,
      orderIndex: banner.orderIndex,
      isActive: banner.isActive,
      linkUrl: banner.linkUrl || null,
      createdAt: new Date(banner.createdAt).toISOString(),
      updatedAt: new Date(banner.updatedAt).toISOString(),
    });
  } catch (error) {
    console.error("배너 수정 오류:", error);
    return c.json({ error: "배너 수정 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /banner/{id} - 배너 삭제
// @ts-expect-error - OpenAPI type complexity
app.openapi(deleteBannerRoute, async (c) => {
  try {
    // 권한 체크
    const permissionCheck = await checkSuperAdminPermission(c);
    if ("error" in permissionCheck) {
      return c.json({ error: permissionCheck.error }, permissionCheck.status);
    }

    const { id } = c.req.valid("param");
    const db = getDB(c);

    // 기존 배너 조회
    const existingBanner = await db
      .select()
      .from(banners)
      .where(eq(banners.id, id))
      .limit(1);

    if (existingBanner.length === 0) {
      return c.json({ error: "배너를 찾을 수 없습니다" }, 404);
    }

    const banner = existingBanner[0];

    // R2에서 이미지 삭제 (이미지 URL이 있는 경우)
    if (banner.imageUrl) {
      try {
        await deleteFromR2(banner.imageUrl);
      } catch (deleteError) {
        console.warn("R2 이미지 삭제 실패:", deleteError);
        // 이미지 삭제 실패해도 배너는 삭제 진행
      }
    }

    // 배너 삭제
    await db.delete(banners).where(eq(banners.id, id));

    return c.json({
      message: "배너가 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    console.error("배너 삭제 오류:", error);
    return c.json({ error: "배너 삭제 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
