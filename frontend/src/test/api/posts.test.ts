import { describe, it, expect, beforeEach } from "vitest";
import app from "@/server";
import {
  createUserJWT,
  createCenterAdminJWT,
  createSuperAdminJWT,
  createExpiredJWT,
  createAuthHeader,
} from "../utils/auth";
import { testDb, createTestUser, createTestCenter } from "../setup";
import { posts } from "@/db/schema/posts";
import { eq } from "drizzle-orm";

describe("Posts API", () => {
  let testUser: any;
  let centerAdmin: any;
  let testCenter: any;

  beforeEach(async () => {
    // 테스트 데이터 생성
    testUser = await createTestUser({
      id: "test-user-1",
      email: "user@test.com",
      userType: "일반사용자",
    });

    centerAdmin = await createTestUser({
      id: "test-center-admin-1",
      email: "center@test.com",
      userType: "센터관리자",
    });

    testCenter = await createTestCenter({
      id: "test-center-1",
      userId: centerAdmin.id,
    });
  });

  describe("GET /api/community/posts", () => {
    it("should return 401 without authentication", async () => {
      const req = new Request("http://localhost:3001/api/community/posts");
      const res = await app.fetch(req);

      expect(res.status).toBe(401);
    });

    it("should return 401 with expired token", async () => {
      const expiredToken = createExpiredJWT();
      const req = new Request("http://localhost:3001/api/community/posts", {
        headers: createAuthHeader(expiredToken),
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(401);
    });

    it("should return posts for authenticated user", async () => {
      const token = createUserJWT(testUser.id);
      const req = new Request("http://localhost:3001/api/community/posts", {
        headers: createAuthHeader(token),
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("posts");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("limit");
      expect(Array.isArray(data.posts)).toBe(true);
    });

    it("should support pagination", async () => {
      const token = createUserJWT(testUser.id);
      const req = new Request(
        "http://localhost:3001/api/community/posts?page=1&limit=5",
        {
          headers: createAuthHeader(token),
        }
      );
      const res = await app.fetch(req);

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
    });
  });

  describe("POST /api/community/posts", () => {
    it("should create post for authenticated user", async () => {
      const token = createUserJWT(testUser.id);
      const postData = {
        title: "테스트 게시글",
        content: "테스트 내용입니다.",
        tags: ["테스트", "게시글"],
      };

      const req = new Request("http://localhost:3001/api/community/posts", {
        method: "POST",
        headers: {
          ...createAuthHeader(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data).toHaveProperty("id");
      expect(data.title).toBe(postData.title);
      expect(data.content).toBe(postData.content);
      expect(data.userId).toBe(testUser.id);
    });

    it("should return 400 with invalid data", async () => {
      const token = createUserJWT(testUser.id);
      const invalidData = {
        title: "", // 빈 제목
        content: "내용",
      };

      const req = new Request("http://localhost:3001/api/community/posts", {
        method: "POST",
        headers: {
          ...createAuthHeader(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidData),
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(400);
    });

    it("should link post to adoption monitoring", async () => {
      // 입양 관련 게시글 테스트는 adoption 기능이 완성되면 추가
      const token = createUserJWT(testUser.id);
      const postData = {
        title: "입양 후기",
        content: "입양한 강아지 잘 지내고 있어요!",
        adoptionsId: "test-adoption-1",
      };

      const req = new Request("http://localhost:3001/api/community/posts", {
        method: "POST",
        headers: {
          ...createAuthHeader(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      const res = await app.fetch(req);

      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.adoptionsId).toBe(postData.adoptionsId);
    });
  });

  describe("Permission Tests", () => {
    it("should allow different user types to create posts", async () => {
      const testCases = [
        { userType: "일반사용자", userId: testUser.id },
        { userType: "센터관리자", userId: centerAdmin.id },
      ];

      for (const testCase of testCases) {
        const token = createUserJWT(testCase.userId);
        const postData = {
          title: `${testCase.userType} 게시글`,
          content: `${testCase.userType}가 작성한 게시글입니다.`,
        };

        const req = new Request("http://localhost:3001/api/community/posts", {
          method: "POST",
          headers: {
            ...createAuthHeader(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });
        const res = await app.fetch(req);

        expect(res.status).toBe(201);

        const data = await res.json();
        expect(data.userId).toBe(testCase.userId);
      }
    });
  });

  describe("Data Integrity", () => {
    it("should maintain post data integrity after creation", async () => {
      const token = createUserJWT(testUser.id);
      const postData = {
        title: "데이터 무결성 테스트",
        content: "이 게시글은 데이터 무결성을 테스트합니다.",
        tags: ["테스트", "무결성"],
      };

      const req = new Request("http://localhost:3001/api/community/posts", {
        method: "POST",
        headers: {
          ...createAuthHeader(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
      const res = await app.fetch(req);
      const createdPost = await res.json();

      // 데이터베이스에서 직접 확인
      const dbPost = await testDb
        .select()
        .from(posts)
        .where(eq(posts.id, createdPost.id))
        .get();

      expect(dbPost).toBeDefined();
      expect(dbPost.title).toBe(postData.title);
      expect(dbPost.content).toBe(postData.content);
      expect(dbPost.userId).toBe(testUser.id);
      expect(dbPost.createdAt).toBeDefined();
      expect(dbPost.updatedAt).toBeDefined();
    });
  });
});
