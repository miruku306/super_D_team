import { Hono } from "hono";
import * as GamesService from "../services/games.service";

export const gamesRoutes = new Hono();

// GET /api/games - 全ゲーム取得
gamesRoutes.get("/", async (c) => {
  const games = await GamesService.getAllGames();
  return c.json(games);
});

// GET /api/games/available - 在庫のあるゲーム取得
gamesRoutes.get("/available", async (c) => {
  const games = await GamesService.getAvailableGames();
  return c.json(games);
});

// GET /api/games/search - ゲーム検索
gamesRoutes.get("/search", async (c) => {
  const query = c.req.query("q");
  if (!query) {
    return c.json({ error: "検索キーワードを指定してください" }, 400);
  }
  const games = await GamesService.searchGames(query);
  return c.json(games);
});

// GET /api/games/players/:count - プレイ人数でフィルタ
gamesRoutes.get("/players/:count", async (c) => {
  const count = parseInt(c.req.param("count"), 10);
  if (isNaN(count) || count < 1) {
    return c.json({ error: "有効なプレイ人数を指定してください" }, 400);
  }
  const games = await GamesService.getGamesByPlayerCount(count);
  return c.json(games);
});

// GET /api/games/:id - 特定のゲーム取得
gamesRoutes.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const game = await GamesService.getGameById(id);
  return c.json(game);
});

// GET /api/games/:id/reviews - ゲームをレビュー付きで取得
gamesRoutes.get("/:id/reviews", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const game = await GamesService.getGameWithReviews(id);
  return c.json(game);
});

// GET /api/games/:id/rating - ゲームの平均評価取得
gamesRoutes.get("/:id/rating", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const rating = await GamesService.getGameAverageRating(id);
  return c.json(rating);
});

// POST /api/games - ゲーム追加
gamesRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const game = await GamesService.createGame(body);
  return c.json(game, 201);
});

// PUT /api/games/:id - ゲーム更新
gamesRoutes.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const body = await c.req.json();
  const game = await GamesService.updateGame(id, body);
  return c.json(game);
});

// DELETE /api/games/:id - ゲーム削除
gamesRoutes.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const result = await GamesService.deleteGame(id);
  return c.json(result);
});
