/**
 * Backend Entry Point
 * Supabaseデータフェッチ関数のエントリーポイント
 */

// Services のエクスポート
export * as GamesService from "./services/games.service";
export * as ReservationsService from "./services/reservations.service";
export * as ReviewsService from "./services/reviews.service";

// Supabase クライアントのエクスポート
export { supabase, supabaseAdmin } from "./lib/supabase";

// 型定義のエクスポート
export type { Database } from "./types/database.types";

/**
 * 使用例:
 *
 * import { GamesService, ReservationsService, supabase } from './backend';
 *
 * // 全ゲームを取得
 * const games = await GamesService.getAllGames();
 *
 * // 在庫のあるゲームを取得
 * const availableGames = await GamesService.getAvailableGames();
 *
 * // ゲームを予約する
 * const result = await ReservationsService.reserveGame(gameId, userId);
 *
 * // 予約をキャンセル
 * await ReservationsService.cancelReservation(reservationId, userId);
 *
 * // レビューを投稿
 * const review = await ReviewsService.createReview({
 *   game_id: gameId,
 *   user_id: userId,
 *   rating: 5,
 *   comment: '最高のゲームです！'
 * });
 */
