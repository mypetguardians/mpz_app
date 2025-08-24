import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings } from "@/types";
import type { Context } from "hono";
import { getDB } from "@/db";
import { centers } from "@/db/schema/centers";
import { questionForms } from "@/db/schema/misc";
import { eq, and, asc, desc, gt } from "drizzle-orm";
import { getCurrentUser, type UserType } from "@/lib/permissions";
import { user } from "@/db/schema/auth";
import {
  getQuestionFormsRoute,
  createQuestionFormRoute,
  updateQuestionFormRoute,
  updateQuestionSequenceRoute,
  deleteQuestionFormRoute,
} from "@/server/openapi/routes/center-question";

const app = new OpenAPIHono<AppBindings>();

// Helper function to get user's center (센터 관리자는 자신의 센터만 조회)
async function getUserCenter(
  c: Context<AppBindings>,
  currentUser: typeof user.$inferSelect
) {
  const db = getDB(c);
  const userCenters = await db
    .select()
    .from(centers)
    .where(eq(centers.userId, currentUser.id))
    .limit(1);

  if (userCenters.length === 0) {
    return null;
  }
  return userCenters[0];
}

// GET /centers/procedures/questions - 질문 폼 목록 조회
// @ts-expect-error - OpenAPI type complexity
app.openapi(getQuestionFormsRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const db = getDB(c);

    // 자신의 센터 질문 폼들을 조회
    const questions = await db
      .select()
      .from(questionForms)
      .where(eq(questionForms.centerId, userCenter.id))
      .orderBy(asc(questionForms.sequence));

    const questionsResponse = questions.map((question) => ({
      id: question.id,
      centerId: question.centerId,
      question: question.question,
      type: question.type,
      options: question.options ? JSON.parse(question.options) : null,
      isRequired: question.isRequired,
      sequence: question.sequence,
      createdAt: new Date(question.createdAt).toISOString(),
      updatedAt: new Date(question.updatedAt).toISOString(),
    }));

    return c.json({ questions: questionsResponse });
  } catch (error) {
    console.error("Get question forms error:", error);
    return c.json({ error: "질문 폼 목록 조회 중 오류가 발생했습니다" }, 500);
  }
});

// POST /centers/procedures/questions - 질문 폼 생성
app.openapi(createQuestionFormRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const body = c.req.valid("json");
    const db = getDB(c);

    // sequence가 제공되지 않은 경우 자동으로 마지막 순서 + 1로 설정
    let sequence = body.sequence;
    if (!sequence) {
      const lastQuestion = await db
        .select()
        .from(questionForms)
        .where(eq(questionForms.centerId, userCenter.id))
        .orderBy(desc(questionForms.sequence))
        .limit(1);

      sequence = lastQuestion.length > 0 ? lastQuestion[0].sequence + 1 : 1;
    }

    const questionData = {
      centerId: userCenter.id,
      question: body.question,
      type: body.type,
      options: body.options ? JSON.stringify(body.options) : null,
      isRequired: body.isRequired ?? false,
      sequence,
    };

    const result = await db
      .insert(questionForms)
      .values(questionData)
      .returning();
    const createdQuestion = result[0];

    const responseData = {
      id: createdQuestion.id,
      centerId: createdQuestion.centerId,
      question: createdQuestion.question,
      type: createdQuestion.type,
      options: createdQuestion.options
        ? JSON.parse(createdQuestion.options)
        : null,
      isRequired: createdQuestion.isRequired,
      sequence: createdQuestion.sequence,
      createdAt: new Date(createdQuestion.createdAt).toISOString(),
      updatedAt: new Date(createdQuestion.updatedAt).toISOString(),
    };

    return c.json(responseData, 201);
  } catch (error) {
    console.error("Create question form error:", error);
    return c.json({ error: "질문 폼 생성 중 오류가 발생했습니다" }, 500);
  }
});

// PUT /centers/procedures/questions/{questionId} - 질문 폼 수정
// @ts-expect-error - OpenAPI type complexity
app.openapi(updateQuestionFormRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const { questionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 질문이 존재하고 사용자의 센터에 속하는지 확인
    const existingQuestion = await db
      .select()
      .from(questionForms)
      .where(
        and(
          eq(questionForms.id, questionId),
          eq(questionForms.centerId, userCenter.id)
        )
      )
      .limit(1);

    if (existingQuestion.length === 0) {
      return c.json({ error: "질문을 찾을 수 없습니다" }, 404);
    }

    // 업데이트할 데이터 준비
    const updateData: Partial<typeof questionForms.$inferInsert> = {};
    if (body.question !== undefined) updateData.question = body.question;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.options !== undefined) {
      updateData.options = body.options ? JSON.stringify(body.options) : null;
    }
    if (body.isRequired !== undefined) updateData.isRequired = body.isRequired;
    if (body.sequence !== undefined) updateData.sequence = body.sequence;

    const updatedResult = await db
      .update(questionForms)
      .set(updateData)
      .where(eq(questionForms.id, questionId))
      .returning();

    const updatedQuestion = updatedResult[0];
    const responseData = {
      id: updatedQuestion.id,
      centerId: updatedQuestion.centerId,
      question: updatedQuestion.question,
      type: updatedQuestion.type,
      options: updatedQuestion.options
        ? JSON.parse(updatedQuestion.options)
        : null,
      isRequired: updatedQuestion.isRequired,
      sequence: updatedQuestion.sequence,
      createdAt: new Date(updatedQuestion.createdAt).toISOString(),
      updatedAt: new Date(updatedQuestion.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update question form error:", error);
    return c.json({ error: "질문 폼 수정 중 오류가 발생했습니다" }, 500);
  }
});

// PATCH /centers/procedures/questions/{questionId}/sequence - 질문 폼 순서 변경
// @ts-expect-error - OpenAPI type complexity
app.openapi(updateQuestionSequenceRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const { questionId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDB(c);

    // 질문이 존재하고 사용자의 센터에 속하는지 확인
    const existingQuestion = await db
      .select()
      .from(questionForms)
      .where(
        and(
          eq(questionForms.id, questionId),
          eq(questionForms.centerId, userCenter.id)
        )
      )
      .limit(1);

    if (existingQuestion.length === 0) {
      return c.json({ error: "질문을 찾을 수 없습니다" }, 404);
    }

    const currentQuestion = existingQuestion[0];
    const newSequence = body.sequence;

    // 같은 센터의 다른 질문들과 순서 조정
    const allQuestions = await db
      .select()
      .from(questionForms)
      .where(eq(questionForms.centerId, userCenter.id))
      .orderBy(asc(questionForms.sequence));

    // 순서 재배치 로직
    const updates = [];

    if (newSequence > currentQuestion.sequence) {
      // 뒤로 이동: 중간에 있는 질문들을 앞으로 한 칸씩
      for (const question of allQuestions) {
        if (question.id === questionId) continue;
        if (
          question.sequence > currentQuestion.sequence &&
          question.sequence <= newSequence
        ) {
          updates.push({
            id: question.id,
            sequence: question.sequence - 1,
          });
        }
      }
    } else if (newSequence < currentQuestion.sequence) {
      // 앞으로 이동: 중간에 있는 질문들을 뒤로 한 칸씩
      for (const question of allQuestions) {
        if (question.id === questionId) continue;
        if (
          question.sequence >= newSequence &&
          question.sequence < currentQuestion.sequence
        ) {
          updates.push({
            id: question.id,
            sequence: question.sequence + 1,
          });
        }
      }
    }

    // 순서 업데이트 실행
    for (const update of updates) {
      await db
        .update(questionForms)
        .set({ sequence: update.sequence })
        .where(eq(questionForms.id, update.id));
    }

    // 대상 질문의 순서 업데이트
    const updatedResult = await db
      .update(questionForms)
      .set({ sequence: newSequence })
      .where(eq(questionForms.id, questionId))
      .returning();

    const updatedQuestion = updatedResult[0];
    const responseData = {
      id: updatedQuestion.id,
      centerId: updatedQuestion.centerId,
      question: updatedQuestion.question,
      type: updatedQuestion.type,
      options: updatedQuestion.options
        ? JSON.parse(updatedQuestion.options)
        : null,
      isRequired: updatedQuestion.isRequired,
      sequence: updatedQuestion.sequence,
      createdAt: new Date(updatedQuestion.createdAt).toISOString(),
      updatedAt: new Date(updatedQuestion.updatedAt).toISOString(),
    };

    return c.json(responseData);
  } catch (error) {
    console.error("Update question sequence error:", error);
    return c.json({ error: "질문 폼 순서 변경 중 오류가 발생했습니다" }, 500);
  }
});

// DELETE /centers/procedures/questions/{questionId} - 질문 폼 삭제
// @ts-expect-error - OpenAPI type complexity
app.openapi(deleteQuestionFormRoute, async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!currentUser) {
      return c.json({ error: "로그인이 필요합니다" }, 401);
    }

    const userType = currentUser.userType as UserType;
    if (!userType || userType !== "센터관리자") {
      return c.json({ error: "센터 관리자만 접근할 수 있습니다" }, 403);
    }

    const userCenter = await getUserCenter(c, currentUser);
    if (!userCenter) {
      return c.json({ error: "등록된 센터가 없습니다" }, 400);
    }

    const { questionId } = c.req.valid("param");
    const db = getDB(c);

    // 질문이 존재하고 사용자의 센터에 속하는지 확인
    const existingQuestion = await db
      .select()
      .from(questionForms)
      .where(
        and(
          eq(questionForms.id, questionId),
          eq(questionForms.centerId, userCenter.id)
        )
      )
      .limit(1);

    if (existingQuestion.length === 0) {
      return c.json({ error: "질문을 찾을 수 없습니다" }, 404);
    }

    const deletedQuestion = existingQuestion[0];

    // 질문 삭제
    await db.delete(questionForms).where(eq(questionForms.id, questionId));

    // 삭제된 질문 뒤의 순서들을 앞으로 한 칸씩 이동
    const questionsToReorder = await db
      .select()
      .from(questionForms)
      .where(
        and(
          eq(questionForms.centerId, userCenter.id),
          gt(questionForms.sequence, deletedQuestion.sequence)
        )
      );

    for (const question of questionsToReorder) {
      await db
        .update(questionForms)
        .set({ sequence: question.sequence - 1 })
        .where(eq(questionForms.id, question.id));
    }

    return c.json({ message: "질문 폼이 성공적으로 삭제되었습니다" });
  } catch (error) {
    console.error("Delete question form error:", error);
    return c.json({ error: "질문 폼 삭제 중 오류가 발생했습니다" }, 500);
  }
});

export default app;
