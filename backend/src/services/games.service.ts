import { supabase } from "../lib/supabase";
import { Database } from "../types/database.types";

type Game = Database["public"]["Tables"]["games"]["Row"];
type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

/**
 * 全ゲームを取得
 */
export async function getAllGames() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`ゲームの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 在庫のあるゲームのみ取得
 */
export async function getAvailableGames() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .gt("stock", 0)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`在庫のあるゲームの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 特定のゲームを取得
 */
export async function getGameById(id: number) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`ゲームの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ゲームをレビュー情報付きで取得
 */
export async function getGameWithReviews(id: number) {
  const { data, error } = await supabase
    .from("games")
    .select(
      `
      *,
      reviews (
        id,
        rating,
        comment,
        created_at,
        user_id,
        users (
          name
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`ゲーム情報の取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ゲームを検索（タイトル、説明文から）
 */
export async function searchGames(query: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`ゲームの検索に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * プレイ人数でゲームをフィルタリング
 */
export async function getGamesByPlayerCount(playerCount: number) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .lte("player_min", playerCount)
    .gte("player_max", playerCount)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`ゲームの取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 新しいゲームを追加
 */
export async function createGame(game: GameInsert) {
  const { data, error } = await supabase
    .from("games")
    .insert(game)
    .select()
    .single();

  if (error) {
    throw new Error(`ゲームの追加に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ゲーム情報を更新
 */
export async function updateGame(id: number, updates: GameUpdate) {
  // id フィールドを削除（PRIMARY KEY は更新不可）
  const filteredUpdates = { ...updates };
  delete (filteredUpdates as any).id;

  console.log(`データベース更新: ID=${id}, 更新内容=`, filteredUpdates);

  const { error } = await supabase
    .from("games")
    .update(filteredUpdates)
    .eq("id", id);

  if (error) {
    console.error(`UPDATE エラー (ID=${id}):`, error);
    throw new Error(`ゲームの更新に失敗しました: ${error.message}`);
  }

  console.log(`UPDATE 成功 (ID=${id})`);

  // 更新後、更新されたゲームを取得
  const { data, error: selectError } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (selectError) {
    console.error(`SELECT エラー (ID=${id}):`, selectError);
    throw new Error(`更新されたゲームの取得に失敗しました: ${selectError.message}`);
  }

  console.log(`SELECT 成功 (ID=${id}):`, data);

  return data;
}

/**
 * ゲームを削除
 */
export async function deleteGame(id: number) {
  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) {
    throw new Error(`ゲームの削除に失敗しました: ${error.message}`);
  }

  return { success: true };
}

/**
 * ゲームの平均評価を計算
 */
export async function getGameAverageRating(gameId: number) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("game_id", gameId);

  if (error) {
    throw new Error(`評価の取得に失敗しました: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = data.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / data.length;

  return {
    average: Math.round(average * 10) / 10, // 小数点第1位まで
    count: data.length,
  };
}

