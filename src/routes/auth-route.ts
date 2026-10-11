import { Elysia, t } from "elysia";
import {
  getCurrentUserService,
  InvalidCredentialsError,
  loginUserService,
  logoutUserService,
  registerUserService,
  UnauthorizedError,
  UserAlreadyExistsError,
} from "../services/auth-services";

export const authRoute = new Elysia({ prefix: "/api/v1/auth" })
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        await registerUserService(body);
        set.status = 201;
        return {
          message: "User created successfully",
        };
      } catch (error) {
        if (error instanceof UserAlreadyExistsError) {
          set.status = 400;
          return {
            message: "User already exists",
          };
        }
        set.status = 500;
        return {
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const token = await loginUserService(body);
        set.status = 200;
        return {
          data: token,
        };
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          set.status = 400;
          return {
            message: error.message,
          };
        }
        set.status = 500;
        return {
          message: "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/current", async ({ headers, set }) => {
    try {
      const authorization = headers.authorization;
      if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
        set.status = 401;
        return {
          message: "unauthorized",
        };
      }

      const token = authorization.substring(7).trim();
      if (!token) {
        set.status = 401;
        return {
          message: "unauthorized",
        };
      }

      const user = await getCurrentUserService(token);
      set.status = 200;
      return {
        data: user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return {
          message: "unauthorized",
        };
      }
      set.status = 500;
      return {
        message: "Internal server error",
      };
    }
  })
  .delete("/logout", async ({ headers, set }) => {
    try {
      const authorization = headers.authorization;
      if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
        set.status = 401;
        return {
          message: "unauthorized",
        };
      }

      const token = authorization.substring(7).trim();
      if (!token) {
        set.status = 401;
        return {
          message: "unauthorized",
        };
      }

      await logoutUserService(token);
      set.status = 200;
      return {
        data: "ok",
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return {
          message: "unauthorized",
        };
      }
      set.status = 500;
      return {
        message: "Internal server error",
      };
    }
  });
