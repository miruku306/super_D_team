# フロントエンド実装ガイド

HTML/CSS/JavaScript からバックエンド API を利用するためのガイドです。

## 目次

- [基本設定](#基本設定)
- [API エンドポイント一覧](#api-エンドポイント一覧)
- [実装例](#実装例)
- [エラーハンドリング](#エラーハンドリング)
- [認証について](#認証について)

---

## 基本設定

### API ベース URL

```javascript
// 本番環境（Cloudflare Workers デプロイ後）
const API_BASE = "https://your-worker.your-subdomain.workers.dev";

// ローカル開発時
const API_BASE = "http://localhost:8787";
```

### 共通の fetch ヘルパー関数

```javascript
// APIリクエスト用のヘルパー関数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "APIエラーが発生しました");
  }

  return data;
}

// GET リクエスト
async function get(endpoint) {
  return apiRequest(endpoint);
}

// POST リクエスト
async function post(endpoint, body) {
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// PUT リクエスト
async function put(endpoint, body) {
  return apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// DELETE リクエスト
async function del(endpoint) {
  return apiRequest(endpoint, {
    method: "DELETE",
  });
}
```

---

## API エンドポイント一覧

### Games（ゲーム）

| メソッド | エンドポイント              | 説明                       |
| -------- | --------------------------- | -------------------------- |
| GET      | `/api/games`                | 全ゲーム取得               |
| GET      | `/api/games/available`      | 在庫のあるゲーム取得       |
| GET      | `/api/games/search?q=xxx`   | ゲーム検索                 |
| GET      | `/api/games/players/:count` | プレイ人数でフィルタ       |
| GET      | `/api/games/:id`            | 特定のゲーム取得           |
| GET      | `/api/games/:id/reviews`    | ゲームをレビュー付きで取得 |
| GET      | `/api/games/:id/rating`     | ゲームの平均評価取得       |
| POST     | `/api/games`                | ゲーム追加                 |
| PUT      | `/api/games/:id`            | ゲーム更新                 |
| DELETE   | `/api/games/:id`            | ゲーム削除                 |

### Reservations（予約）

| メソッド | エンドポイント                              | 説明                           |
| -------- | ------------------------------------------- | ------------------------------ |
| GET      | `/api/reservations/stats`                   | 予約統計取得                   |
| GET      | `/api/reservations/current`                 | 現在予約中の全ゲーム（管理用） |
| GET      | `/api/reservations/user/:userId`            | ユーザーの予約履歴             |
| GET      | `/api/reservations/user/:userId/current`    | ユーザーの現在予約中           |
| GET      | `/api/reservations/guest?email=xxx`         | ゲストの予約履歴               |
| GET      | `/api/reservations/guest/current?email=xxx` | ゲストの現在予約中             |
| GET      | `/api/reservations/game/:gameId`            | ゲームの予約履歴               |
| GET      | `/api/reservations/check?gameId=x&userId=y` | 予約中かチェック               |
| GET      | `/api/reservations/:id`                     | 特定の予約情報取得             |
| GET      | `/api/reservations/:id/verify?email=xxx`    | 予約確認（ゲスト用）           |
| POST     | `/api/reservations`                         | ゲーム予約（認証ユーザー）     |
| POST     | `/api/reservations/guest`                   | ゲーム予約（ゲスト）           |
| POST     | `/api/reservations/:id/return`              | ゲーム返却                     |
| POST     | `/api/reservations/:id/cancel`              | 予約キャンセル                 |

### Reviews（レビュー）

| メソッド | エンドポイント                              | 説明                   |
| -------- | ------------------------------------------- | ---------------------- |
| GET      | `/api/reviews/recent?limit=10`              | 最新レビュー取得       |
| GET      | `/api/reviews/game/:gameId`                 | ゲームのレビュー取得   |
| GET      | `/api/reviews/game/:gameId/stats`           | ゲームの評価統計       |
| GET      | `/api/reviews/game/:gameId/top?minRating=4` | 高評価レビュー取得     |
| GET      | `/api/reviews/user/:userId`                 | ユーザーのレビュー取得 |
| GET      | `/api/reviews/check?gameId=x&userId=y`      | レビュー済みかチェック |
| GET      | `/api/reviews/:id`                          | 特定のレビュー取得     |
| POST     | `/api/reviews`                              | レビュー投稿           |
| PUT      | `/api/reviews/:id`                          | レビュー更新           |
| DELETE   | `/api/reviews/:id?userId=xxx`               | レビュー削除           |

---

## 実装例

### ゲーム一覧を取得して表示

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ボードゲーム一覧</title>
    <style>
      .game-card {
        border: 1px solid #ddd;
        padding: 16px;
        margin: 8px;
        border-radius: 8px;
      }
      .game-card h3 {
        margin: 0 0 8px 0;
      }
      .stock {
        color: green;
      }
      .out-of-stock {
        color: red;
      }
    </style>
  </head>
  <body>
    <h1>ボードゲーム一覧</h1>
    <div id="games-container"></div>

    <script>
      const API_BASE = "http://localhost:8787";

      async function fetchGames() {
        const response = await fetch(`${API_BASE}/api/games`);
        return response.json();
      }

      async function renderGames() {
        const games = await fetchGames();
        const container = document.getElementById("games-container");

        container.innerHTML = games
          .map(
            (game) => `
        <div class="game-card">
          <h3>${game.name}</h3>
          <p>${game.description || "説明なし"}</p>
          <p>プレイ人数: ${game.min_players}〜${game.max_players}人</p>
          <p class="${game.stock > 0 ? "stock" : "out-of-stock"}">
            在庫: ${game.stock}
          </p>
        </div>
      `
          )
          .join("");
      }

      renderGames();
    </script>
  </body>
</html>
```

### ゲーム検索機能

```html
<input type="text" id="search-input" placeholder="ゲーム名を検索..." />
<button onclick="searchGames()">検索</button>
<div id="search-results"></div>

<script>
  async function searchGames() {
    const query = document.getElementById("search-input").value;
    if (!query) return;

    const response = await fetch(
      `${API_BASE}/api/games/search?q=${encodeURIComponent(query)}`
    );
    const games = await response.json();

    const resultsDiv = document.getElementById("search-results");
    resultsDiv.innerHTML = games.length
      ? games.map((game) => `<div>${game.name}</div>`).join("")
      : "<p>ゲームが見つかりませんでした</p>";
  }
</script>
```

### ゲームを予約する（認証ユーザー）

```javascript
async function reserveGame(gameId, userId) {
  const response = await fetch(`${API_BASE}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gameId: gameId,
      userId: userId,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    alert(`予約失敗: ${result.error}`);
    return null;
  }

  alert("予約が完了しました！");
  return result;
}

// 使用例
// reserveGame(1, 'user-uuid-here');
```

### ゲームを予約する（ゲスト）

```javascript
async function reserveGameAsGuest(gameId, guestInfo) {
  const response = await fetch(`${API_BASE}/api/reservations/guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gameId: gameId,
      guestInfo: {
        name: guestInfo.name,
        email: guestInfo.email,
        phone: guestInfo.phone, // オプション
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    alert(`予約失敗: ${result.error}`);
    return null;
  }

  alert("予約が完了しました！予約ID: " + result.reservation_id);
  return result;
}

// 使用例
// reserveGameAsGuest(1, {
//   name: '田中太郎',
//   email: 'tanaka@example.com',
//   phone: '090-1234-5678'
// });
```

### ゲスト予約フォームの実装例

```html
<form id="guest-reservation-form">
  <h3>ゲスト予約</h3>

  <label>お名前:</label>
  <input type="text" id="guest-name" required />

  <label>メールアドレス:</label>
  <input type="email" id="guest-email" required />

  <label>電話番号（任意）:</label>
  <input type="tel" id="guest-phone" />

  <button type="submit">予約する</button>
</form>

<script>
  document
    .getElementById("guest-reservation-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const gameId = 1; // 予約したいゲームのID
      const guestInfo = {
        name: document.getElementById("guest-name").value,
        email: document.getElementById("guest-email").value,
        phone: document.getElementById("guest-phone").value || undefined,
      };

      const result = await reserveGameAsGuest(gameId, guestInfo);

      if (result) {
        // 予約IDを保存（確認用）
        localStorage.setItem("lastReservationId", result.reservation_id);
        localStorage.setItem("lastReservationEmail", guestInfo.email);
      }
    });
</script>
```

### ゲームを返却する

```javascript
async function returnGame(reservationId, userId) {
  const response = await fetch(
    `${API_BASE}/api/reservations/${reservationId}/return`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    alert(`返却失敗: ${result.error}`);
    return null;
  }

  alert("返却が完了しました！");
  return result;
}
```

### 予約をキャンセルする

```javascript
async function cancelReservation(reservationId, userId) {
  const response = await fetch(
    `${API_BASE}/api/reservations/${reservationId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    alert(`キャンセル失敗: ${result.error}`);
    return null;
  }

  alert("予約がキャンセルされました");
  return result;
}
```

### レビューを投稿する

```javascript
async function submitReview(gameId, userId, rating, comment) {
  const response = await fetch(`${API_BASE}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      game_id: gameId,
      user_id: userId,
      rating: rating, // 1〜5の整数
      comment: comment, // レビューコメント
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    alert(`レビュー投稿失敗: ${result.error}`);
    return null;
  }

  alert("レビューを投稿しました！");
  return result;
}
```

### レビューフォームの実装例

```html
<form id="review-form">
  <h3>レビューを投稿</h3>

  <label>評価:</label>
  <select id="rating" required>
    <option value="5">★★★★★ (5)</option>
    <option value="4">★★★★☆ (4)</option>
    <option value="3">★★★☆☆ (3)</option>
    <option value="2">★★☆☆☆ (2)</option>
    <option value="1">★☆☆☆☆ (1)</option>
  </select>

  <label>コメント:</label>
  <textarea id="comment" rows="4" required></textarea>

  <button type="submit">投稿</button>
</form>

<script>
  document
    .getElementById("review-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const gameId = 1; // 対象ゲームのID
      const userId = "current-user-id"; // ログイン中のユーザーID
      const rating = parseInt(document.getElementById("rating").value);
      const comment = document.getElementById("comment").value;

      await submitReview(gameId, userId, rating, comment);
    });
</script>
```

### ユーザーの予約一覧を表示

```javascript
async function showMyReservations(userId) {
  // 現在予約中のゲームを取得
  const response = await fetch(
    `${API_BASE}/api/reservations/user/${userId}/current`
  );
  const reservations = await response.json();

  const container = document.getElementById("my-reservations");

  if (reservations.length === 0) {
    container.innerHTML = "<p>現在予約中のゲームはありません</p>";
    return;
  }

  container.innerHTML = reservations
    .map(
      (r) => `
    <div class="reservation-card">
      <h4>${r.games?.name || "ゲーム名不明"}</h4>
      <p>予約日: ${new Date(r.reserved_at).toLocaleDateString("ja-JP")}</p>
      <button onclick="returnGame(${r.id}, '${userId}')">返却する</button>
      <button onclick="cancelReservation(${
        r.id
      }, '${userId}')">キャンセル</button>
    </div>
  `
    )
    .join("");
}
```

### ゲストの予約一覧を表示

```javascript
async function showGuestReservations(email) {
  // ゲストの現在予約中のゲームを取得
  const response = await fetch(
    `${API_BASE}/api/reservations/guest/current?email=${encodeURIComponent(
      email
    )}`
  );

  if (!response.ok) {
    alert("予約情報の取得に失敗しました");
    return;
  }

  const reservations = await response.json();
  const container = document.getElementById("guest-reservations");

  if (reservations.length === 0) {
    container.innerHTML = "<p>現在予約中のゲームはありません</p>";
    return;
  }

  container.innerHTML = reservations
    .map(
      (r) => `
    <div class="reservation-card">
      <h4>${r.games?.title || "ゲーム名不明"}</h4>
      <p>予約ID: ${r.id}</p>
      <p>予約日: ${new Date(r.reserved_at).toLocaleDateString("ja-JP")}</p>
      <p>予約者: ${r.guest_name}</p>
    </div>
  `
    )
    .join("");
}

// 使用例
// const email = prompt('メールアドレスを入力してください');
// if (email) showGuestReservations(email);
```

### 予約を確認する（ゲスト用）

```javascript
async function verifyGuestReservation(reservationId, email) {
  const response = await fetch(
    `${API_BASE}/api/reservations/${reservationId}/verify?email=${encodeURIComponent(
      email
    )}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      alert("予約が見つかりません。予約IDとメールアドレスを確認してください。");
    } else {
      alert("予約の確認に失敗しました");
    }
    return null;
  }

  const reservation = await response.json();

  // 予約情報を表示
  console.log("予約情報:", reservation);
  return reservation;
}

// 使用例：URLパラメータから予約IDとメールを取得
// const params = new URLSearchParams(window.location.search);
// const reservationId = params.get('id');
// const email = params.get('email');
// if (reservationId && email) {
//   verifyGuestReservation(reservationId, email);
// }
```

---

## エラーハンドリング

API からエラーが返された場合、以下の形式で返されます：

```json
{
  "error": "エラーメッセージ"
}
```

### エラーハンドリングの実装例

```javascript
async function safeApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    console.error("APIエラー:", error);

    // ユーザーに通知
    if (error.message) {
      alert(error.message);
    } else {
      alert("エラーが発生しました。もう一度お試しください。");
    }

    return null;
  }
}

// 使用例
const games = await safeApiCall(() =>
  fetch(`${API_BASE}/api/games`).then((r) => r.json())
);
```

### HTTP ステータスコード

| コード | 意味                   |
| ------ | ---------------------- |
| 200    | 成功                   |
| 201    | 作成成功（POST 時）    |
| 400    | リクエストエラー       |
| 404    | リソースが見つからない |
| 500    | サーバーエラー         |

---

## 認証について

現在の実装では認証は Supabase Auth を想定しています。
認証が必要な操作（予約、レビュー投稿など）では `userId` をリクエストに含める必要があります。

### 将来的な認証ヘッダーの追加

認証トークンが必要になった場合：

```javascript
async function authenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem("auth_token"); // または Supabase セッションから取得

  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
```

---

## CORS について

バックエンドは以下の CORS 設定が有効になっています：

- **許可オリジン**: すべて（`*`）
- **許可メソッド**: GET, POST, PUT, DELETE, OPTIONS
- **許可ヘッダー**: Content-Type, Authorization

そのため、任意のドメインからの API 呼び出しが可能です。

---

## ローカル開発

### バックエンドの起動

```bash
cd backend
npm install
npm run dev
```

サーバーが `http://localhost:8787` で起動します。

### 動作確認

```bash
# ヘルスチェック
curl http://localhost:8787/

# ゲーム一覧取得
curl http://localhost:8787/api/games

# ゲーム検索
curl "http://localhost:8787/api/games/search?q=カタン"
```

---

## 完全な HTML テンプレート

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ボードゲーム貸出システム</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        font-family: sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .game-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .game-card {
        border: 1px solid #ddd;
        padding: 16px;
        border-radius: 8px;
      }
      .game-card h3 {
        margin: 0 0 8px 0;
      }
      .stock {
        color: green;
        font-weight: bold;
      }
      .out-of-stock {
        color: red;
        font-weight: bold;
      }
      .search-box {
        margin-bottom: 20px;
      }
      .search-box input {
        padding: 8px;
        width: 300px;
      }
      .search-box button {
        padding: 8px 16px;
      }
      button {
        cursor: pointer;
        padding: 8px 16px;
        margin: 4px;
      }
      .btn-reserve {
        background: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
      }
      .btn-reserve:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    </style>
  </head>
  <body>
    <h1>ボードゲーム貸出システム</h1>

    <div class="search-box">
      <input type="text" id="search-input" placeholder="ゲーム名で検索..." />
      <button onclick="searchGames()">検索</button>
      <button onclick="loadAllGames()">全て表示</button>
    </div>

    <div id="games-container" class="game-grid"></div>

    <script>
      const API_BASE = "http://localhost:8787";
      const USER_ID = "demo-user-001"; // 実際はログイン情報から取得

      // ゲーム一覧を取得
      async function loadAllGames() {
        const response = await fetch(`${API_BASE}/api/games`);
        const games = await response.json();
        renderGames(games);
      }

      // ゲーム検索
      async function searchGames() {
        const query = document.getElementById("search-input").value;
        if (!query) {
          loadAllGames();
          return;
        }
        const response = await fetch(
          `${API_BASE}/api/games/search?q=${encodeURIComponent(query)}`
        );
        const games = await response.json();
        renderGames(games);
      }

      // ゲームを表示
      function renderGames(games) {
        const container = document.getElementById("games-container");

        if (games.length === 0) {
          container.innerHTML = "<p>ゲームが見つかりませんでした</p>";
          return;
        }

        container.innerHTML = games
          .map(
            (game) => `
        <div class="game-card">
          <h3>${escapeHtml(game.name)}</h3>
          <p>${escapeHtml(game.description || "説明なし")}</p>
          <p>プレイ人数: ${game.min_players}〜${game.max_players}人</p>
          <p class="${game.stock > 0 ? "stock" : "out-of-stock"}">
            在庫: ${game.stock}
          </p>
          <button
            class="btn-reserve"
            onclick="reserveGame(${game.id})"
            ${game.stock <= 0 ? "disabled" : ""}
          >
            ${game.stock > 0 ? "予約する" : "在庫なし"}
          </button>
        </div>
      `
          )
          .join("");
      }

      // ゲームを予約
      async function reserveGame(gameId) {
        if (!confirm("このゲームを予約しますか？")) return;

        try {
          const response = await fetch(`${API_BASE}/api/reservations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId, userId: USER_ID }),
          });

          const result = await response.json();

          if (!response.ok) {
            alert(`予約失敗: ${result.error}`);
            return;
          }

          alert("予約が完了しました！");
          loadAllGames(); // 在庫を更新
        } catch (error) {
          alert("エラーが発生しました");
          console.error(error);
        }
      }

      // XSS対策
      function escapeHtml(str) {
        if (!str) return "";
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      // 初期表示
      loadAllGames();
    </script>
  </body>
</html>
```
