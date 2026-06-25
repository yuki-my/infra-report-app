/**
 * views/mapView.js
 * ----------------
 * 「報告マップ」画面：検索・フィルタ・地図/リスト切替を担当。
 */

import { renderIcon } from "../icons.js";
import { CATS, STATUS, timeAgo } from "../constants.js";
import { State, visibleReports } from "../state.js";

export function reportCardHtml(r) {
  const cat = CATS[r.category];
  const st = STATUS[r.status];
  const address = State.role === "public" ? r.address.split(" ")[0] : r.address;
  return `
    <div class="report-card" data-open="${r.id}">
      <div class="cat-icon" style="background:${cat.color}1A;">${renderIcon(cat.icon, 18, cat.color)}</div>
      <div style="flex:1; min-width:0;">
        <div class="rt">${r.title}</div>
        <div class="ra">${renderIcon("pin", 11)} ${address} · ${timeAgo(r.createdAt)}</div>
      </div>
      <span class="badge" style="background:${st.color}1A; color:${st.color};">${renderIcon(st.icon, 11, st.color)} ${st.label}</span>
    </div>
  `;
}

export function renderMapView() {
  const list = visibleReports();
  return `
    <div class="map-header">
      <div>
        <h1 class="page-title">報告マップ</h1>
        <p class="page-sub">${list.length} 件の報告</p>
      </div>
      <button class="btn-primary" id="goReport">${renderIcon("plus", 15, "#fff")} 報告する</button>
    </div>
    <div class="toolbar">
      <div class="search-wrap">${renderIcon("search", 15)}<input id="searchInput" type="text" placeholder="検索..." value="${State.search}"/></div>
      <div class="select-wrap"><select class="filter-select" id="catFilter">
        <option value="all">すべての現象</option>
        ${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${State.fCat === k ? "selected" : ""}>${v.label}</option>`).join("")}
      </select></div>
      <div class="select-wrap"><select class="filter-select" id="statusFilter">
        <option value="all">すべての状態</option>
        ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${State.fStatus === k ? "selected" : ""}>${v.label}</option>`).join("")}
      </select></div>
      <div class="seg">
        <button data-mode="map" class="${State.mapMode === "map" ? "active" : ""}">${renderIcon("map", 13)} マップ</button>
        <button data-mode="list" class="${State.mapMode === "list" ? "active" : ""}">${renderIcon("list", 13)} リスト</button>
      </div>
    </div>
    ${
      State.mapMode === "map"
        ? `<div id="listMap" class="leaflet-map"></div>`
        : `<div id="listWrap">${list.map(reportCardHtml).join("") || '<div class="empty">該当する報告はありません</div>'}</div>`
    }
  `;
}

function catDivIcon(catKey, statusKey) {
  const cat = CATS[catKey];
  const st = STATUS[statusKey];
  const html = `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:${cat.color};border:2px solid ${st.color};display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px #0004;"><div style="transform:rotate(45deg);">${renderIcon(cat.icon, 13, "#fff")}</div></div>`;
  return L.divIcon({ html, className: "leaflet-div-icon", iconSize: [30, 30], iconAnchor: [15, 30] });
}

/** Leaflet地図を listMap コンテナにマウントする。onOpen は ピン/マーカークリック時のコールバック。 */
export function mountListMap(onOpen) {
  const el = document.getElementById("listMap");
  if (!el) return;
  if (State.leaflet.list) {
    State.leaflet.list.remove();
    State.leaflet.list = null;
  }
  const map = L.map(el, { scrollWheelZoom: true }).setView([35.70, 139.55], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  visibleReports().forEach((r) => {
    const marker = L.marker([r.lat, r.lng], { icon: catDivIcon(r.category, r.status) }).addTo(map);
    marker.on("click", () => onOpen(r.id));
    marker.bindTooltip(r.title, { direction: "top", offset: [0, -26] });
  });

  State.leaflet.list = map;
}
