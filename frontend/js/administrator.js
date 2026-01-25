// API エンドポイント
const API_BASE_URL = (() => {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  return isLocal
    ? "http://localhost:8787/api"
    : "https://super-d-team.mi-ma-2x9-28.workers.dev/api";
})();

// ローカルストレージにトークンを保存
function saveToken(token) {
  localStorage.setItem("authToken", token);
}

function getToken() {
  return localStorage.getItem("authToken");
}

function clearToken() {
  localStorage.removeItem("authToken");
}

const tableBody = document.getElementById("gameTableBody");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

const gameId = document.getElementById("gameId");
const title = document.getElementById("title");
const description = document.getElementById("description");
const playerMin = document.getElementById("playerMin");
const playerMax = document.getElementById("playerMax");
const playTime = document.getElementById("playTime");
const genre = document.getElementById("genre");
const stock = document.getElementById("stock");
const imageFile = document.getElementById("imageFile");


let editMode = false;
let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // トークンをチェック
  const token = getToken();
  
  if (!token) {
    alert("ログインが必要です");
    window.location.href = "../login/index.html";
    return;
  }

  // トークンの有効性を確認
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.valid) {
      clearToken();
      alert("認証が無効です。再度ログインしてください");
      window.location.href = "../login/index.html";
      return;
    }

    console.log("認証済み:", data.user.email);
  } catch (error) {
    console.error("トークン検証エラー:", error);
    clearToken();
    alert("認証チェックに失敗しました");
    window.location.href = "../login/index.html";
    return;
  }

  loadGames();
});

/* =====================
   モーダル開閉処理
===================== */
function openAddModal() {
  editMode = false;
  modalTitle.textContent = "ボードゲーム追加";
  gameId.value = "";
  title.value = "";
  description.value = "";
  playerMin.value = "";
  playerMax.value = "";
  playTime.value = "";
  genre.value = "";
  stock.value = "";
  imageFile.value = "";
  modalMessage.textContent = "";
  modal.classList.remove("hidden");
}

function openEditModal(event, id) {
  if (event) event.stopPropagation();
  editMode = true;
  editingId = id;
  modalTitle.textContent = "ボードゲーム編集";
  modalMessage.textContent = "";
  modal.classList.remove("hidden");
  
  // 既存データを取得して入力欄に設定
  fetch(`${API_BASE_URL}/games/${id}`)
    .then(res => res.json())
    .then(game => {
      gameId.value = game.id;
      title.value = game.title;
      description.value = game.description || "";
      playerMin.value = game.player_min || "";
      playerMax.value = game.player_max || "";
      playTime.value = game.play_time || "";
      genre.value = game.genre || "";
      stock.value = game.stock;
      imageFile.value = "";
    })
    .catch(error => {
      modalMessage.textContent = "ゲーム情報の取得に失敗しました";
      console.error(error);
    });
}

function closeModal() {
  modal.classList.add("hidden");
  editMode = false;
  editingId = null;
}

let expandedGameId = null;

/* =====================
   一覧取得
===================== */
async function loadGames() {
  const res = await fetch(`${API_BASE_URL}/games`);
  const games = await res.json();

  tableBody.innerHTML = "";

  games.forEach(game => {
    // メイン行
    const tr = document.createElement("tr");
    tr.className = "game-row";
    tr.innerHTML = `
      <td>${game.id}</td>
      <td>${game.title}</td>
      <td>${game.stock}</td>
      <td>
        <button onclick="openEditModal(event, ${game.id})">編集</button>
        <button onclick="deleteGame(event, ${game.id})">削除</button>
      </td>
    `;
    tr.style.cursor = "pointer";
    tr.onclick = () => toggleReservations(game.id);
    tableBody.appendChild(tr);

    // 予約情報行（最初は非表示）
    const reservationRow = document.createElement("tr");
    reservationRow.className = "reservation-row hidden";
    reservationRow.id = `reservation-${game.id}`;
    reservationRow.innerHTML = `
      <td colspan="4">
        <div class="reservation-section">
          <div class="reservation-label">📋 予約状況</div>
          <div id="reservations-${game.id}" class="reservations-list"></div>
        </div>
      </td>
    `;
    tableBody.appendChild(reservationRow);
  });
}

async function toggleReservations(gameId) {
  const reservationRow = document.getElementById(`reservation-${gameId}`);
  const reservationsList = document.getElementById(`reservations-${gameId}`);

  if (expandedGameId === gameId) {
    // 既に展開されている場合は閉じる
    reservationRow.classList.add("hidden");
    expandedGameId = null;
  } else {
    // 他の行が展開されていれば閉じる
    if (expandedGameId !== null) {
      const prevRow = document.getElementById(`reservation-${expandedGameId}`);
      if (prevRow) prevRow.classList.add("hidden");
    }

    // 新しい行を展開
    expandedGameId = gameId;
    reservationRow.classList.remove("hidden");
    reservationsList.innerHTML = "<p>読み込み中...</p>";

    try {
      // 予約情報を取得（/game/:gameId エンドポイントを使用）
      const response = await fetch(`${API_BASE_URL}/reservations/game/${gameId}`);
      
      if (!response.ok) {
        throw new Error(`HTTPエラー: ${response.status}`);
      }
      
      const reservations = await response.json();

      if (!Array.isArray(reservations) || reservations.length === 0) {
        reservationsList.innerHTML = "<p class='no-reservations'>予約がありません</p>";
        return;
      }

      let html = "";
      reservations.forEach(res => {
        const startDate = new Date(res.reserved_at).toLocaleDateString("ja-JP");
        const returnedDate = res.returned_at ? new Date(res.returned_at).toLocaleDateString("ja-JP") : "返却待ち";
        
        html += `
          <div class="reservation-card">
            <div class="reservation-info">
              <p><strong>ゲスト名:</strong> ${res.guest_name || "未設定"}</p>
              <p><strong>メール:</strong> ${res.guest_email || "未設定"}</p>
              <p><strong>電話:</strong> ${res.guest_phone || "未設定"}</p>
              <p><strong>貸出日:</strong> ${startDate}</p>
              <p><strong>返却日:</strong> ${returnedDate}</p>
              <p><strong>人数:</strong> ${res.players || "未設定"}</p>
              <p><strong>注釈:</strong> ${res.notes || "なし"}</p>
              <p><strong>ステータス:</strong> ${res.status || "予約中"}</p>
            </div>
          </div>
        `;
      });
      reservationsList.innerHTML = html;
    } catch (error) {
      console.error("予約情報の取得に失敗しました:", error);
      reservationsList.innerHTML = "<p class='error'>予約情報の取得に失敗しました</p>";
    }
  }
}


async function saveGame() {
  const token = getToken();
  if (!token) {
    modalMessage.textContent = "認証が必要です";
    return;
  }

  const formData = new FormData();

  // 編集の場合は id フィールドを送らない（URLパラメータで指定）
  formData.append("title", title.value);
  formData.append("description", description.value);
  formData.append("player_min", playerMin.value);
  formData.append("player_max", playerMax.value);
  formData.append("play_time", playTime.value);
  formData.append("genre", genre.value);
  formData.append("stock", stock.value);

  if (imageFile.files[0]) {
    formData.append("image", imageFile.files[0]);
  }

  let res;
  try {
    const headers = {
      "Authorization": `Bearer ${token}`
    };

    if (editMode) {
      res = await fetch(`${API_BASE_URL}/games/${editingId}`, {
        method: "PUT",
        body: formData,
        headers: headers
      });
    } else {
      // 新規追加の場合のみ id を追加
      formData.append("id", gameId.value);
      res = await fetch(`${API_BASE_URL}/games`, {
        method: "POST",
        body: formData,
        headers: headers
      });
    }

    const responseData = await res.json();
    
    if (!res.ok) {
      console.error("APIエラー:", responseData);
      modalMessage.textContent = responseData.error || "保存に失敗しました";
      return;
    }

    closeModal();
    loadGames();
  } catch (error) {
    console.error("エラー:", error);
    modalMessage.textContent = error instanceof Error ? error.message : "通信エラーが発生しました";
  }
}


async function deleteGame(event, id) {
  if (event) event.stopPropagation();
  if (!confirm("削除しますか？")) return;

  const token = getToken();
  if (!token) {
    alert("認証が必要です");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || "削除に失敗しました");
      return;
    }

    loadGames();
  } catch (error) {
    console.error("削除エラー:", error);
    alert("削除処理でエラーが発生しました");
  }
}

/* =====================
   ログアウト
===================== */
async function logout() {
  if (!confirm("ログアウトしますか？")) return;

  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  }

  clearToken();
  window.location.href = "../login/index.html";
}
