import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import { session, users } from "../src/db/schema";

describe("POST /api/v1/auth/login", () => {
  const email = `login-test-${Date.now()}@example.com`;
  const password = "correctpassword123";

  it("should successfully login with valid credentials and return a token", async () => {
    // 1. Register user first
    const regRes = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "login test user",
          email,
          password,
        }),
      })
    );
    expect(regRes.status).toBe(201);

    // 2. Perform login
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
    const body = (await loginRes.json()) as { data: string };
    expect(body.data).toBeDefined();
    expect(typeof body.data).toBe("string");
    // Verify UUID format (36 chars with dashes)
    expect(body.data.length).toBe(36);

    // 3. Verify session stored in database
    const [storedSession] = await db
      .select()
      .from(session)
      .where(eq(session.token, body.data))
      .limit(1);

    expect(storedSession).toBeDefined();
    expect(storedSession!.token).toBe(body.data);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    expect(storedSession!.userId).toBe(user!.id);
  });

  it("should fail when logging in with non-existent email", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "unknown-email@example.com",
          password: "anypassword",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body).toEqual({
      message: "login gagal, email atau password anda salah",
    });
  });

  it("should fail when logging in with incorrect password", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "wrongpassword",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body).toEqual({
      message: "login gagal, email atau password anda salah",
    });
  });
});
