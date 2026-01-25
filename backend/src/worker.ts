import { getAvailableGames } from "./services/games.service";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);

    // CORS プリフライト対応
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // GET /api/games/available
    if (
      request.method === "GET" &&
      url.pathname === "/api/games/available"
    ) {
      try {
        const games = await getAvailableGames();
        return new Response(JSON.stringify(games), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        });
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: e.message }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          }
        );
      }
    }

    // Not Found
    return new Response("Not Found", {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};
