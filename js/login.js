const {
  getApiBaseUrl,
  saveToken,
  getToken,
  clearToken,
  fetchJson
} = window.AppUtils;
const API_BASE_URL = getApiBaseUrl();

document.addEventListener("DOMContentLoaded", async () => {
  // ページ読み込み時に既にトークンがあれば管理画面へ
  const token = getToken();
  if (token) {
    try {
      await fetchJson(`${API_BASE_URL}/auth/verify-token`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      console.log("既に認証済み");
      window.location.href = "../administrator/index.html";
    } catch (error) {
      console.error("トークン検証エラー:", error);
      clearToken();
    }
  }

  // ログインフォームのイベントリスナー
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");
  const submitBtn = document.getElementById("submitBtn");
  const loading = document.getElementById("loading");

  errorMessage.style.display = "none";
  errorMessage.textContent = "";

  loading.style.display = "block";
  submitBtn.disabled = true;

  try {
    const data = await fetchJson(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    console.log("ログイン成功:", data.user.email);
    
    // トークンを保存
    if (data?.session?.access_token) {
      saveToken(data.session.access_token);
    }

    // 管理画面にリダイレクト
    window.location.href = "../administrator/index.html";
  } catch (error) {
    console.error("エラー:", error);
    errorMessage.textContent = error.message || "通信エラーが発生しました";
    errorMessage.style.display = "block";
    loading.style.display = "none";
    submitBtn.disabled = false;
  }
}
