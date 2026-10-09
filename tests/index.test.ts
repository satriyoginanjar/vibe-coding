import { describe, expect, it } from "bun:test";
import { app } from "../src";

describe("Elysia App", () => {
  it("GET / returns status ok", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  it("GET /ping returns pong", async () => {
    const res = await app.handle(new Request("http://localhost/ping"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("pong");
  });
});
