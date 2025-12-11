import { Hono } from "hono";
import * as ReviewsService from "../services/reviews.service";

export const reviewsRoutes = new Hono();

// GET /api/reviews/recent - 最新レビュー取得
reviewsRoutes.get("/recent", async (c) => {
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const reviews = await ReviewsService.getRecentReviews(limit);
  return c.json(reviews);
});

// GET /api/reviews/game/:gameId - ゲームのレビュー取得
reviewsRoutes.get("/game/:gameId", async (c) => {
  const gameId = parseInt(c.req.param("gameId"), 10);
  if (isNaN(gameId)) {
    return c.json({ error: "有効なゲームIDを指定してください" }, 400);
  }
  const reviews = await ReviewsService.getGameReviews(gameId);
  return c.json(reviews);
});

// GET /api/reviews/game/:gameId/stats - ゲームの評価統計
reviewsRoutes.get("/game/:gameId/stats", async (c) => {
  const gameId = parseInt(c.req.param("gameId"), 10);
  if (isNaN(gameId)) {
    return c.json({ error: "有効なゲームIDを指定してください" }, 400);
  }
  const stats = await ReviewsService.getGameRatingStats(gameId);
  return c.json(stats);
});

// GET /api/reviews/game/:gameId/top - 高評価レビュー取得
reviewsRoutes.get("/game/:gameId/top", async (c) => {
  const gameId = parseInt(c.req.param("gameId"), 10);
  const minRating = parseInt(c.req.query("minRating") || "4", 10);
  if (isNaN(gameId)) {
    return c.json({ error: "有効なゲームIDを指定してください" }, 400);
  }
  const reviews = await ReviewsService.getTopRatedReviews(gameId, minRating);
  return c.json(reviews);
});

// GET /api/reviews/user/:userId - ユーザーのレビュー取得
reviewsRoutes.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const reviews = await ReviewsService.getUserReviews(userId);
  return c.json(reviews);
});

// GET /api/reviews/check - ユーザーがゲームをレビュー済みかチェック
reviewsRoutes.get("/check", async (c) => {
  const gameId = parseInt(c.req.query("gameId") || "", 10);
  const userId = c.req.query("userId");
  if (isNaN(gameId) || !userId) {
    return c.json({ error: "gameIdとuserIdを指定してください" }, 400);
  }
  const hasReviewed = await ReviewsService.hasUserReviewedGame(gameId, userId);
  return c.json({ hasReviewed });
});

// GET /api/reviews/:id - 特定のレビュー取得
reviewsRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const review = await ReviewsService.getReviewById(id);
  return c.json(review);
});

// POST /api/reviews - レビュー投稿
reviewsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const review = await ReviewsService.createReview(body);
  return c.json(review, 201);
});

// PUT /api/reviews/:id - レビュー更新
reviewsRoutes.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const body = await c.req.json();
  const { userId, ...updates } = body;
  if (!userId) {
    return c.json({ error: "userIdを指定してください" }, 400);
  }
  const review = await ReviewsService.updateReview(id, userId, updates);
  return c.json(review);
});

// DELETE /api/reviews/:id - レビュー削除
reviewsRoutes.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const userId = c.req.query("userId");
  if (!userId) {
    return c.json({ error: "userIdを指定してください" }, 400);
  }
  const result = await ReviewsService.deleteReview(id, userId);
  return c.json(result);
});
