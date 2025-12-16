import { Hono } from "hono";
import * as ReservationsService from "../services/reservations.service";

export const reservationsRoutes = new Hono();

// GET /api/reservations/stats - 予約統計取得
reservationsRoutes.get("/stats", async (c) => {
  const stats = await ReservationsService.getReservationStats();
  return c.json(stats);
});

// GET /api/reservations/current - 現在予約中の全ゲーム（管理用）
reservationsRoutes.get("/current", async (c) => {
  const reservations = await ReservationsService.getAllCurrentReservations();
  return c.json(reservations);
});

// GET /api/reservations/user/:userId - ユーザーの予約履歴
reservationsRoutes.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const reservations = await ReservationsService.getUserReservations(userId);
  return c.json(reservations);
});

// GET /api/reservations/user/:userId/current - ユーザーの現在予約中
reservationsRoutes.get("/user/:userId/current", async (c) => {
  const userId = c.req.param("userId");
  const reservations = await ReservationsService.getCurrentReservations(userId);
  return c.json(reservations);
});

// GET /api/reservations/game/:gameId - ゲームの予約履歴
reservationsRoutes.get("/game/:gameId", async (c) => {
  const gameId = parseInt(c.req.param("gameId"), 10);
  if (isNaN(gameId)) {
    return c.json({ error: "有効なゲームIDを指定してください" }, 400);
  }
  const reservations = await ReservationsService.getGameReservations(gameId);
  return c.json(reservations);
});

// GET /api/reservations/check - ユーザーがゲームを予約中かチェック
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

// GET /api/reservations/guest?email=xxx - ゲストの予約履歴
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

// GET /api/reservations/:id - 特定の予約情報取得
reservationsRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const reservation = await ReservationsService.getReservationById(id);
  return c.json(reservation);
});

// GET /api/reservations/:id/verify?email=xxx - 予約確認（ゲスト用）
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

// POST /api/reservations/guest - ゲスト予約（ユーザー情報付き）
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

// POST /api/reservations - ゲーム予約
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
