const API_BASE_URL = (() => {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  return isLocal
    ? "http://localhost:8787/api"
    : "https://super-d-team.mi-ma-2x9-28.workers.dev/api";
})();

// 状態管理
let allGames = [];
let filteredGames = [];
let currentFilters = {
  playerCounts: ["all"], // "all" | number | "5plus"
  playTime: ["all"],
  genres: [],
};

// ページ読み込み時の初期化
document.addEventListener("DOMContentLoaded", () => {
  initializeFilters();
  loadGames();
});

/**
 * ゲーム一覧を読み込む
 */
async function loadGames() {
  const gameGrid = document.querySelector(".game-grid");
  if (!gameGrid) {
    console.error("ゲームグリッドが見つかりません");
    return;
  }

  try {
    showLoading(gameGrid);

    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) {
      throw new Error("ゲーム一覧の取得に失敗しました");
    }

    allGames = await response.json();
    filteredGames = [...allGames];

    renderGames(filteredGames);
  } catch (error) {
    console.error("ゲーム読み込みエラー:", error);
    showError(gameGrid, "ゲーム情報の読み込みに失敗しました。");
  }
}

/**
 * ゲームカードを描画
 */
function renderGames(games) {
  const gameGrid = document.querySelector(".game-grid");
  if (!gameGrid) {
    return;
  }

  // グリッドをクリア
  gameGrid.innerHTML = "";

  if (games.length === 0) {
    gameGrid.innerHTML = `
      <div class="no-games">
        <p>条件に一致するゲームが見つかりませんでした。</p>
      </div>
    `;
    return;
  }

  // 各ゲームのカードを作成
  games.forEach((game) => {
    const gameCard = createGameCard(game);
    gameGrid.appendChild(gameCard);
  });
}

/**
 * ゲームカードを作成
 */
function createGameCard(game) {
  const card = document.createElement("div");
  card.className = "game-card";
  card.dataset.gameId = game.id;

  // 在庫状況のクラスとテキスト
  const availabilityClass = game.stock > 0 ? "available" : "in-use";
  const availabilityText =
    game.stock > 0 ? `貸出可: ${game.stock}個` : "貸出中";

  // 画像の有無を確認
  const hasImage = game.image_url && game.image_url.trim() !== "";

  // 画像部分のHTML
  let imageHTML;
  if (hasImage) {
    imageHTML = `<img src="${game.image_url}" alt="${game.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'game-image-placeholder\\'><div class=\\'text\\'>No Image</div></div>';" />`;
  } else {
    imageHTML = `<div class="game-image-placeholder"><div class="icon">🎲</div><div class="text">No Image</div></div>`;
  }

  card.innerHTML = `
    <div class="game-image">
      ${imageHTML}
    </div>
    <div class="game-info">
      <h3 class="game-title">${game.title}</h3>
      <p class="game-description">
        ${game.description || "説明はありません"}
      </p>
      <div class="game-meta">
        <span>👥 ${game.player_min}-${game.player_max}人</span>
        <span>⏱️ ${game.play_time}分</span>
        <span>🎯 ${game.genre || "その他"}</span>
      </div>
      <span class="availability ${availabilityClass}">${availabilityText}</span>
    </div>
  `;

  // クリックイベントを追加
  card.addEventListener("click", () => {
    openGameModal(game.id);
  });

  return card;
}

/**
 * フィルターの初期化
 */
function initializeFilters() {
  // プレイ人数（チップ）
  const playerChips = document.querySelectorAll(
    "#player-count-filter .player-chip"
  );
  if (playerChips.length > 0) {
    playerChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const value = chip.dataset.player;
        if (!value) return;

        // 「全て」は排他的に扱う
        if (value === "all") {
          setOnlyAllPlayerChipSelected(playerChips);
          currentFilters.playerCounts = ["all"];
          applyFilters();
          return;
        }

        // 個別チップのトグル
        toggleChipActive(chip);

        // 「全て」をOFF（個別が1つでも選ばれたら）
        const allChip = document.querySelector(
          '#player-count-filter .player-chip[data-player="all"]'
        );
        if (allChip) {
          setChipActive(allChip, false);
        }

        // 個別が0件になったら「全て」に戻す
        const selected = getSelectedPlayerChipValues(playerChips);
        if (selected.length === 0) {
          setOnlyAllPlayerChipSelected(playerChips);
          currentFilters.playerCounts = ["all"];
        } else {
          currentFilters.playerCounts = selected;
        }

        applyFilters();
      });
    });
  }

  // プレイ時間チェックボックス
  const playTimeCheckboxes = document.querySelectorAll(
    '#play-time-filter input[type="checkbox"]'
  );
  playTimeCheckboxes.forEach((checkbox, index) => {
    checkbox.addEventListener("change", () => {
      // 「全て」が選択された場合
      if (index === 0) {
        if (checkbox.checked) {
          // 「全て」をチェック → 他を全て外す
          playTimeCheckboxes.forEach((cb, i) => {
            if (i !== 0) cb.checked = false;
          });
          currentFilters.playTime = ["all"];
        } else {
          // 「全て」のチェックを外そうとした場合は外させない
          checkbox.checked = true;
          return;
        }
      } else {
        // 他のチェックボックスが操作された場合
        // 「全て」を外す
        playTimeCheckboxes[0].checked = false;
        updatePlayTimeFilter();
      }

      applyFilters();
    });
  });

  // ジャンルチェックボックス
  const genreCheckboxes = document.querySelectorAll(
    '#genre-filter input[type="checkbox"]'
  );
  genreCheckboxes.forEach((checkbox, index) => {
    checkbox.addEventListener("change", () => {
      // 「全て」が選択された場合
      if (index === 0 && checkbox.checked) {
        genreCheckboxes.forEach((cb, i) => {
          if (i !== 0) cb.checked = false;
        });
        currentFilters.genres = [];
      } else if (checkbox.checked) {
        // 他のチェックボックスが選択された場合、「全て」を外す
        genreCheckboxes[0].checked = false;
        updateGenreFilter();
      } else {
        updateGenreFilter();
      }
      applyFilters();
    });
  });
}

/**
 * チップのON/OFF状態制御
 */
function setChipActive(chip, active) {
  chip.classList.toggle("is-active", active);
  chip.setAttribute("aria-pressed", active ? "true" : "false");
}

function toggleChipActive(chip) {
  const active = chip.getAttribute("aria-pressed") === "true";
  setChipActive(chip, !active);
}

function setOnlyAllPlayerChipSelected(playerChips) {
  playerChips.forEach((chip) => {
    const value = chip.dataset.player;
    setChipActive(chip, value === "all");
  });
}

function getSelectedPlayerChipValues(playerChips) {
  return Array.from(playerChips)
    .filter((chip) => chip.dataset.player !== "all")
    .filter((chip) => chip.getAttribute("aria-pressed") === "true")
    .map((chip) => chip.dataset.player)
    .filter(Boolean)
    .map((v) => (v === "5plus" ? "5plus" : parseInt(v, 10)))
    .filter((v) => v === "5plus" || Number.isFinite(v));
}

/**
 * プレイ時間フィルターを更新
 */
function updatePlayTimeFilter() {
  const playTimeCheckboxes = document.querySelectorAll(
    '#play-time-filter input[type="checkbox"]'
  );

  const checkedValues = Array.from(playTimeCheckboxes)
    .slice(1) // 「全て」を除外
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // チェックされているボックスがあればそれを設定、なければ「全て」に戻す
  if (checkedValues.length === 0) {
    currentFilters.playTime = ["all"];
    playTimeCheckboxes[0].checked = true;
  } else {
    currentFilters.playTime = checkedValues;
  }
}

/**
 * ジャンルフィルターを更新
 */
function updateGenreFilter() {
  const genreCheckboxes = document.querySelectorAll(
    '#genre-filter input[type="checkbox"]'
  );
  currentFilters.genres = Array.from(genreCheckboxes)
    .slice(1) // 「全て」を除外
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  if (currentFilters.genres.length === 0) {
    genreCheckboxes[0].checked = true;
  }
}

/**
 * フィルターを適用
 */
function applyFilters() {
  filteredGames = allGames.filter((game) => {
    // プレイ人数フィルター
    if (!currentFilters.playerCounts.includes("all")) {
      const min = parseInt(game.player_min, 10);
      const max = parseInt(game.player_max, 10);

      // データ欠損時は人数フィルターしない（他条件は適用）
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return true;
      }

      const matchesAny = currentFilters.playerCounts.some((selected) => {
        if (selected === "5plus") {
          return max >= 5;
        }
        return min <= selected && max >= selected;
      });

      if (!matchesAny) {
        return false;
      }
    }

    // プレイ時間フィルター
    if (!currentFilters.playTime.includes("all")) {
      const playTime = game.play_time;

      // play_timeがnullまたはundefinedの場合はフィルタリングしない
      if (!playTime) {
        return true;
      }

      let matchesTime = false;

      currentFilters.playTime.forEach((timeValue) => {
        if (timeValue === "lt30" && playTime <= 30) {
          matchesTime = true;
        }
        if (timeValue === "30to60" && playTime > 30 && playTime < 60) {
          matchesTime = true;
        }
        if (timeValue === "gte60" && playTime >= 60) {
          matchesTime = true;
        }
      });

      if (!matchesTime) {
        return false;
      }
    }

    // ジャンルフィルター
    if (currentFilters.genres.length > 0) {
      if (!currentFilters.genres.includes(game.genre)) {
        return false;
      }
    }

    return true;
  });

  renderGames(filteredGames);
}

/**
 * ローディング表示
 */
function showLoading(container) {
  container.innerHTML = `
    <div class="loading">
      <p>読み込み中...</p>
    </div>
  `;
}

/**
 * エラー表示
 */
function showError(container, message) {
  container.innerHTML = `
    <div class="error">
      <p>${message}</p>
      <button onclick="loadGames()">再読み込み</button>
    </div>
  `;
}

/**
 * モーダルを開く
 */
async function openGameModal(gameId) {
  const modal = document.getElementById("game-modal");
  const modalBody = modal.querySelector(".modal-body");

  if (!modal || !modalBody) {
    console.error("モーダル要素が見つかりません");
    return;
  }

  // モーダルを表示
  modal.classList.add("show");
  modalBody.innerHTML = '<div class="modal-loading">読み込み中...</div>';

  try {
    // ゲーム詳細とレビューを並行して取得
    const [gameResponse, reviewsResponse, statsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/games/${gameId}`),
      fetch(`${API_BASE_URL}/reviews/game/${gameId}`),
      fetch(`${API_BASE_URL}/reviews/game/${gameId}/stats`),
    ]);

    if (!gameResponse.ok) {
      throw new Error("ゲーム情報の取得に失敗しました");
    }

    const game = await gameResponse.json();
    const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];
    const stats = statsResponse.ok ? await statsResponse.json() : null;

    // モーダルの内容を描画
    renderModalContent(modalBody, game, reviews, stats);
  } catch (error) {
    console.error("モーダルデータ取得エラー:", error);
    modalBody.innerHTML = `
      <div class="modal-error">
        <p>データの読み込みに失敗しました</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * モーダルの内容を描画
 */
function renderModalContent(container, game, reviews, stats) {
  // 画像の有無を確認
  const hasImage = game.image_url && game.image_url.trim() !== "";

  // 画像部分のHTML
  let imageHTML;
  if (hasImage) {
    imageHTML = `<img src="${game.image_url}" alt="${game.title}" />`;
  } else {
    imageHTML = `
      <div class="modal-game-image-placeholder">
        <div class="icon">🎲</div>
        <div class="text">No Image</div>
      </div>
    `;
  }

  // 在庫状況
  const availabilityClass = game.stock > 0 ? "available" : "in-use";
  const availabilityText =
    game.stock > 0 ? `貸出可: ${game.stock}個` : "貸出中";

  // 評価統計
  let ratingHTML = "";
  if (stats && stats.count > 0) {
    const stars = "★".repeat(Math.round(stats.average)) + "☆".repeat(5 - Math.round(stats.average));
    ratingHTML = `
      <div class="modal-rating-summary">
        <h3>評価</h3>
        <div class="modal-rating-stats">
          <div class="modal-rating-average">${stats.average.toFixed(1)}</div>
          <div>
            <div class="modal-rating-stars">${stars}</div>
            <div class="modal-rating-count">${stats.count}件のレビュー</div>
          </div>
        </div>
      </div>
    `;
  }

  // レビュー一覧
  let reviewsHTML = "";
  if (reviews && reviews.length > 0) {
    reviewsHTML = `
      <div class="modal-reviews-section">
        <h3>レビュー</h3>
        ${reviews
          .map((review) => {
            const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
            const authorName = review.guest_name || "匿名";
            const date = new Date(review.created_at).toLocaleDateString("ja-JP");
            return `
              <div class="modal-review-item">
                <div class="modal-review-header">
                  <div>
                    <div class="modal-review-author">${authorName}</div>
                    <div class="modal-review-date">${date}</div>
                  </div>
                  <div class="modal-review-rating">${stars}</div>
                </div>
                ${review.comment ? `<div class="modal-review-comment">${review.comment}</div>` : ""}
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  } else {
    reviewsHTML = `
      <div class="modal-reviews-section">
        <h3>レビュー</h3>
        <div class="modal-no-reviews">まだレビューがありません</div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="modal-game-header">
      <div class="modal-game-image">
        ${imageHTML}
      </div>
      <div class="modal-game-info">
        <h2 class="modal-game-title">${game.title}</h2>
        <p class="modal-game-description">${game.description || "説明はありません"}</p>
        <div class="modal-game-meta">
          <div class="modal-game-meta-item">
            <span>👥</span>
            <span><strong>プレイ人数:</strong> ${game.player_min}-${game.player_max}人</span>
          </div>
          <div class="modal-game-meta-item">
            <span>⏱️</span>
            <span><strong>プレイ時間:</strong> ${game.play_time}分</span>
          </div>
          <div class="modal-game-meta-item">
            <span>🎯</span>
            <span><strong>ジャンル:</strong> ${game.genre || "その他"}</span>
          </div>
        </div>
        <div style="margin-top: 15px;">
          <span class="availability ${availabilityClass}">${availabilityText}</span>
        </div>
      </div>
    </div>
    ${ratingHTML}
    ${reviewsHTML}
  `;
}

/**
 * モーダルを閉じる
 */
function closeGameModal() {
  const modal = document.getElementById("game-modal");
  if (modal) {
    modal.classList.remove("show");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("game-modal");
  const closeBtn = modal?.querySelector(".modal-close");

  // 閉じるボタン
  if (closeBtn) {
    closeBtn.addEventListener("click", closeGameModal);
  }

  // モーダル外をクリックで閉じる
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeGameModal();
      }
    });
  }

  // ESCキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeGameModal();
    }
  });
});
