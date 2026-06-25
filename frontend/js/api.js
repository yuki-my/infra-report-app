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

/* ----------------------------- 市民ログイン ----------------------------- */

export async function citizenSignup(username, password) {
  const res = await fetch(`${BASE}/auth/citizen/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  });
  return handle(res);
}

export async function citizenLogin(username, password) {
  const res = await fetch(`${BASE}/auth/citizen/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  });
  return handle(res);
}

export async function citizenLogout() {
  const res = await fetch(`${BASE}/auth/citizen/logout`, { method: "POST", credentials: "same-origin" });
  return handle(res);
}

/* ----------------------------- 管理者ログイン ----------------------------- */

export async function staffLogin(username, password) {
  const res = await fetch(`${BASE}/auth/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ username, password }),
  });
  return handle(res);
}

export async function staffLogout() {
  const res = await fetch(`${BASE}/auth/staff/logout`, { method: "POST", credentials: "same-origin" });
  return handle(res);
}

export async function fetchMe() {
  const res = await fetch(`${BASE}/auth/me`, { credentials: "same-origin" });
  return handle(res); // { citizen: {...}|null, staff: {...}|null }
}
