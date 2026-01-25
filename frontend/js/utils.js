(() => {
  if (window.AppUtils) {
    return;
  }

  function getApiBaseUrl() {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    return isLocal
      ? "http://localhost:8787/api"
      : "https://super-d-team.mi-ma-2x9-28.workers.dev/api";
  }

  function saveToken(token) {
    localStorage.setItem("authToken", token);
  }

  function getToken() {
    return localStorage.getItem("authToken");
  }

  function clearToken() {
    localStorage.removeItem("authToken");
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.error || `HTTPエラー: ${response.status}`;
      throw new Error(message);
    }

    return data;
  }

  window.AppUtils = {
    getApiBaseUrl,
    saveToken,
    getToken,
    clearToken,
    fetchJson
  };
})();
