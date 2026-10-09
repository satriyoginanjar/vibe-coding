import { Elysia, t } from "elysia";
import {
  InvalidCredentialsError,
  loginUserService,
  registerUserService,
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
  );
