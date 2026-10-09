import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("GET /api/v1/auth/current", () => {
  const email = `current-user-${Date.now()}@example.com`;
  const password = "password123";
  let token = "";

  it("should successfully get current user profile with valid Bearer token", async () => {
    // 1. Register user
    const regRes = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "current test user",
          email,
          password,
        }),
      })
    );
    expect(regRes.status).toBe(201);

    // 2. Login to get token
    const loginRes = await app.handle(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      })
    );
    expect(loginRes.status).toBe(200);
    const loginBody = (await loginRes.json()) as { data: string };
    token = loginBody.data;
    expect(token).toBeDefined();

    // 3. Get current user
    const currentRes = await app.handle(
      new Request("http://localhost/api/v1/auth/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );

    expect(currentRes.status).toBe(200);
    const currentBody = (await currentRes.json()) as {
      data: { id: number; name: string; email: string; password?: string };
    };

    expect(currentBody.data).toBeDefined();
    expect(currentBody.data.name).toBe("current test user");
    expect(currentBody.data.email).toBe(email);
    expect(typeof currentBody.data.id).toBe("number");
    expect(currentBody.data.password).toBeUndefined();
  });

  it("should return 401 when Authorization header is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/current", {
        method: "GET",
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body).toEqual({
      message: "unauthorized",
    });
  });

  it("should return 401 when Authorization header has invalid format", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/current", {
        method: "GET",
        headers: {
          Authorization: "Basic invalidformat",
        },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body).toEqual({
      message: "unauthorized",
    });
  });

  it("should return 401 when token is invalid or not found in database", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer non-existent-token-12345",
        },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body).toEqual({
      message: "unauthorized",
    });
  });
});
