import { Hono } from "hono";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

type Env = {
  Variables: {
    user: any;
    token: string;
  };
};

export const authRoutes = new Hono<Env>();

/**
 * POST /api/auth/login - ログイン
 * リクエスト: { email: string, password: string }
 * レスポンス: { user: User, session: Session } または { error: string }
 */
authRoutes.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        { error: "メールアドレスとパスワードを入力してください" },
        400
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error("ログインエラー:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "ログインに失敗しました" },
      500
    );
  }
});

/**
 * GET /api/auth/me - 現在のユーザー情報を取得
 * ヘッダー: Authorization: Bearer <token>
 * レスポンス: { user: User }
 */
authRoutes.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

/**
 * POST /api/auth/verify-token - トークンを検証
 * ヘッダー: Authorization: Bearer <token>
 * レスポンス: { valid: boolean, user?: User }
 */
authRoutes.post("/verify-token", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json({ valid: true, user });
});

/**
 * POST /api/auth/logout - ログアウト
 * ヘッダー: Authorization: Bearer <token>
 * レスポンス: { success: boolean }
 */
authRoutes.post("/logout", authMiddleware, async (c) => {
  const user = c.get("user");

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.auth.admin.signOut(user.id);
    if (error) {
      return c.json({ error: "ログアウトに失敗しました" }, 500);
    }
  }

  return c.json({ success: true });
});
