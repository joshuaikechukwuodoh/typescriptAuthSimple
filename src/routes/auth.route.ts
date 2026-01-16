import { Hono } from "hono";
import { signup, login, logout } from "../core/auth.core";
import { requireAuth, type JwtPayload } from "../lib/auth.lib";

// Define context variables for type safety
type Variables = {
  user: JwtPayload;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/signup", async (c) => {
  return c.json(await signup(await c.req.json()));
});

app.post("/login", async (c) => {
  return c.json(await login(await c.req.json()));
});

app.post("/logout", requireAuth, async (c) => {
  const { sessionId } = c.get("user");
  await logout(sessionId);
  return c.json({ success: true });
});

export default app;
