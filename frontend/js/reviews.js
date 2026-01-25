const API_BASE_URL = "https://super-d-team.mi-ma-2x9-28.workers.dev";


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("review-form");
  const gameSelect = document.getElementById("game-select");
  const resultEl = document.getElementById("review-result");

  if (!form) return;

  // ゲーム一覧を読み込む
  loadGames();

  function showResult(message, type = "info") {
    if (!resultEl) return;
    resultEl.style.display = "block";
    resultEl.style.padding = "10px";
    resultEl.style.borderRadius = "8px";
    resultEl.style.background =
      type === "error" ? "rgba(255,0,0,0.08)" : "rgba(0,128,0,0.08)";
    resultEl.style.border =
      type === "error"
        ? "1px solid rgba(255,0,0,0.25)"
        : "1px solid rgba(0,128,0,0.25)";
    resultEl.textContent = message;
  }

  function getValues() {
    const fd = new FormData(form);
    const gameId = parseInt(fd.get("game_id"), 10);
    const guestName = String(fd.get("guest_name") || "").trim();
    const rating = parseInt(fd.get("rating") || "0", 10);
    const comment = String(fd.get("comment") || "").trim();
    return { gameId, guestName, rating, comment };
  }

  async function loadGames() {
    if (!gameSelect) {
      console.error("ゲーム選択要素が見つかりません");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/games`);
      if (!response.ok) {
        throw new Error("ゲーム一覧の取得に失敗しました");
      }

      const games = await response.json();

      // 既存のオプションをクリア（最初の「選択」以外）
      while (gameSelect.options.length > 1) {
        gameSelect.remove(1);
      }

      games.forEach((game) => {
        const option = document.createElement("option");
        option.value = game.id;
        option.textContent = game.title;
        gameSelect.appendChild(option);
      });

      if (games.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "ゲームがありません";
        option.disabled = true;
        gameSelect.appendChild(option);
      }
    } catch (error) {
      console.error("ゲーム一覧の読み込みエラー:", error);
      showResult(
        "ゲーム一覧の読み込みに失敗しました。ページを再読み込みしてください。",
        "error"
      );
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const { gameId, guestName, rating, comment } = getValues();

    if (!Number.isFinite(gameId) || gameId <= 0) {
      showResult("ゲームを選択してください", "error");
      return;
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      showResult("評価（★）を1〜5で選択してください", "error");
      return;
    }

    if (!comment) {
      showResult("コメントを入力してください", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "送信中...";
      }

      const payload = {
        gameId,
        rating,
        comment,
        guestName: guestName || null,
      };

      const res = await fetch(`${API_BASE_URL}/reviews/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "レビューの投稿に失敗しました");
      }

      showResult("レビューを投稿しました！", "info");

      form.reset();
      // 星表示をリセット
      if (typeof window.setRating === "function") {
        window.setRating(0);
      }
    } catch (e) {
      showResult(`レビューの投稿に失敗しました: ${e.message}`, "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "送信する";
      }
    }
  });
});
