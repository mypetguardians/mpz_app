import { createFactory } from "hono/factory";
import type { AppBindings } from "@/types";
import { getDB } from "@/db";
import { getAuth } from "@/lib/auth";

export default createFactory<AppBindings>({
  initApp: (app) => {
    // 로깅 미들웨어
    app.use(async (c, next) => {
      console.log(`[${c.req.method}] ${c.req.url}`);
      await next();
    });

    // D1 데이터베이스 미들웨어
    app.use(async (c, next) => {
      const db = getDB(c);
      c.set("db", db);
      await next();
    });

    // Better Auth 미들웨어
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
  },
});
