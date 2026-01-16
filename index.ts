import "dotenv/config";
import { Hono } from "hono";
import authRoutes from "./src/routes/auth.route";

const app = new Hono();

// Basic CORS handling
app.use("/*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (c.req.method === "OPTIONS") {
    return new Response("", { status: 204 });
  }

  await next();
});

// Health check
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Backend API is running" });
});

// Mount routes
app.route("/auth", authRoutes);

// Error handling
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

const port = process.env.PORT || 3000;

console.log(`🚀 Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
