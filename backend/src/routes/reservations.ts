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

// GET /api/reservations/:id - 特定の予約情報取得
reservationsRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const reservation = await ReservationsService.getReservationById(id);
  return c.json(reservation);
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
