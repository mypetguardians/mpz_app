import { AppBindings } from "@/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq } from "drizzle-orm";
import {
  createPostRoute,
  getPostListRoute,
  getPostDetailRoute,
  updatePostRoute,
  deletePostRoute,
  createCommentRoute,
  getCommentsRoute,
  updateCommentRoute,
  deleteCommentRoute,
  createReplyRoute,
  updateReplyRoute,
  deleteReplyRoute,
} from "@/server/openapi/routes/posts";
import { user } from "@/db/schema/auth";
import { posts, postTags, postImages } from "@/db/schema/posts";
import { comments, replies } from "@/db/schema/comments";
import { getCurrentUser, isAuthorOrSuperAdmin } from "@/lib/permissions";
import { getDB } from "@/db";
import { linkPostToAdoptionMonitoring } from "@/server/scheduler/adoption-monitoring";

export const postRouter = new OpenAPIHono<AppBindings>();

// OpenAPI 게시글 생성
postRouter.openapi(createPostRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  const { title, content, tags, images, adoptionsId, visibility } =
    c.req.valid("json");

  const postId = crypto.randomUUID();
  const now = new Date();

  const newPost = await db
    .insert(posts)
    .values({
      id: postId,
      title,
      content,
      userId: currentUser.id,
      visibility: visibility === "center" ? "center" : "public",
      adoptionsId: adoptionsId || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  // tags가 있으면 post_tags 테이블에 저장
  if (tags && Array.isArray(tags) && tags.length > 0) {
    for (const tagName of tags) {
      await db.insert(postTags).values({
        id: crypto.randomUUID(),
        postId,
        tagName: tagName,
        createdAt: new Date(),
      });
    }
  }

  // images가 있으면 post_images 테이블에 저장
  if (images && Array.isArray(images)) {
    let orderIndex = 0;
    for (const imageUrl of images) {
      await db.insert(postImages).values({
        id: crypto.randomUUID(),
        postId,
        imageUrl,
        orderIndex: orderIndex++,
        createdAt: new Date(),
      });
    }
  }

  // 입양 모니터링과 연결 (adoptionsId가 없어도 사용자의 모니터링 중인 입양이 있으면 자동 연결)
  try {
    const isLinked = await linkPostToAdoptionMonitoring(
      db,
      postId,
      currentUser.id
    );
    if (isLinked) {
      console.log(
        `📝 Post ${postId} linked to adoption monitoring for user ${currentUser.id}`
      );
    }
  } catch (error) {
    console.error("Error linking post to adoption monitoring:", error);
    // 모니터링 연결 실패는 포스트 생성을 방해하지 않음
  }

  return c.json(
    {
      message: "게시글이 생성되었습니다.",
      community: {
        ...newPost,
        likeCount: 0,
        commentCount: 0,
        createdAt: newPost.createdAt.toISOString(),
        updatedAt: newPost.updatedAt.toISOString(),
      },
    },
    201
  );
});

// 게시글 목록 조회
postRouter.openapi(getPostListRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);

  const { userId, visibility } = c.req.valid("query");

  // 필터 조건 구성
  // center 전용 조회는 관리자만 허용
  if (visibility === "center") {
    const isAdmin = currentUser && currentUser.userType !== "일반사용자";
    if (!isAdmin) {
      return c.json(
        { error: "센터 전용 게시글은 관리자만 조회할 수 있습니다" },
        403
      );
    }
  }

  const conditions: any[] = [];
  if (userId) conditions.push(eq(posts.userId, userId));
  if (visibility) {
    conditions.push(eq(posts.visibility, visibility as any));
  } else {
    // 필터가 없으면: 일반사용자는 public만, 관리자/센터/슈퍼는 전체
    const isAdmin = currentUser && currentUser.userType !== "일반사용자";
    if (!isAdmin) conditions.push(eq(posts.visibility, "public" as any));
  }

  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const postList = await db
    .select()
    .from(posts)
    .leftJoin(user, eq(posts.userId, user.id))
    .where(whereCondition)
    .orderBy(desc(posts.createdAt));

  // 댓글 수 계산 (좋아요 기능은 일단 제외)
  const postsWithCounts = await Promise.all(
    postList.map(
      async (row: {
        posts: typeof posts.$inferSelect;
        user: typeof user.$inferSelect | null;
      }) => {
        const post = row.posts;
        const author = row.user;

        const commentCountResult = await db
          .select()
          .from(comments)
          .where(eq(comments.postId, post.id));

        // 태그와 이미지 조회
        const [tagList, imageList] = await Promise.all([
          db.select().from(postTags).where(eq(postTags.postId, post.id)),
          db
            .select()
            .from(postImages)
            .where(eq(postImages.postId, post.id))
            .orderBy(postImages.orderIndex),
        ]);

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          userId: post.userId,
          animalId: post.animalId,
          adoptionsId: post.adoptionsId,
          visibility: post.visibility,
          likeCount: 0,
          commentCount: commentCountResult.length || 0,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          tags: tagList.map((tag: typeof postTags.$inferSelect) => ({
            id: tag.id,
            postId: tag.postId,
            tagName: tag.tagName,
            createdAt: tag.createdAt.toISOString(),
          })),
          images: imageList.map((img: typeof postImages.$inferSelect) => ({
            id: img.id,
            postId: img.postId,
            imageUrl: img.imageUrl,
            orderIndex: img.orderIndex,
            createdAt: img.createdAt.toISOString(),
          })),
          // 사용자 정보 추가
          userNickname: author?.nickname || author?.name || "사용자",
          userImage: author?.image || null,
        };
      }
    )
  );

  return c.json({ posts: postsWithCounts });
});

// 게시글 상세 조회
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(getPostDetailRoute, async (c) => {
  const db = getDB(c);
  // 로그인 체크 제거 - 게시글 조회는 누구나 가능
  const { postId } = c.req.valid("param");

  const postResult = await db
    .select()
    .from(posts)
    .leftJoin(user, eq(posts.userId, user.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (postResult.length === 0) {
    return c.json({ error: "게시글을 찾을 수 없습니다" }, 404);
  }

  const post = postResult[0].posts;
  const author = postResult[0].user;

  // 센터공개 게시글 접근 제어: 관리자만 조회 가능
  const currentUser = await getCurrentUser(c);
  if (post.visibility === "center") {
    const isAdmin = currentUser && currentUser.userType !== "일반사용자";
    if (!isAdmin) {
      return c.json(
        { error: "센터 전용 게시글은 관리자만 조회할 수 있습니다" },
        403
      );
    }
  }

  // 태그와 이미지 조회
  const [tagList, imageList] = await Promise.all([
    db.select().from(postTags).where(eq(postTags.postId, postId)),
    db
      .select()
      .from(postImages)
      .where(eq(postImages.postId, postId))
      .orderBy(postImages.orderIndex),
  ]);

  return c.json({
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      userId: post.userId,
      animalId: post.animalId,
      adoptionsId: post.adoptionsId,
      visibility: post.visibility,
      contentTags: post.contentTags,
      likeCount: 0,
      commentCount: 0,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      // 사용자 정보 추가
      userNickname: author?.nickname || author?.name || "사용자",
      userImage: author?.image || null,
    },
    tags: tagList.map((tag) => ({
      id: tag.id,
      postId: tag.postId,
      tagName: tag.tagName,
      createdAt: tag.createdAt.toISOString(),
    })),
    images: imageList.map((img) => ({
      id: img.id,
      postId: img.postId,
      imageUrl: img.imageUrl,
      orderIndex: img.orderIndex,
      createdAt: img.createdAt.toISOString(),
    })),
  });
});

// 게시글 수정
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(updatePostRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { postId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  const { title, content, tags, images, adoptionsId, visibility } =
    c.req.valid("json");

  // 게시글 존재 여부 및 작성자 확인
  const existingPost = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (existingPost.length === 0) {
    return c.json({ error: "게시글을 찾을 수 없습니다" }, 404);
  }

  if (existingPost[0].userId !== currentUser.id) {
    return c.json({ error: "수정 권한이 없습니다" }, 401);
  }

  // 게시글 업데이트
  const updateData: Partial<typeof posts.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (adoptionsId !== undefined) updateData.adoptionsId = adoptionsId;
  if (visibility !== undefined) updateData.visibility = visibility;

  await db.update(posts).set(updateData).where(eq(posts.id, postId));

  // 기존 태그 삭제 후 새 태그 추가
  if (tags) {
    await db.delete(postTags).where(eq(postTags.postId, postId));
    if (Array.isArray(tags)) {
      for (const tagName of tags) {
        await db.insert(postTags).values({
          id: crypto.randomUUID(),
          postId,
          tagName,
          createdAt: new Date(),
        });
      }
    }
  }

  // 기존 이미지 삭제 후 새 이미지 추가
  if (images) {
    await db.delete(postImages).where(eq(postImages.postId, postId));
    if (Array.isArray(images)) {
      let orderIndex = 0;
      for (const imageUrl of images) {
        await db.insert(postImages).values({
          id: crypto.randomUUID(),
          postId,
          imageUrl,
          orderIndex: orderIndex++,
          createdAt: new Date(),
        });
      }
    }
  }

  return c.json({ message: "게시글이 수정되었습니다" });
});

// 게시글 삭제
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(deletePostRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { postId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  // 게시글 존재 여부 확인
  const existingPost = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (existingPost.length === 0) {
    return c.json({ error: "게시글을 찾을 수 없습니다" }, 404);
  }

  // 작성자 본인이거나 최고관리자인지 확인
  const hasPermission = await isAuthorOrSuperAdmin(c, existingPost[0].userId);
  if (!hasPermission) {
    return c.json({ error: "삭제 권한이 없습니다" }, 403);
  }

  // 게시글 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
  await db.delete(posts).where(eq(posts.id, postId));

  return c.json({ message: "게시글이 삭제되었습니다" });
});

// 댓글 생성
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(createCommentRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { postId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  const { content } = c.req.valid("json");

  if (!content) {
    return c.json({ error: "댓글 내용을 입력하세요" }, 400);
  }

  // 게시글 존재 확인
  const post = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) {
    return c.json({ error: "게시글을 찾을 수 없습니다" }, 404);
  }

  const commentId = crypto.randomUUID();
  const now = new Date();

  await db.insert(comments).values({
    id: commentId,
    postId,
    userId: currentUser.id,
    content,
    createdAt: now,
    updatedAt: now,
  });

  // 게시글 작성자에게 알림 전송 (자신의 게시글에는 알림 안 보내기)
  if (post[0].userId !== currentUser.id) {
    try {
      const { NotificationService } = await import(
        "@/lib/notification-service"
      );
      await NotificationService.sendCommunityNotification(
        post[0].userId,
        "comment",
        postId,
        currentUser.nickname || currentUser.name || "사용자",
        c
      );
    } catch (error) {
      console.error("알림 전송 실패:", error);
    }
  }

  return c.json({ message: "댓글이 작성되었습니다", commentId });
});

// 댓글 목록 조회
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(getCommentsRoute, async (c) => {
  const db = getDB(c);
  // 로그인 체크 제거 - 댓글 조회는 누구나 가능
  const { postId } = c.req.valid("param");

  // 게시글 존재 확인
  const post = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) {
    return c.json({ error: "게시글을 찾을 수 없습니다" }, 404);
  }

  const commentResults = await db
    .select()
    .from(comments)
    .leftJoin(user, eq(comments.userId, user.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));

  // 각 댓글의 대댓글들 조회
  const commentsWithReplies = await Promise.all(
    commentResults.map(async (row) => {
      const comment = row.comments;
      const commentAuthor = row.user;

      const replyResults = await db
        .select()
        .from(replies)
        .leftJoin(user, eq(replies.userId, user.id))
        .where(eq(replies.commentId, comment.id))
        .orderBy(replies.createdAt);

      return {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        likeCount: 0,
        replies: replyResults.map((replyRow) => ({
          id: replyRow.replies.id,
          commentId: replyRow.replies.commentId,
          userId: replyRow.replies.userId,
          content: replyRow.replies.content,
          createdAt: replyRow.replies.createdAt.toISOString(),
          updatedAt: replyRow.replies.updatedAt.toISOString(),
        })),
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: commentAuthor
          ? {
              id: commentAuthor.id,
              nickname: commentAuthor.nickname,
              image: commentAuthor.image,
            }
          : undefined,
      };
    })
  );

  return c.json({ comments: commentsWithReplies });
});

// 댓글 수정
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(updateCommentRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { commentId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  const { content } = c.req.valid("json");

  if (!content) {
    return c.json({ error: "댓글 내용을 입력하세요" }, 400);
  }

  // 댓글 존재 여부 및 작성자 확인
  const existingComment = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (existingComment.length === 0) {
    return c.json({ error: "댓글을 찾을 수 없습니다" }, 404);
  }

  if (existingComment[0].userId !== currentUser.id) {
    return c.json({ error: "수정 권한이 없습니다" }, 401);
  }

  await db
    .update(comments)
    .set({ content, updatedAt: new Date() })
    .where(eq(comments.id, commentId));

  return c.json({ message: "댓글이 수정되었습니다" });
});

// 댓글 삭제
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(deleteCommentRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { commentId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  // 댓글 존재 여부 확인
  const existingComment = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (existingComment.length === 0) {
    return c.json({ error: "댓글을 찾을 수 없습니다" }, 404);
  }

  // 작성자 본인이거나 최고관리자인지 확인
  const hasPermission = await isAuthorOrSuperAdmin(
    c,
    existingComment[0].userId
  );
  if (!hasPermission) {
    return c.json({ error: "삭제 권한이 없습니다" }, 403);
  }

  // 댓글 삭제 (CASCADE로 대댓글도 함께 삭제됨)
  await db.delete(comments).where(eq(comments.id, commentId));

  return c.json({ message: "댓글이 삭제되었습니다" });
});

// 대댓글 생성
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(createReplyRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { commentId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  const { content } = c.req.valid("json");

  if (!content) {
    return c.json({ error: "대댓글 내용을 입력하세요" }, 400);
  }

  // 댓글 존재 확인
  const comment = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (comment.length === 0) {
    return c.json({ error: "댓글을 찾을 수 없습니다" }, 404);
  }

  const replyId = crypto.randomUUID();
  const now = new Date();

  await db.insert(replies).values({
    id: replyId,
    commentId,
    userId: currentUser.id,
    content,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ message: "대댓글이 작성되었습니다", replyId });
});

// 대댓글 수정
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(updateReplyRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { replyId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  const { content } = c.req.valid("json");

  if (!content) {
    return c.json({ error: "대댓글 내용을 입력하세요" }, 400);
  }

  // 대댓글 존재 여부 및 작성자 확인
  const existingReply = await db
    .select()
    .from(replies)
    .where(eq(replies.id, replyId))
    .limit(1);

  if (existingReply.length === 0) {
    return c.json({ error: "대댓글을 찾을 수 없습니다" }, 404);
  }

  if (existingReply[0].userId !== currentUser.id) {
    return c.json({ error: "수정 권한이 없습니다" }, 401);
  }

  await db
    .update(replies)
    .set({ content, updatedAt: new Date() })
    .where(eq(replies.id, replyId));

  return c.json({ message: "대댓글이 수정되었습니다" });
});

// 대댓글 삭제
// @ts-expect-error - OpenAPI type complexity
postRouter.openapi(deleteReplyRoute, async (c) => {
  const db = getDB(c);
  const currentUser = await getCurrentUser(c);
  const { replyId } = c.req.valid("param");

  if (!currentUser) {
    return c.json({ error: "인증이 필요합니다" }, 401);
  }

  // 대댓글 존재 여부 확인
  const existingReply = await db
    .select()
    .from(replies)
    .where(eq(replies.id, replyId))
    .limit(1);

  if (existingReply.length === 0) {
    return c.json({ error: "대댓글을 찾을 수 없습니다" }, 404);
  }

  // 작성자 본인이거나 최고관리자인지 확인
  const hasPermission = await isAuthorOrSuperAdmin(c, existingReply[0].userId);
  if (!hasPermission) {
    return c.json({ error: "삭제 권한이 없습니다" }, 403);
  }

  // 대댓글 삭제
  await db.delete(replies).where(eq(replies.id, replyId));

  return c.json({ message: "대댓글이 삭제되었습니다" });
});

export default postRouter;
