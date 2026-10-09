import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export class UserAlreadyExistsError extends Error {
  constructor(message = "User already exists") {
    super(message);
    this.name = "UserAlreadyExistsError";
  }
}

export async function registerUserService({ name, email, password }: RegisterDTO) {
  // Check if user with this email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new UserAlreadyExistsError();
  }

  // Hash password using bcrypt
  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // Insert user
  const [createdUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
    })
    .returning();

  return createdUser;
}
