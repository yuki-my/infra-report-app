/**
 * views/roleSheet.js
 * --------------------
 * 右上の役割ピルをタップすると開くシート。
 * 「市民」「公開」への切替はそのまま即時切替（ログイン不要）。
 * 「管理者」は実際のログインが必要で、未ログインならここにフォームを表示する。
 */

import { renderIcon } from "../icons.js";
import { State } from "../state.js";

export function renderRoleSheet() {
  const loggedIn = !!State.staffUser;

  return `
    <div class="sheet-backdrop" id="roleSheetBackdrop">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div style="font-weight:800; font-size:15px; margin-bottom:14px;">表示する役割を選択</div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
          <button class="role-option" data-role="citizen">
            ${renderIcon("user", 16)}
            <div style="text-align:left; flex:1;">
              <div class="ro-title">市民</div>
              <div class="ro-sub">自分が送った報告のみ確認（ログイン不要）</div>
            </div>
            ${State.role === "citizen" ? renderIcon("check", 16, "var(--green)") : ""}
          </button>

          <button class="role-option" data-role="public">
            ${renderIcon("eye", 16)}
            <div style="text-align:left; flex:1;">
              <div class="ro-title">公開ビュー</div>
              <div class="ro-sub">エリア単位の傾向のみ公開（ログイン不要）</div>
            </div>
            ${State.role === "public" ? renderIcon("check", 16, "var(--green)") : ""}
          </button>

          ${
            loggedIn
              ? `
            <button class="role-option" data-role="staff">
              ${renderIcon("grid", 16)}
              <div style="text-align:left; flex:1;">
                <div class="ro-title">管理者（${State.staffUser.displayName}）</div>
                <div class="ro-sub">${State.staffUser.municipality} としてログイン中</div>
              </div>
              ${State.role === "staff" ? renderIcon("check", 16, "var(--green)") : ""}
            </button>
          `
              : ""
          }
        </div>

        ${
          loggedIn
            ? `<button class="btn-secondary" id="staffLogoutBtn" style="width:100%;">${renderIcon("logout", 15)} ログアウト</button>`
            : `
          <div style="border-top:1px solid var(--border); padding-top:16px;">
            <div style="font-weight:700; font-size:13.5px; margin-bottom:10px;">自治体職員ログイン</div>
            <div class="field" style="margin-bottom:10px;">
              <input type="text" id="staffUsername" placeholder="ユーザー名" autocomplete="username" />
            </div>
            <div class="field" style="margin-bottom:6px;">
              <input type="password" id="staffPassword" placeholder="パスワード" autocomplete="current-password" />
            </div>
            ${State.loginError ? `<div style="color:#dc2626; font-size:12.5px; margin-bottom:10px;">${State.loginError}</div>` : ""}
            <button class="btn-primary" id="staffLoginBtn" style="width:100%; margin-top:6px;">
              ${renderIcon("user", 15, "#fff")} ログイン
            </button>
            <div style="font-size:11.5px; color:var(--sub); margin-top:10px; line-height:1.6;">
              デモ用アカウント：setagaya_staff / setagaya2026<br/>
              （瑞穂町: mizuho_staff / mizuho2026）
            </div>
          </div>
        `
        }
      </div>
    </div>
  `;
}
