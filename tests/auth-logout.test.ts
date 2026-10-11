import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import { session } from "../src/db/schema";

describe("DELETE /api/v1/auth/logout", () => {
  const email = `logout-test-${Date.now()}@example.com`;
  const password = "password123";
  let token = "";

  it("should successfully logout and delete the session token from database", async () => {
    // 1. Register user
    const regRes = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "logout test user",
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

    // Verify session exists in database before logout
    const [existingSession] = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);
    expect(existingSession).toBeDefined();

    // 3. Perform logout
    const logoutRes = await app.handle(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );

    expect(logoutRes.status).toBe(200);
    const logoutBody = (await logoutRes.json()) as { data: string };
    expect(logoutBody).toEqual({
      data: "ok",
    });

    // 4. Verify session is deleted from database
    const [deletedSession] = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);
    expect(deletedSession).toBeUndefined();

    // 5. Verify the token cannot be used anymore to access GET /current
    const currentRes = await app.handle(
      new Request("http://localhost/api/v1/auth/current", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    expect(currentRes.status).toBe(401);
    const currentBody = (await currentRes.json()) as { message: string };
    expect(currentBody).toEqual({
      message: "unauthorized",
    });
  });

  it("should return 401 when Authorization header is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "DELETE",
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body).toEqual({
      message: "unauthorized",
    });
  });

  it("should return 401 when Authorization header format is invalid", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Basic somefakeauth",
        },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as { message: string };
    expect(body).toEqual({
      message: "unauthorized",
    });
  });

  it("should return 401 when token is non-existent", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer non-existent-session-token",
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
