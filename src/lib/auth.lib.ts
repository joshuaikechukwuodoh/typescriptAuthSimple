import jwt from "jsonwebtoken";
import type { Context, Next } from "hono";

export interface JwtPayload {
  userId: string;
  sessionId: string;
}

export async function requireAuth(c: Context, next: Next) {
  const auth = c.req.header("Authorization");
  if (!auth) return c.json({ error: "Unauthorized" }, 401);

  const token = auth.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}
