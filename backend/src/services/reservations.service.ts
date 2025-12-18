import { supabase } from "../lib/supabase";
import { Database } from "../types/database.types";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];
type ReservationInsert = Database["public"]["Tables"]["reservations"]["Insert"];

/**
 * ゲストとしてゲームを予約する（ユーザー情報を含む）
 */
export async function reserveGameAsGuest(
  gameId: number,
  guestInfo: {
    name: string;
    email: string;
    phone?: string;
    start_date?: string;
    end_date?: string;
    players?: string;
    notes?: string;
  }
) {
  const { data, error } = await supabase.rpc("reserve_game_as_guest", {
    p_game_id: gameId,
    p_guest_name: guestInfo.name,
    p_guest_email: guestInfo.email,
    p_guest_phone: guestInfo.phone || null,
    p_start_date: guestInfo.start_date || null,
    p_end_date: guestInfo.end_date || null,
    p_players: guestInfo.players || null,
    p_notes: guestInfo.notes || null,
  });

  if (error) {
    throw new Error(`予約処理に失敗しました: ${error.message}`);
  }

  const result = data as {
    success: boolean;
    error?: string;
    reservation_id?: number;
    id?: number;
  };

  if (!result.success) {
    throw new Error(result.error || "予約処理に失敗しました");
  }

  return result;
}

/**
 * ゲームを予約する（トランザクション関数を使用）
 */
export async function reserveGame(gameId: number, userId: string) {
  const { data, error } = await supabase.rpc("reserve_game", {
    p_game_id: gameId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`予約処理に失敗しました: ${error.message}`);
  }

  const result = data as {
    success: boolean;
    error?: string;
    reservation_id?: number;
  };

  if (!result.success) {
    throw new Error(result.error || "予約処理に失敗しました");
  }

  return result;
}

/**
 * ゲームを返却する（トランザクション関数を使用）
 */
export async function returnGame(reservationId: number, userId: string) {
  const { data, error } = await supabase.rpc("return_game", {
    p_reservation_id: reservationId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`返却処理に失敗しました: ${error.message}`);
  }

  const result = data as { success: boolean; error?: string };

  if (!result.success) {
    throw new Error(result.error || "返却処理に失敗しました");
  }

  return result;
}

/**
 * 予約をキャンセルする（トランザクション関数を使用）
 */
export async function cancelReservation(reservationId: number, userId: string) {
  const { data, error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: reservationId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`キャンセル処理に失敗しました: ${error.message}`);
  }

  const result = data as { success: boolean; error?: string };

  if (!result.success) {
    throw new Error(result.error || "キャンセル処理に失敗しました");
  }

  return result;
}

/**
 * ユーザーの予約履歴を取得
 */
export async function getUserReservations(userId: string) {
  const { data, error } = await supabase
    .from("reservations")
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
    .order("reserved_at", { ascending: false });

  if (error) {
    throw new Error(`予約履歴の取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ユーザーの現在予約中のゲームを取得
 */
export async function getCurrentReservations(userId: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      games (
        id,
        title,
        description,
        image_url,
        player_min,
        player_max
      )
    `
    )
    .eq("user_id", userId)
    .eq("status", "reserved")
    .order("reserved_at", { ascending: false });

  if (error) {
    throw new Error(`現在の予約情報の取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 特定のゲームの予約履歴を取得
 */
export async function getGameReservations(gameId: number) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("game_id", gameId)
    .order("reserved_at", { ascending: false });

  if (error) {
    throw new Error(`ゲームの予約履歴の取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 特定の予約情報を取得
 */
export async function getReservationById(reservationId: number) {
  const { data, error } = await supabase
    .from("reservations")
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
    .eq("id", reservationId)
    .single();

  if (error) {
    throw new Error(`予約情報の取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ユーザーが特定のゲームを予約しているかチェック
 */
export async function isGameReservedByUser(gameId: number, userId: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select("id")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .eq("status", "reserved")
    .maybeSingle();

  if (error) {
    throw new Error(`予約状況の確認に失敗しました: ${error.message}`);
  }

  return !!data;
}

/**
 * 全ての現在予約中のゲームを取得（管理用）
 */
export async function getAllCurrentReservations() {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      games (
        title,
        image_url
      )
    `
    )
    .eq("status", "reserved")
    .order("reserved_at", { ascending: false });

  if (error) {
    throw new Error(`予約中のゲーム一覧の取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * 予約統計情報を取得
 */
export async function getReservationStats() {
  // 総予約数
  const { count: totalReservations, error: totalError } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true });

  // 現在予約中
  const { count: currentReservations, error: currentError } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "reserved");

  // 返却済み
  const { count: returnedReservations, error: returnedError } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "returned");

  // キャンセル済み
  const { count: cancelledReservations, error: cancelledError } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "cancelled");

  if (totalError || currentError || returnedError || cancelledError) {
    throw new Error("予約統計の取得に失敗しました");
  }

  return {
    total: totalReservations || 0,
    current: currentReservations || 0,
    returned: returnedReservations || 0,
    cancelled: cancelledReservations || 0,
  };
}

/**
 * ゲストの予約履歴を取得（メールアドレスで検索）
 */
export async function getGuestReservations(email: string) {
  const { data, error } = await supabase
    .from("reservations")
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
    .eq("guest_email", email)
    .order("reserved_at", { ascending: false });

  if (error) {
    throw new Error(`ゲスト予約履歴の取得に失敗しました: ${error.message}`);
  }

  return data;
}

/**
 * ゲストの現在予約中のゲームを取得
 */
export async function getCurrentGuestReservations(email: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      games (
        id,
        title,
        description,
        image_url,
        player_min,
        player_max
      )
    `
    )
    .eq("guest_email", email)
    .eq("status", "reserved")
    .order("reserved_at", { ascending: false });

  if (error) {
    throw new Error(
      `ゲストの現在予約情報の取得に失敗しました: ${error.message}`
    );
  }

  return data;
}

/**
 * 予約IDとメールアドレスで予約を確認（ゲスト用）
 */
export async function verifyGuestReservation(
  reservationId: number,
  email: string
) {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      games (
        id,
        title,
        description,
        image_url,
        player_min,
        player_max
      )
    `
    )
    .eq("id", reservationId)
    .eq("guest_email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("予約が見つかりません");
    }
    throw new Error(`予約確認に失敗しました: ${error.message}`);
  }

  return data;
}
