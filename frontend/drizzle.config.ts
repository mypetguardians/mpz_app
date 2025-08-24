import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./sqlite.db",
  },
  verbose: true,
  strict: true,
});
