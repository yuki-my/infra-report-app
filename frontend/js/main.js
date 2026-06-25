/**
 * main.js
 * -------
 * アプリ全体の起動と「画面の貼り替え」だけを担当する。
 * 各ビューの中身は views/*.js、データはすべて api.js 経由でSQLiteから取得する。
 */

import { renderIcon } from "./icons.js";
import { State, resetForm, roleLabel, visibleReports } from "./state.js";
import {
  fetchReports,
  fetchStats,
  createReport,
  updateReportStatus,
  citizenSignup,
  citizenLogin,
  citizenLogout,
  staffLogin,
  staffLogout,
  fetchMe,
} from "./api.js";
import { renderMapView, mountListMap, reportCardHtml } from "./views/mapView.js";
import { renderFormView, mountFormMap, nearestArea } from "./views/formView.js";
import { renderDashboardView } from "./views/dashboardView.js";
import { renderSheet } from "./views/sheet.js";
import { renderRoleSheet } from "./views/roleSheet.js";

const app = document.getElementById("app");

/* ----------------------------- データ取得 ----------------------------- */

async function loadReports() {
  const reporterFilter = State.onlyMine && State.citizenUser ? State.citizenUser.username : null;
  State.reports = await fetchReports({
    category: State.fCat,
    status: State.fStatus,
    search: State.search,
    reporter: reporterFilter,
  });
}

async function loadStats() {
  const reporterFilter = State.onlyMine && State.citizenUser ? State.citizenUser.username : null;
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
          State.staffUser || State.citizenUser
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
  if (quickLogout) {
    quickLogout.onclick = () => {
      if (State.role === "staff") doStaffLogout();
      else doCitizenLogout();
    };
  }

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
    if (b.disabled) return;
    b.onclick = async () => {
      State.role = b.dataset.role;
      State.showRoleSheet = false;
      await refreshAndRender();
    };
  });

  // 市民: ログイン/新規登録タブの切替
  app.querySelectorAll("[data-authtab]").forEach((b) => {
    b.onclick = () => {
      State.authTab = b.dataset.authtab;
      State.loginError = null;
      renderShell();
    };
  });

  const citizenAuthBtn = document.getElementById("citizenAuthBtn");
  if (citizenAuthBtn) {
    citizenAuthBtn.onclick = () => doCitizenAuth();
    ["citizenUsername", "citizenPassword"].forEach((id) => {
      document.getElementById(id).onkeydown = (e) => {
        if (e.key === "Enter") doCitizenAuth();
      };
    });
  }
  const citizenLogoutBtn = document.getElementById("citizenLogoutBtn");
  if (citizenLogoutBtn) citizenLogoutBtn.onclick = () => doCitizenLogout();

  const staffLoginBtn = document.getElementById("staffLoginBtn");
  if (staffLoginBtn) {
    staffLoginBtn.onclick = () => doStaffLogin();
    ["staffUsername", "staffPassword"].forEach((id) => {
      document.getElementById(id).onkeydown = (e) => {
        if (e.key === "Enter") doStaffLogin();
      };
    });
  }
  const staffLogoutBtn = document.getElementById("staffLogoutBtn");
  if (staffLogoutBtn) staffLogoutBtn.onclick = () => doStaffLogout();
}

async function doCitizenAuth() {
  const username = document.getElementById("citizenUsername").value.trim();
  const password = document.getElementById("citizenPassword").value;
  if (!username || !password) {
    State.loginError = "ユーザーIDとパスワードを入力してください";
    renderShell();
    return;
  }
  try {
    const action = State.authTab === "signup" ? citizenSignup : citizenLogin;
    const user = await action(username, password);
    State.citizenUser = user;
    State.role = "citizen";
    State.showRoleSheet = false;
    State.loginError = null;
    await refreshAndRender();
    showToast(State.authTab === "signup" ? `登録しました（ID: ${user.username}）` : `ログインしました（ID: ${user.username}）`);
  } catch (err) {
    State.loginError = err.message;
    renderShell();
  }
}

async function doCitizenLogout() {
  await citizenLogout();
  State.citizenUser = null;
  State.onlyMine = false;
  if (State.role === "citizen") State.role = "public";
  State.showRoleSheet = false;
  await refreshAndRender();
  showToast("市民アカウントからログアウトしました");
}

async function doStaffLogin() {
  const username = document.getElementById("staffUsername").value.trim();
  const password = document.getElementById("staffPassword").value;
  if (!username || !password) {
    State.loginError = "ユーザー名とパスワードを入力してください";
    renderShell();
    return;
  }
  try {
    const user = await staffLogin(username, password);
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

async function doStaffLogout() {
  await staffLogout();
  State.staffUser = null;
  State.role = "citizen";
  State.showRoleSheet = false;
  await refreshAndRender();
  showToast("管理者からログアウトしました");
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
    document.querySelectorAll("[data-onlymine]").forEach((b) => {
      b.onclick = async () => {
        State.onlyMine = b.dataset.onlymine === "1";
        await refreshAndRender();
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
    if (me.staff) {
      State.staffUser = me.staff;
      State.role = "staff";
    } else if (me.citizen) {
      State.citizenUser = me.citizen;
      State.role = "citizen";
    } else {
      State.role = "public";
    }
  } catch (e) {
    // ログイン状態の取得に失敗してもアプリ自体は起動させる
    console.warn("fetchMe failed", e);
  }
  await refreshAndRender();
})();
