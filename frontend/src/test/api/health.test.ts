import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import app from "@/server";

describe("Health API", () => {
  it("should return health status", async () => {
    const req = new Request("http://localhost:3000/api/health");
    const res = await app.fetch(req);

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toMatchObject({
      status: "ok",
      version: "1.0.0",
    });
    expect(data.timestamp).toBeDefined();
  });

  it("should have correct content-type", async () => {
    const req = new Request("http://localhost:3000/api/health");
    const res = await app.fetch(req);

    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
