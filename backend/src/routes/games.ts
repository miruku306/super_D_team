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
  try {
    const contentType = c.req.header("content-type") || "";
    let gameData: any = {};

    if (contentType.includes("multipart/form-data")) {
      // FormData形式の場合
      const formData = await c.req.formData();
      
      // フォームデータをオブジェクトに変換
      const id = formData.get("id");
      const title = formData.get("title");
      const description = formData.get("description");
      const playerMin = formData.get("player_min");
      const playerMax = formData.get("player_max");
      const stock = formData.get("stock");

      if (id !== null && id !== "") gameData.id = parseInt(String(id), 10);
      if (title !== null && title !== "") gameData.title = String(title);
      if (description !== null) gameData.description = String(description);
      if (playerMin !== null && playerMin !== "") gameData.player_min = parseInt(String(playerMin), 10);
      if (playerMax !== null && playerMax !== "") gameData.player_max = parseInt(String(playerMax), 10);
      if (stock !== null && stock !== "") gameData.stock = parseInt(String(stock), 10);
    } else {
      // JSON形式の場合
      gameData = await c.req.json();
    }

    if (!gameData.title) {
      return c.json({ error: "タイトルは必須です" }, 400);
    }

    const game = await GamesService.createGame(gameData);
    return c.json(game, 201);
  } catch (error) {
    console.error("ゲーム追加エラー:", error);
    return c.json({ error: error instanceof Error ? error.message : "ゲームの追加に失敗しました" }, 500);
  }
});

// PUT /api/games/:id - ゲーム更新
gamesRoutes.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }

  try {
    const contentType = c.req.header("content-type") || "";
    let updates: any = {};

    if (contentType.includes("multipart/form-data")) {
      // FormData形式の場合
      const formData = await c.req.formData();
      
      // フォームデータをオブジェクトに変換
      const title = formData.get("title");
      const description = formData.get("description");
      const playerMin = formData.get("player_min");
      const playerMax = formData.get("player_max");
      const stock = formData.get("stock");

      if (title !== null && title !== "") updates.title = String(title);
      if (description !== null) updates.description = String(description);
      if (playerMin !== null && playerMin !== "") updates.player_min = parseInt(String(playerMin), 10);
      if (playerMax !== null && playerMax !== "") updates.player_max = parseInt(String(playerMax), 10);
      if (stock !== null && stock !== "") updates.stock = parseInt(String(stock), 10);
    } else {
      // JSON形式の場合
      updates = await c.req.json();
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "更新するデータがありません" }, 400);
    }

    const game = await GamesService.updateGame(id, updates);
    return c.json(game);
  } catch (error) {
    console.error("ゲーム更新エラー:", error);
    return c.json({ error: error instanceof Error ? error.message : "ゲームの更新に失敗しました" }, 500);
  }
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
