import { Hono } from "hono";
import * as ReservationsService from "../services/reservations.service";

export const reservationsRoutes = new Hono();

/**
 * =============================================================================
 * 管理者向けエンドポイント（スタッフ・管理画面で使用）
 * =============================================================================
 */

// GET /api/reservations/stats - 予約統計取得
// スコープ: 管理者
// 用途: ダッシュボードでの統計表示
reservationsRoutes.get("/stats", async (c) => {
  const stats = await ReservationsService.getReservationStats();
  return c.json(stats);
});

// GET /api/reservations/current - 現在予約中の全ゲーム（管理用）
// スコープ: 管理者
// 用途: 全予約の一覧表示、在庫管理
reservationsRoutes.get("/current", async (c) => {
  const reservations = await ReservationsService.getAllCurrentReservations();
  return c.json(reservations);
});

// GET /api/reservations/game/:gameId - ゲームの予約履歴
// スコープ: 管理者
// 用途: 特定ゲームの予約履歴確認
reservationsRoutes.get("/game/:gameId", async (c) => {
  const gameId = parseInt(c.req.param("gameId"), 10);
  if (isNaN(gameId)) {
    return c.json({ error: "有効なゲームIDを指定してください" }, 400);
  }
  const reservations = await ReservationsService.getGameReservations(gameId);
  return c.json(reservations);
});

/**
 * =============================================================================
 * 認証ユーザー向けエンドポイント（将来的な会員制度用・現在は非推奨）
 * =============================================================================
 * 注意: 基本的にはゲスト予約を使用することを推奨
 *       これらのエンドポイントは将来的な拡張のために残している
 */

// GET /api/reservations/user/:userId - ユーザーの予約履歴
// スコープ: 認証ユーザー（非推奨）
// 用途: 会員の予約履歴確認（将来的な会員制度用）
reservationsRoutes.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const reservations = await ReservationsService.getUserReservations(userId);
  return c.json(reservations);
});

// GET /api/reservations/user/:userId/current - ユーザーの現在予約中
// スコープ: 認証ユーザー（非推奨）
// 用途: 会員の現在予約中確認（将来的な会員制度用）
reservationsRoutes.get("/user/:userId/current", async (c) => {
  const userId = c.req.param("userId");
  const reservations = await ReservationsService.getCurrentReservations(userId);
  return c.json(reservations);
});

// GET /api/reservations/check - ユーザーがゲームを予約中かチェック
// スコープ: 認証ユーザー（非推奨）
// 用途: 会員の予約状況確認（将来的な会員制度用）
reservationsRoutes.get("/check", async (c) => {
  const gameId = parseInt(c.req.query("gameId") || "", 10);
  const userId = c.req.query("userId");
  if (isNaN(gameId) || !userId) {
    return c.json({ error: "gameIdとuserIdを指定してください" }, 400);
  }
  const isReserved = await ReservationsService.isGameReservedByUser(
    gameId,
    userId
  );
  return c.json({ isReserved });
});

/**
 * =============================================================================
 * ゲスト向けエンドポイント（お客さん用・推奨）
 * =============================================================================
 * これらのエンドポイントが主要な予約方法です
 */

// POST /api/reservations/guest - ゲスト予約（ユーザー情報付き）
// スコープ: ゲスト（お客さん）★推奨★
// 用途: お客さんがゲームを予約する際のメインエンドポイント
reservationsRoutes.post("/guest", async (c) => {
  const body = await c.req.json();
  const { gameId, guestInfo } = body;

  if (!gameId) {
    return c.json({ error: "gameIdを指定してください" }, 400);
  }

  if (!guestInfo || !guestInfo.name || !guestInfo.email) {
    return c.json(
      { error: "ゲスト情報（name, email）を指定してください" },
      400
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(guestInfo.email)) {
    return c.json({ error: "有効なメールアドレスを指定してください" }, 400);
  }

  const result = await ReservationsService.reserveGameAsGuest(
    gameId,
    guestInfo
  );
  return c.json(result, 201);
});

// GET /api/reservations/guest?email=xxx - ゲストの予約履歴
// スコープ: ゲスト（お客さん）
// 用途: お客さんが自分の予約履歴を確認
reservationsRoutes.get("/guest", async (c) => {
  const email = c.req.query("email");

  if (!email) {
    return c.json({ error: "emailを指定してください" }, 400);
  }

  // メールアドレスのバリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: "有効なメールアドレスを指定してください" }, 400);
  }

  const reservations = await ReservationsService.getGuestReservations(email);
  return c.json(reservations);
});

// GET /api/reservations/guest/current?email=xxx - ゲストの現在予約中
// スコープ: ゲスト（お客さん）
// 用途: お客さんが現在予約中のゲームを確認
reservationsRoutes.get("/guest/current", async (c) => {
  const email = c.req.query("email");

  if (!email) {
    return c.json({ error: "emailを指定してください" }, 400);
  }

  // メールアドレスのバリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: "有効なメールアドレスを指定してください" }, 400);
  }

  const reservations = await ReservationsService.getCurrentGuestReservations(
    email
  );
  return c.json(reservations);
});

// GET /api/reservations/:id/verify?email=xxx - 予約確認（ゲスト用）
// スコープ: ゲスト（お客さん）
// 用途: 予約IDとメールアドレスで特定の予約を確認（セキュア）
reservationsRoutes.get("/:id/verify", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const email = c.req.query("email");

  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }

  if (!email) {
    return c.json({ error: "emailを指定してください" }, 400);
  }

  // メールアドレスのバリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.json({ error: "有効なメールアドレスを指定してください" }, 400);
  }

  try {
    const reservation = await ReservationsService.verifyGuestReservation(
      id,
      email
    );
    return c.json(reservation);
  } catch (error) {
    if (error instanceof Error && error.message === "予約が見つかりません") {
      return c.json({ error: "予約が見つかりません" }, 404);
    }
    throw error;
  }
});

/**
 * =============================================================================
 * 共通エンドポイント
 * =============================================================================
 */

// GET /api/reservations/:id - 特定の予約情報取得
// スコープ: 管理者・ゲスト共通
// 用途: 予約IDから予約情報を取得
reservationsRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const reservation = await ReservationsService.getReservationById(id);
  return c.json(reservation);
});

// POST /api/reservations - ゲーム予約（認証ユーザー用）
// スコープ: 認証ユーザー（非推奨）
// 用途: 将来的な会員制度用。通常は /guest を使用すること
reservationsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { gameId, userId } = body;
  if (!gameId || !userId) {
    return c.json({ error: "gameIdとuserIdを指定してください" }, 400);
  }
  const result = await ReservationsService.reserveGame(gameId, userId);
  return c.json(result, 201);
});

// POST /api/reservations/:id/return - ゲーム返却
// スコープ: 管理者（スタッフ）
// 用途: お客さんがゲームを返却した際にスタッフが処理
// 注意: userIdは管理者のIDを想定（将来的に変更の可能性あり）
reservationsRoutes.post("/:id/return", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const body = await c.req.json();
  const { userId } = body;
  if (!userId) {
    return c.json({ error: "userIdを指定してください" }, 400);
  }
  const result = await ReservationsService.returnGame(id, userId);
  return c.json(result);
});

// POST /api/reservations/:id/cancel - 予約キャンセル
// スコープ: 管理者（スタッフ）
// 用途: 予約をキャンセルする際にスタッフが処理
// 注意: userIdは管理者のIDを想定（将来的に変更の可能性あり）
reservationsRoutes.post("/:id/cancel", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const body = await c.req.json();
  const { userId } = body;
  if (!userId) {
    return c.json({ error: "userIdを指定してください" }, 400);
  }
  const result = await ReservationsService.cancelReservation(id, userId);
  return c.json(result);
});
