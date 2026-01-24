import { createMiddleware } from "hono/factory";
import { supabase } from "../lib/supabase";

/**
 * 認証ミドルウェア
 * Authorization: Bearer <token> から JWT を検証して、ユーザー情報をコンテキストに追加
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "認証トークンが必要です" }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Supabase JWT を検証
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "認証が無効です" }, 401);
    }

    // ユーザー情報をコンテキストに追加
    c.set("user", user);
    c.set("token", token);

    await next();
  } catch (error) {
    console.error("認証エラー:", error);
    return c.json({ error: "認証に失敗しました" }, 401);
  }
});

/**
 * オプション認証ミドルウェア
 * トークンがあれば検証、なくても続行
 */
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        c.set("user", user);
        c.set("token", token);
      }
    } catch (error) {
      console.error("認証エラー:", error);
      // オプション認証なので、エラーでも続行
    }
  }

  await next();
});
