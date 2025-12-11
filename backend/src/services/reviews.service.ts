import { supabase } from "../lib/supabase";
import { Database } from "../types/database.types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

/**
 * 特定のゲームのレビューを取得
 */
export async function getGameReviews(gameId: number) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`レビューの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ユーザーのレビューを取得
 */
export async function getUserReviews(userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      games (
        id,
        title,
        image_url
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`ユーザーのレビューの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 特定のレビューを取得
 */
export async function getReviewById(reviewId: number) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      games (
        title
      )
    `
    )
    .eq("id", reviewId)
    .single();

  if (error) {
    throw new Error(`レビューの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * レビューを投稿
 */
export async function createReview(review: ReviewInsert) {
  // 評価値のバリデーション
  if (review.rating < 1 || review.rating > 5) {
    throw new Error("評価は1〜5の範囲で指定してください");
  }

  // 既にレビュー済みかチェック
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("game_id", review.game_id)
    .eq("user_id", review.user_id || "")
    .maybeSingle();

  if (existing) {
    throw new Error("このゲームには既にレビューを投稿しています");
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert(review)
    .select()
    .single();

  if (error) {
    throw new Error(`レビューの投稿に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * レビューを更新
 */
export async function updateReview(
  reviewId: number,
  userId: string,
  updates: ReviewUpdate
) {
  // 評価値のバリデーション
  if (
    updates.rating !== undefined &&
    (updates.rating < 1 || updates.rating > 5)
  ) {
    throw new Error("評価は1〜5の範囲で指定してください");
  }

  const { data, error } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`レビューの更新に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * レビューを削除
 */
export async function deleteReview(reviewId: number, userId: string) {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`レビューの削除に失敗しました: ${error.message}`);
  }

  return { success: true };
}

/**
 * ゲームの平均評価とレビュー数を取得
 */
export async function getGameRatingStats(gameId: number) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("game_id", gameId);

  if (error) {
    throw new Error(`評価統計の取得に失敗しました: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / data.length;

  // 評価の分布を計算
  const distribution = data.reduce(
    (acc, review) => {
      acc[review.rating as keyof typeof acc] =
        (acc[review.rating as keyof typeof acc] || 0) + 1;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );

  return {
    average: Math.round(average * 10) / 10,
    count: data.length,
    distribution,
  };
}

/**
 * 最新のレビューを取得（全ゲーム対象）
 */
export async function getRecentReviews(limit: number = 10) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      games (
        id,
        title,
        image_url
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`最新レビューの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 高評価のレビューを取得
 */
export async function getTopRatedReviews(
  gameId: number,
  minRating: number = 4
) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("game_id", gameId)
    .gte("rating", minRating)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`高評価レビューの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ユーザーが特定のゲームをレビュー済みかチェック
 */
export async function hasUserReviewedGame(gameId: number, userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`レビュー状況の確認に失敗しました: ${error.message}`);
  }

  return !!data;
}
