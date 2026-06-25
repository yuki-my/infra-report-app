/**
 * views/sheet.js
 * ---------------
 * 報告をタップした時に下から出てくる詳細パネル。
 * 役割(citizen/staff/public)によって見える項目を変える。
 */

import { renderIcon } from "../icons.js";
import { CATS, STATUS, timeAgo } from "../constants.js";
import { State } from "../state.js";

export function renderSheet() {
  const r = State.reports.find((x) => x.id === State.selectedId);
  if (!r) return "";
  const cat = CATS[r.category];
  const st = STATUS[r.status];
  const isPublic = State.role === "public";
  const isStaff = State.role === "staff";
  const isMine = State.citizenUser && r.reporter === State.citizenUser.username;
  const address = isPublic ? r.address.split(" ")[0] + "（詳細非公開）" : r.address;

  return `
    <div class="sheet-backdrop" id="sheetBackdrop">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:9px;">
            <div class="cat-icon" style="background:${cat.color}1A;">${renderIcon(cat.icon, 18, cat.color)}</div>
            <div>
              <div style="font-weight:800; font-size:15px;">${r.title} ${isMine ? `<span class="badge" style="background:#16a34a1A; color:var(--green); margin-left:4px;">自分の報告</span>` : ""}</div>
              <div style="font-size:12px; color:var(--sub);">${cat.label} ・ ${r.part}</div>
            </div>
          </div>
          <button class="icon-btn" id="sheetClose">${renderIcon("x", 18)}</button>
        </div>

        <div class="sheet-photo">
          ${r.photo ? `<img src="${r.photo}"/>` : `${renderIcon("image", 20)} 写真`}
        </div>

        <div class="kv"><b>場所</b>${address}${r.addressNote ? " ・ " + r.addressNote : ""}</div>
        <div class="kv"><b>報告日</b>${timeAgo(r.createdAt)}</div>
        ${
          !isPublic
            ? `<div class="kv" style="display:flex; gap:5px;"><b style="flex:none;">詳細</b><span>${r.comment}</span></div>`
            : `<div class="kv" style="font-style:italic; color:var(--sub);">コメント本文は公開ビューでは非表示です</div>`
        }
        ${isStaff ? `<div class="kv"><b>通報者ID</b>${r.reporter}</div>` : ""}
        ${isStaff && r.assignee ? `<div class="kv"><b>担当</b>${r.assignee}</div>` : ""}

        <div style="margin:12px 0;"><span class="badge" style="background:${st.color}1A; color:${st.color};">${renderIcon(st.icon, 12, st.color)} ${st.label}</span></div>

        ${
          isStaff
            ? `
          <div style="border-top:1px solid var(--border); padding-top:12px; margin-top:8px;">
            <div style="font-size:11.5px; font-weight:700; color:var(--sub); margin-bottom:8px;">状態を更新</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              ${Object.entries(STATUS)
                .map(
                  ([k, v]) => `
                <button data-setstatus="${k}" style="padding:6px 11px; border-radius:100px; font-size:11.5px; font-weight:700; cursor:pointer;
                  border:1px solid ${r.status === k ? v.color : "var(--border)"}; background:${r.status === k ? v.color + "15" : "#fff"}; color:${r.status === k ? v.color : "var(--text)"};">
                  ${v.label}
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}
