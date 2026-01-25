const API_BASE_URL = "https://super-d-team.mi-ma-2x9-28.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".rental-form");

  if (!form) {
    console.error("予約フォームが見つかりません");
    return;
  }

  // ゲーム一覧を読み込む
  loadGames();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const gameName = formData.get("game");
    const startDate = formData.get("start_date");
    const endDate = formData.get("end_date");
    const players = formData.get("players");
    const notes = formData.get("notes");

    if (!name || !email || !gameName || !startDate || !endDate) {
      alert("必須項目を入力してください");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("有効なメールアドレスを入力してください");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      alert("返却予定日は貸出日より後の日付を指定してください");
      return;
    }

    try {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "送信中...";

      const gamesResponse = await fetch(`${API_BASE_URL}/api/games`);
      if (!gamesResponse.ok) {
        throw new Error("ゲーム情報の取得に失敗しました");
      }

      const games = await gamesResponse.json();
      const game = games.find((g) => g.title === gameName);

      if (!game) {
        alert(
          `選択されたゲーム「${gameName}」が見つかりません。\n利用可能なゲーム: ${games
            .map((g) => g.title)
            .join(", ")}`
        );
        submitButton.disabled = false;
        submitButton.textContent = "申し込みを送信";
        return;
      }

      const reservationData = {
        gameId: game.id,
        guestInfo: {
          name,
          email,
          phone: phone || null,
          start_date: startDate,
          end_date: endDate,
          players,
          notes: notes || null,
        },
      };

      const response = await fetch(
        `${API_BASE_URL}/api/reservations/guest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reservationData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "予約の送信に失敗しました");
      }

      const result = await response.json();

      alert(
        `予約が完了しました！\n\n予約ID: ${result.id}\nゲーム: ${gameName}\n貸出日: ${startDate}\n返却予定日: ${endDate}\n\n確認メールを ${email} に送信しました。`
      );

      form.reset();
    } catch (error) {
      console.error("予約エラー:", error);
      alert(`予約に失敗しました: ${error.message}`);
    } finally {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = "申し込みを送信";
    }
  });

  const today = new Date().toISOString().split("T")[0];
  const startDateInput = form.querySelector('input[name="start_date"]');
  const endDateInput = form.querySelector('input[name="end_date"]');

  if (startDateInput) {
    startDateInput.min = today;
    startDateInput.addEventListener("change", () => {
      if (endDateInput && startDateInput.value) {
        endDateInput.min = startDateInput.value;
        if (endDateInput.value && endDateInput.value <= startDateInput.value) {
          endDateInput.value = "";
        }
      }
    });
  }

  if (endDateInput) {
    endDateInput.min = today;
  }

  async function loadGames() {
    const gameSelect = document.getElementById("game-select");
    if (!gameSelect) {
      console.error("ゲーム選択要素が見つかりません");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/games/available`
      );
      if (!response.ok) {
        throw new Error("ゲーム一覧の取得に失敗しました");
      }

      const games = await response.json();

      while (gameSelect.options.length > 1) {
        gameSelect.remove(1);
      }

      games.forEach((game) => {
        const option = document.createElement("option");
        option.value = game.title;
        option.textContent = `${game.title} (在庫: ${game.stock})`;
        gameSelect.appendChild(option);
      });

      if (games.length === 0) {
        const option = document.createElement("option");
        option.textContent = "現在貸出可能なゲームはありません";
        option.disabled = true;
        gameSelect.appendChild(option);
      }
    } catch (error) {
      console.error("ゲーム一覧の読み込みエラー:", error);
      alert("ゲーム一覧の読み込みに失敗しました。");
    }
  }
});
