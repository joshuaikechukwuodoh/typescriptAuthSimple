import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET!;

export const signupSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).default("user"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// create session + token
async function createSession(userId: string) {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  const [session] = await db
    .insert(sessions)
    .values({ userId, expiresAt: expires })
    .returning();

  if (!session) throw new Error("Failed to create session");

  const token = jwt.sign({ userId, sessionId: session.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { token, session };
}

// SIGNUP
export async function signup(data: z.infer<typeof signupSchema>) {
  const input = signupSchema.parse(data);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));

  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(input.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      password: hashed,
      role: input.role,
    })
    .returning();

  if (!user) throw new Error("Failed to create user");

  const session = await createSession(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: session.token,
  };
}

// LOGIN
export async function login(data: z.infer<typeof loginSchema>) {
  const input = loginSchema.parse(data);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));

  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const session = await createSession(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: session.token,
  };
}

// LOGOUT
export async function logout(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
