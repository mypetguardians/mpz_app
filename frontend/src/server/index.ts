import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import kakaoRoute from "./routes/kakao-auth-route";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/db";
import healthRoute from "./routes/health-route";
import userRoute from "./routes/user-route";
import animalRoute from "./routes/animal-route";
import centerRoute from "./routes/center-route";
import centerProcedureRoute from "./routes/center-procedure-route";
import centerContractRoute from "./routes/center-contract-route";
import centerQuestionRoute from "./routes/center-question-route";
import postRouter from "./routes/post-router";
import authRouter from "./routes/auth-router";
import superadminCenterRoute from "./routes/superadmin-center-route";
import centerAdminRoute from "./routes/center-admin-route";
import centerNoticeRoute from "./routes/center-notice-route";
import centerSuperadminNoticeRoute from "./routes/center-superadmin-notice-route";
import adoptionRoute from "./routes/adoption-route";
import centerAdoptionRoute from "./routes/center-adoption-route";
import favoritesRoute from "./routes/favorites-route";
import animalImagesRoute from "./routes/animal-images-route";
import centerImagesRoute from "./routes/center-images-route";
import postImagesRoute from "./routes/post-images-route";
import userImagesRoute from "./routes/user-images-route";
import feedbackRoute from "./routes/feedback-route";
import userAdoptionRoute from "./routes/user-adoption-route";
import notificationsRoute from "./routes/notifications-route";
import bannerRoute from "./routes/banner-route";
import type { AppBindings } from "@/types";
import { config, validateConfig } from "@/config";

// 설정 검증
validateConfig(config);

// Create main app with OpenAPI support
const app = new OpenAPIHono<AppBindings>();

// 공통 미들웨어: 요청 로깅
app.use(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
});

// 공통 미들웨어: DB 주입
app.use(async (c, next) => {
  const db = getDB(c);
  c.set("db", db);
  await next();
});

// 공통 미들웨어: Better Auth 주입 및 세션 로드
app.use(async (c, next) => {
  const auth = getAuth(c);
  c.set("auth", auth);

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session) {
      c.set("user", session.user);
      c.set("session", session.session);
    } else {
      c.set("user", null);
      c.set("session", null);
    }
  } catch (error) {
    console.log("세션 조회 실패:", error);
    c.set("user", null);
    c.set("session", null);
  }

  await next();
});

// Health Check Routes with OpenAPI documentation
app.route("/v1", healthRoute);

// User Routes with OpenAPI documentation
app.route("/v1", userRoute);
app.route("/v1", kakaoRoute);

// Auth Routes with OpenAPI documentation
app.route("/v1", authRouter);

// Animal Routes with OpenAPI documentation
app.route("/v1", animalRoute);

// Center Routes with OpenAPI documentation
app.route("/v1", centerRoute);

// Center Procedure Routes with OpenAPI documentation
app.route("/v1", centerProcedureRoute);

// Center Contract Routes with OpenAPI documentation
app.route("/v1", centerContractRoute);

// Center Question Routes with OpenAPI documentation
app.route("/v1", centerQuestionRoute);

// Post Routes with OpenAPI documentation
app.route("/v1", postRouter);
// Superadmin Center Routes with OpenAPI documentation
app.route("/v1", superadminCenterRoute);

// Center Admin Routes with OpenAPI documentation
app.route("/v1", centerAdminRoute);

// Center Notice Routes with OpenAPI documentation
app.route("/v1", centerNoticeRoute);

// Center Superadmin Notice Routes with OpenAPI documentation
app.route("/v1", centerSuperadminNoticeRoute);

// Adoption Routes with OpenAPI documentation
app.route("/v1", adoptionRoute);

// Center Adoption Management Routes with OpenAPI documentation
app.route("/v1", centerAdoptionRoute);

// Favorites Routes with OpenAPI documentation
app.route("/v1", favoritesRoute);

// Notifications Routes with OpenAPI documentation
app.route("/v1", notificationsRoute);

// Animal Images Routes with OpenAPI documentation
app.route("/v1", animalImagesRoute);

// Center Images Routes
app.route("/v1", centerImagesRoute);

// Post Images Routes
app.route("/v1", postImagesRoute);

// User Images Routes
app.route("/v1", userImagesRoute);

// Feedback Routes
app.route("/v1", feedbackRoute);

// User Adoption Routes
app.route("/v1", userAdoptionRoute);

// Banner Routes
app.route("/v1", bannerRoute);

// Better Auth API 라우트 연결
app.all("/api/auth/*", async (c) => {
  const auth = getAuth(c);
  return auth.handler(c.req.raw);
});

// Swagger UI endpoint with custom OpenAPI spec
app.get(
  "/api/docs",
  swaggerUI({
    url: "/api/docs/openapi.json",
  })
);

// Custom OpenAPI spec endpoint with security schemes
app.get("/api/docs/openapi.json", async (c) => {
  // 환경에 따른 서버 목록 구성
  const servers = [];

  // 현재 환경의 서버를 첫 번째로 추가
  servers.push({
    url: config.api.baseUrl,
    description: `${config.env.toUpperCase()} server (현재 환경)`,
  });

  // 다른 환경들도 추가 (개발 편의성을 위해)
  if (config.env !== "local") {
    servers.push({
      url: "http://localhost:3000",
      description: "Local development server",
    });
  }

  if (config.env !== "dev") {
    servers.push({
      url: "https://mpz-dev.conscience.workers.dev",
      description: "Development server (Cloudflare Workers)",
    });
  }

  if (config.env !== "prod") {
    servers.push({
      url: "https://mpz-prod.conscience.workers.dev",
      description: "Production server (Cloudflare Workers)",
    });
  }

  // Get the base OpenAPI spec
  const baseSpec = app.getOpenAPIDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: `MPZ API (${config.env.toUpperCase()})`,
      description: `반려동물 입양 플랫폼 API 문서 - ${config.env} 환경`,
      contact: {
        name: "MPZ Development Team",
        email: "dev@mpz.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers,
  });

  // Add security schemes and global security
  const enhancedSpec = {
    ...baseSpec,
    components: {
      ...baseSpec.components,
      securitySchemes: {
        Bearer: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: `JWT Bearer 토큰을 입력하세요 (${config.env} 환경)`,
        },
      },
    },
    security: [
      {
        Bearer: [],
      },
    ],
  };

  return c.json(enhancedSpec);
});

export type HonoApp = typeof app;
export default app;
