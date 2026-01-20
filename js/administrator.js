const API_BASE_URL = "http://localhost:8787/api";

const tableBody = document.getElementById("gameTableBody");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

const gameId = document.getElementById("gameId");
const title = document.getElementById("title");
const description = document.getElementById("description");
const playerMin = document.getElementById("playerMin");
const playerMax = document.getElementById("playerMax");
const stock = document.getElementById("stock");
const imageFile = document.getElementById("imageFile");


let editMode = false;
let editingId = null;

document.addEventListener("DOMContentLoaded", loadGames);

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
  stock.value = "";
  imageFile.value = "";
  modalMessage.textContent = "";
  modal.classList.remove("hidden");
}

function openEditModal(id) {
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
        <button onclick="openEditModal(${game.id})">編集</button>
        <button onclick="deleteGame(${game.id})">削除</button>
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
  const formData = new FormData();

  // 編集の場合は id フィールドを送らない（URLパラメータで指定）
  formData.append("title", title.value);
  formData.append("description", description.value);
  formData.append("player_min", playerMin.value);
  formData.append("player_max", playerMax.value);
  formData.append("stock", stock.value);

  if (imageFile.files[0]) {
    formData.append("image", imageFile.files[0]);
  }

  let res;
  try {
    if (editMode) {
      res = await fetch(`${API_BASE_URL}/games/${editingId}`, {
        method: "PUT",
        body: formData
      });
    } else {
      // 新規追加の場合のみ id を追加
      formData.append("id", gameId.value);
      res = await fetch(`${API_BASE_URL}/games`, {
        method: "POST",
        body: formData
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


async function deleteGame(id) {
  if (!confirm("削除しますか？")) return;

  await fetch(`${API_BASE_URL}/games/${id}`, {
    method: "DELETE"
  });

  loadGames();
}

/* =====================
   ログアウト
===================== */
function logout() {
  if (confirm("ログアウトしますか？")) {
    // ログアウト処理を実装
    window.location.href = "../../pages/home/index.html";
  }
}


