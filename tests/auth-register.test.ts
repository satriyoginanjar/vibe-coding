import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { app } from "../src";
import { db } from "../src/db";
import { users } from "../src/db/schema";

describe("POST /api/v1/auth/register", () => {
  const testEmail = `test-${Date.now()}@example.com`;

  it("should successfully register a new user", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "user",
          email: testEmail,
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({
      message: "User created successfully",
    });

    // Verify user in database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user).toBeDefined();
    expect(user!.name).toBe("user");
    expect(user!.password).not.toBe("password123");
    // Verify bcrypt hash prefix
    expect(user!.password.startsWith("$2b$") || user!.password.startsWith("$2a$")).toBe(true);
    // Verify password matches with Bun.password.verify
    const isMatch = await Bun.password.verify("password123", user!.password);
    expect(isMatch).toBe(true);
  });

  it("should fail when registering with an existing email", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "user duplicate",
          email: testEmail,
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({
      message: "User already exists",
    });
  });
});
