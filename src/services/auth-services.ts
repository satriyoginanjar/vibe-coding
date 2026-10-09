import { eq } from "drizzle-orm";
import { db } from "../db";
import { session, users } from "../db/schema";

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class UserAlreadyExistsError extends Error {
  constructor(message = "User already exists") {
    super(message);
    this.name = "UserAlreadyExistsError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor(message = "login gagal, email atau password anda salah") {
    super(message);
    this.name = "InvalidCredentialsError";
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

export async function loginUserService({ email, password }: LoginDTO): Promise<string> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  // Verify bcrypt password
  const isPasswordValid = await Bun.password.verify(password, user.password);
  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  // Generate UUID token and store in session table
  const token = crypto.randomUUID();

  await db.insert(session).values({
    token,
    userId: user.id,
  });

  return token;
}
