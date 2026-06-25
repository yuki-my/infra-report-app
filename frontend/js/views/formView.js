/**
 * views/formView.js
 * ------------------
 * 「新規報告」画面：写真・位置・カテゴリ・部位・タイトル・コメントの入力。
 * 送信時は api.createReport() を呼び、成功したら呼び出し元(main.js)に通知する。
 */

import { renderIcon } from "../icons.js";
import { CATS, PARTS, AREAS } from "../constants.js";
import { State } from "../state.js";

export function renderFormView() {
  const f = State.form;
  return `
    <div class="back-row">
      <button id="formBack">${renderIcon("chevleft", 20)}</button>
      <h1>新規報告</h1>
    </div>

    <div class="field">
      <label>写真</label>
      <input type="file" accept="image/*" capture="environment" id="photoInput" style="display:none"/>
      <div class="photo-box" id="photoBox">
        ${
          f.photoData
            ? `<img src="${f.photoData}"/><span class="retake">タップして変更</span>`
            : `${renderIcon("camera", 26)}<span class="label">写真追加</span>`
        }
      </div>
    </div>

    <div class="field">
      <label>場所 <span class="req">*</span></label>
      <button class="btn-secondary locate-btn" id="locateBtn">${renderIcon("crosshair", 15)} 現在地を取得</button>
      <div class="map-box map-box-tall" id="formMap"></div>
    </div>

    <div class="field">
      <label>住所・場所の補足説明</label>
      <input type="text" id="addressNote" placeholder="例）バス停の少し先、電柱No.12付近" value="${f.addressNote}"/>
    </div>

    <div class="form-row-2">
      <div class="field">
        <label>現象（カテゴリ） <span class="req">*</span></label>
        <div class="select-wrap">
          <select id="catSelect">
            <option value="" ${!f.category ? "selected" : ""} disabled>選択してください</option>
            ${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${f.category === k ? "selected" : ""}>${v.label}</option>`).join("")}
          </select>
          ${renderIcon("chevdown", 15)}
        </div>
      </div>
      <div class="field">
        <label>構造物の部位 <span class="req">*</span></label>
        <div class="select-wrap">
          <select id="partSelect">
            <option value="" ${!f.part ? "selected" : ""} disabled>選択してください</option>
            ${PARTS.map((p) => `<option value="${p}" ${f.part === p ? "selected" : ""}>${p}</option>`).join("")}
          </select>
          ${renderIcon("chevdown", 15)}
        </div>
      </div>
    </div>

    <div class="field">
      <label>タイトル</label>
      <input type="text" id="titleInput" placeholder="例）○○通りの路面ひび割れ" value="${f.title}"/>
    </div>

    <div class="field">
      <label>コメント・詳細</label>
      <textarea id="commentInput" placeholder="状況の詳細を記入してください">${f.comment}</textarea>
    </div>

    <button class="btn-primary" id="submitBtn" style="width:100%;">${renderIcon("check", 16, "#fff")} 送信する</button>
  `;
}

export function mountFormMap() {
  const el = document.getElementById("formMap");
  if (!el) return;
  if (State.leaflet.form) {
    State.leaflet.form.remove();
    State.leaflet.form = null;
  }
  const map = L.map(el, { scrollWheelZoom: true }).setView([State.form.lat, State.form.lng], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  const marker = L.marker([State.form.lat, State.form.lng], { draggable: true }).addTo(map);
  marker.on("dragend", () => {
    const p = marker.getLatLng();
    State.form.lat = p.lat;
    State.form.lng = p.lng;
  });
  map.on("click", (e) => {
    marker.setLatLng(e.latlng);
    State.form.lat = e.latlng.lat;
    State.form.lng = e.latlng.lng;
  });

  State.leaflet.form = map;
  State.leaflet.formMarker = marker;
}

/** 緯度から大まかな最寄りエリア名を推定する（簡易版。本番はジオコーディングAPI等に置き換え） */
export function nearestArea(lat) {
  return lat > 35.7 ? AREAS[3] : AREAS[2];
}
