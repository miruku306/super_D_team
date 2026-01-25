import { getAvailableGames } from "./services/games.service";

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    // CORS（超重要）
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ヘルスチェック
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({ message: "Super D Team API", status: "ok" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ✅ ゲーム一覧（在庫あり）
    if (url.pathname === "/api/games/available") {
      const games = await getAvailableGames();
      return new Response(JSON.stringify(games), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
