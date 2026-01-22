import { Hono } from "hono";
import * as GamesService from "../services/games.service";
import { authMiddleware } from "../middleware/auth";
import { supabase } from "../lib/supabase";

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
gamesRoutes.post("/", authMiddleware, async (c) => {
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
      const playTime = formData.get("play_time");
      const genreValue = formData.get("genre");
      const stock = formData.get("stock");
      const imageFile = formData.get("image") as File | null;

      if (id !== null && id !== "") gameData.id = parseInt(String(id), 10);
      if (title !== null && title !== "") gameData.title = String(title);
      if (description !== null) gameData.description = String(description);
      if (playerMin !== null && playerMin !== "") gameData.player_min = parseInt(String(playerMin), 10);
      if (playerMax !== null && playerMax !== "") gameData.player_max = parseInt(String(playerMax), 10);
      if (playTime !== null && playTime !== "") gameData.play_time = parseInt(String(playTime), 10);
      if (genreValue !== null && genreValue !== "") gameData.genre = String(genreValue);
      if (stock !== null && stock !== "") gameData.stock = parseInt(String(stock), 10);

      // 画像がある場合、Supabase Storage にアップロード
      if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const fileName = `game-${Date.now()}-${imageFile.name}`;
        
        const { data, error } = await supabase.storage
          .from("game-images")
          .upload(fileName, new Uint8Array(arrayBuffer), {
            contentType: imageFile.type,
            upsert: false
          });

        if (error) {
          throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
        }

        // 画像の URL を取得
        const { data: { publicUrl } } = supabase.storage
          .from("game-images")
          .getPublicUrl(fileName);

        gameData.image_url = publicUrl;
      }
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
gamesRoutes.put("/:id", authMiddleware, async (c) => {
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
      for (const [key, value] of formData.entries()) {
        if (key === "title" && value) updates.title = String(value);
        if (key === "description") updates.description = String(value);
        if (key === "player_min" && value) updates.player_min = parseInt(String(value), 10);
        if (key === "player_max" && value) updates.player_max = parseInt(String(value), 10);
        if (key === "play_time" && value) updates.play_time = parseInt(String(value), 10);
        if (key === "genre" && value) updates.genre = String(value);
        if (key === "stock" && value) updates.stock = parseInt(String(value), 10);
      }

      // 画像がある場合、Supabase Storage にアップロード
      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const fileName = `game-${id}-${Date.now()}-${imageFile.name}`;
        
        const { data, error } = await supabase.storage
          .from("game-images")
          .upload(fileName, new Uint8Array(arrayBuffer), {
            contentType: imageFile.type,
            upsert: false
          });

        if (error) {
          throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
        }

        // 画像の URL を取得
        const { data: { publicUrl } } = supabase.storage
          .from("game-images")
          .getPublicUrl(fileName);

        updates.image_url = publicUrl;
      }
    } else {
      // JSON形式の場合
      updates = await c.req.json();
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "更新するデータがありません" }, 400);
    }

    console.log(`ゲーム ${id} を更新する前:`, updates);
    
    // id フィールドを明示的に削除
    if ('id' in updates) {
      delete updates.id;
      console.log('id フィールドを削除しました');
    }
    
    console.log(`ゲーム ${id} を更新:`, updates);
    const game = await GamesService.updateGame(id, updates);
    return c.json(game);
  } catch (error) {
    console.error("ゲーム更新エラー:", error);
    return c.json({ error: error instanceof Error ? error.message : "ゲームの更新に失敗しました" }, 500);
  }
});

// DELETE /api/games/:id - ゲーム削除
gamesRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) {
    return c.json({ error: "有効なIDを指定してください" }, 400);
  }
  const result = await GamesService.deleteGame(id);
  return c.json(result);
});
