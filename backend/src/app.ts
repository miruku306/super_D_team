import { Hono } from "hono";
import { cors } from "hono/cors";
import { gamesRoutes } from "./routes/games";
import { reservationsRoutes } from "./routes/reservations";
import { reviewsRoutes } from "./routes/reviews";
import { Env, initSupabase } from "./lib/supabase";

const app = new Hono<{ Bindings: Env }>();

// Supabase初期化ミドルウェア
app.use("*", async (c, next) => {
  initSupabase(c.env);
  await next();
});

// CORS設定
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ヘルスチェック
app.get("/", (c) => {
  return c.json({ message: "Super D Team API", status: "ok" });
});

// APIルート
app.route("/api/games", gamesRoutes);
app.route("/api/reservations", reservationsRoutes);
app.route("/api/reviews", reviewsRoutes);

// エラーハンドリング
app.onError((err, c) => {
  console.error("Error:", err);
  console.error("Error Stack:", err.stack);
  return c.json({ 
    error: err.message,
    details: err.stack 
  }, 500);
});

// 404ハンドリング
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

export default app;
