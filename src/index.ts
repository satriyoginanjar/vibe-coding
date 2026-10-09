import { Elysia } from "elysia";
import { db } from "./db";

const port = process.env.PORT || 3000;

export const app = new Elysia()
  .decorate("db", db)
  .get("/", () => ({
    message: "Server is running",
    status: "ok",
  }))
  .get("/ping", () => ({
    status: "pong",
    timestamp: new Date().toISOString(),
  }))
  .listen(port);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname || "localhost"}:${app.server?.port || port}`
);
