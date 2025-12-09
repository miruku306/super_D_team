import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

// Cloudflare Workers用の環境変数型定義
export type Env = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

// シングルトン用でキャッシュしておく
let supabaseInstance: SupabaseClient<Database> | null = null;
let supabaseAdminInstance: SupabaseClient<Database> | null = null;
let currentEnv: Env | null = null;

/**
 * Supabaseクライアントを取得
 */
export function getSupabase(env: Env): SupabaseClient<Database> {
  // 環境変数が変わったらインスタンスを再生成
  if (supabaseInstance && currentEnv === env) {
    return supabaseInstance;
  }

  const supabaseUrl = env.SUPABASE_URL;
  const clientKey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not set");
  }

  if (!clientKey) {
    throw new Error("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is not set");
  }

  currentEnv = env;
  supabaseInstance = createClient<Database>(supabaseUrl, clientKey);
  return supabaseInstance;
}

/**
 * Supabase管理者クライアントを取得（RLSバイパス）
 */
export function getSupabaseAdmin(env: Env): SupabaseClient<Database> | null {
  if (supabaseAdminInstance && currentEnv === env) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = env.SUPABASE_URL;
  const adminKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !adminKey) {
    return null;
  }

  currentEnv = env;
  supabaseAdminInstance = createClient<Database>(supabaseUrl, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseAdminInstance;
}

// 後方互換性のため（Workersではミドルウェアでセットする）
export let supabase: SupabaseClient<Database>;
export let supabaseAdmin: SupabaseClient<Database> | null = null;

export function initSupabase(env: Env) {
  supabase = getSupabase(env);
  supabaseAdmin = getSupabaseAdmin(env);
}
