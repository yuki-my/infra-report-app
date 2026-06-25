/**
 * api.js
 * ------
 * バックエンド(/api/...)への通信をここに集約する。
 * 他のファイルは fetch を直接書かず、必ずこのモジュールの関数を経由する。
 * → 将来、エンドポイントが変わってもここだけ直せばよい。
 */

const BASE = "/api";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchReports({ category, status, search, reporter } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  if (reporter) params.set("reporter", reporter);
  const res = await fetch(`${BASE}/reports?${params.toString()}`, { credentials: "same-origin" });
  return handle(res);
}

export async function fetchStats({ reporter } = {}) {
  const params = new URLSearchParams();
  if (reporter) params.set("reporter", reporter);
  const res = await fetch(`${BASE}/stats?${params.toString()}`, { credentials: "same-origin" });
  return handle(res);
}

export async function createReport(payload) {
  const res = await fetch(`${BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function updateReportStatus(id, status, assignee) {
  const res = await fetch(`${BASE}/reports/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ status, assignee }),
  });
  return handle(res);
}

/* ----------------------------- 認証 ----------------------------- */

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  });
  return handle(res);
}

export async function logout() {
  const res = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "same-origin",
  });
  return handle(res);
}

export async function fetchMe() {
  const res = await fetch(`${BASE}/auth/me`, { credentials: "same-origin" });
  return handle(res); // ログインしていなければ null が返る
}
