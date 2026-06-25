/**
 * main.js
 * -------
 * アプリ全体の起動と「画面の貼り替え」だけを担当する。
 * 各ビューの中身は views/*.js、データはすべて api.js 経由でSQLiteから取得する。
 */

import { renderIcon } from "./icons.js";
import { State, resetForm, roleLabel, visibleReports } from "./state.js";
import { fetchReports, fetchStats, createReport, updateReportStatus, login, logout, fetchMe } from "./api.js";
import { renderMapView, mountListMap, reportCardHtml } from "./views/mapView.js";
import { renderFormView, mountFormMap, nearestArea } from "./views/formView.js";
import { renderDashboardView } from "./views/dashboardView.js";
import { renderSheet } from "./views/sheet.js";
import { renderRoleSheet } from "./views/roleSheet.js";

const app = document.getElementById("app");

/* ----------------------------- データ取得 ----------------------------- */

async function loadReports() {
  const reporterFilter = State.role === "citizen" ? "あなた" : null;
  State.reports = await fetchReports({
    category: State.fCat,
    status: State.fStatus,
    search: State.search,
    reporter: reporterFilter,
  });
}

async function loadStats() {
  const reporterFilter = State.role === "citizen" ? "あなた" : null;
  State.stats = await fetchStats({ reporter: reporterFilter });
}

/* ----------------------------- 外枠（ヘッダー・タブバー）----------------------------- */

function renderShell() {
  app.innerHTML = `
    <div class="topbar">
      <div class="logo">
        <div class="mark">${renderIcon("pin", 16, "#fff")}</div>
        <div class="title">インフラ報告</div>
      </div>
      <div class="topbar-right">
        <button class="role-pill" id="roleToggle">${renderIcon("user", 13)} ${roleLabel()}</button>
        ${
          State.staffUser
            ? `<button class="icon-btn" id="quickLogout" title="ログアウト">${renderIcon("logout", 17)}</button>`
            : ""
        }
      </div>
    </div>
    <div class="content" id="content"></div>
    <div class="tabbar">
      <button class="tab-item ${State.view === "map" ? "active" : ""}" data-nav="map">${renderIcon("map", 19)}<span>マップ</span></button>
      <div class="tab-fab-wrap">
        <button class="tab-fab" id="fabReport">${renderIcon("plus", 24, "#fff")}</button>
        <span>報告する</span>
      </div>
      <button class="tab-item ${State.view === "dashboard" ? "active" : ""}" data-nav="dashboard">${renderIcon("grid", 19)}<span>ダッシュボード</span></button>
    </div>
    ${State.selectedId ? renderSheet() : ""}
    ${State.showRoleSheet ? renderRoleSheet() : ""}
    ${State.toast ? `<div class="toast">${renderIcon("check", 15)} ${State.toast}</div>` : ""}
  `;

  document.getElementById("roleToggle").onclick = () => {
    State.showRoleSheet = true;
    State.loginError = null;
    renderShell();
  };
  const quickLogout = document.getElementById("quickLogout");
  if (quickLogout) quickLogout.onclick = () => doLogout();

  document.getElementById("fabReport").onclick = () => {
    State.view = "form";
    resetForm();
    renderAll();
  };
  app.querySelectorAll("[data-nav]").forEach((b) => {
    b.onclick = async () => {
      State.view = b.dataset.nav;
      State.selectedId = null;
      await refreshAndRender();
    };
  });

  if (State.selectedId) wireSheet();
  if (State.showRoleSheet) wireRoleSheet();
}

function wireSheet() {
  document.getElementById("sheetClose").onclick = () => {
    State.selectedId = null;
    renderShell();
  };
  document.getElementById("sheetBackdrop").onclick = (e) => {
    if (e.target.id === "sheetBackdrop") {
      State.selectedId = null;
      renderShell();
    }
  };
  if (State.role === "staff") {
    app.querySelectorAll("[data-setstatus]").forEach((b) => {
      b.onclick = async () => {
        const updated = await updateReportStatus(State.selectedId, b.dataset.setstatus);
        const idx = State.reports.findIndex((r) => r.id === updated.id);
        if (idx >= 0) State.reports[idx] = updated;
        await loadStats();
        renderShell();
      };
    });
  }
}

function wireRoleSheet() {
  document.getElementById("roleSheetBackdrop").onclick = (e) => {
    if (e.target.id === "roleSheetBackdrop") {
      State.showRoleSheet = false;
      State.loginError = null;
      renderShell();
    }
  };

  app.querySelectorAll(".role-option").forEach((b) => {
    b.onclick = async () => {
      const role = b.dataset.role;
      // 「管理者」は実際にログイン済みでない限り切替できない
      if (role === "staff" && !State.staffUser) return;
      State.role = role;
      State.showRoleSheet = false;
      await refreshAndRender();
    };
  });

  const logoutBtn = document.getElementById("staffLogoutBtn");
  if (logoutBtn) logoutBtn.onclick = () => doLogout();

  const loginBtn = document.getElementById("staffLoginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => doLogin();
    // Enterキーでも送信できるようにする
    ["staffUsername", "staffPassword"].forEach((id) => {
      const el = document.getElementById(id);
      el.onkeydown = (e) => {
        if (e.key === "Enter") doLogin();
      };
    });
  }
}

async function doLogin() {
  const username = document.getElementById("staffUsername").value.trim();
  const password = document.getElementById("staffPassword").value;
  if (!username || !password) {
    State.loginError = "ユーザー名とパスワードを入力してください";
    renderShell();
    return;
  }
  try {
    const user = await login(username, password);
    State.staffUser = user;
    State.role = "staff";
    State.showRoleSheet = false;
    State.loginError = null;
    await refreshAndRender();
    showToast(`ログインしました（${user.municipality} ${user.displayName}）`);
  } catch (err) {
    State.loginError = err.message;
    renderShell();
  }
}

async function doLogout() {
  await logout();
  State.staffUser = null;
  State.role = "citizen";
  State.showRoleSheet = false;
  await refreshAndRender();
  showToast("ログアウトしました");
}

/* ----------------------------- ビューの貼り替え ----------------------------- */

function renderAll() {
  renderShell();
  const c = document.getElementById("content");
  if (State.view === "map") c.innerHTML = renderMapView();
  else if (State.view === "form") c.innerHTML = renderFormView();
  else if (State.view === "dashboard") c.innerHTML = renderDashboardView();
  afterRender();
}

async function refreshAndRender() {
  await Promise.all([loadReports(), loadStats()]);
  renderAll();
}

/* ----------------------------- イベント結線（DOM生成後）----------------------------- */

function afterRender() {
  if (State.view === "map") {
    document.getElementById("goReport").onclick = () => {
      State.view = "form";
      resetForm();
      renderAll();
    };
    document.getElementById("searchInput").oninput = (e) => {
      State.search = e.target.value;
      debounceSearch();
    };
    document.getElementById("catFilter").onchange = async (e) => {
      State.fCat = e.target.value;
      await refreshAndRender();
    };
    document.getElementById("statusFilter").onchange = async (e) => {
      State.fStatus = e.target.value;
      await refreshAndRender();
    };
    document.querySelectorAll("[data-mode]").forEach((b) => {
      b.onclick = () => {
        State.mapMode = b.dataset.mode;
        renderAll();
      };
    });
    wireOpenButtons();
    if (State.mapMode === "map") mountListMap(openReport);
  }
  if (State.view === "form") wireForm();
  if (State.view === "dashboard") wireOpenButtons();
}

let searchTimer = null;
function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(refreshAndRender, 300);
}

function wireOpenButtons() {
  document.querySelectorAll("[data-open]").forEach((b) => {
    b.onclick = () => openReport(b.dataset.open);
  });
}

function openReport(id) {
  State.selectedId = id;
  renderShell();
}

function wireForm() {
  document.getElementById("formBack").onclick = () => {
    State.view = "map";
    renderAll();
  };
  document.getElementById("photoInput").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      State.form.photoData = reader.result;
      renderAll();
    };
    reader.readAsDataURL(file);
  };
  document.getElementById("photoBox").onclick = () => document.getElementById("photoInput").click();

  document.getElementById("locateBtn").onclick = () => {
    const btn = document.getElementById("locateBtn");
    btn.innerHTML = renderIcon("crosshair", 15) + " 取得中...";
    if (!navigator.geolocation) {
      btn.innerHTML = renderIcon("crosshair", 15) + " 現在地を取得";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        State.form.lat = pos.coords.latitude;
        State.form.lng = pos.coords.longitude;
        if (State.leaflet.form) {
          State.leaflet.form.setView([State.form.lat, State.form.lng], 16);
          State.leaflet.formMarker.setLatLng([State.form.lat, State.form.lng]);
        }
        btn.innerHTML = renderIcon("crosshair", 15) + " 現在地を取得";
      },
      () => {
        btn.innerHTML = renderIcon("crosshair", 15) + " 取得できませんでした";
        setTimeout(() => {
          btn.innerHTML = renderIcon("crosshair", 15) + " 現在地を取得";
        }, 2000);
      },
      { timeout: 6000 }
    );
  };

  document.getElementById("addressNote").oninput = (e) => (State.form.addressNote = e.target.value);
  document.getElementById("catSelect").onchange = (e) => (State.form.category = e.target.value);
  document.getElementById("partSelect").onchange = (e) => (State.form.part = e.target.value);
  document.getElementById("titleInput").oninput = (e) => (State.form.title = e.target.value);
  document.getElementById("commentInput").oninput = (e) => (State.form.comment = e.target.value);

  document.getElementById("submitBtn").onclick = async () => {
    const f = State.form;
    if (!f.category || !f.part) {
      showToast("カテゴリと部位を選択してください");
      return;
    }
    await createReport({
      lat: f.lat,
      lng: f.lng,
      category: f.category,
      part: f.part,
      title: f.title,
      address: nearestArea(f.lat),
      addressNote: f.addressNote,
      comment: f.comment,
      photo: f.photoData,
      reporter: "あなた",
    });
    State.view = "map";
    State.mapMode = "list";
    await refreshAndRender();
    showToast("報告を送信しました。受付状態として登録されました。");
  };

  mountFormMap();
}

function showToast(msg) {
  State.toast = msg;
  renderShell();
  setTimeout(() => {
    State.toast = null;
    renderShell();
  }, 3000);
}

/* ----------------------------- 起動 ----------------------------- */

(async function init() {
  try {
    const me = await fetchMe();
    if (me) {
      State.staffUser = me;
      State.role = "staff";
    }
  } catch (e) {
    // ログイン状態の取得に失敗してもアプリ自体は起動させる
    console.warn("fetchMe failed", e);
  }
  await refreshAndRender();
})();
