/**
 * views/roleSheet.js
 * --------------------
 * 右上の役割ピルをタップすると開くシート。
 *   - 市民: ユーザーID + パスワードでログイン or 新規登録（メール不要）
 *   - 公開ビュー: ログイン不要、即時切替
 *   - 管理者: 事前に用意された職員アカウントでのみログイン可能
 */

import { renderIcon } from "../icons.js";
import { State } from "../state.js";

export function renderRoleSheet() {
  const citizenLoggedIn = !!State.citizenUser;
  const staffLoggedIn = !!State.staffUser;

  return `
    <div class="sheet-backdrop" id="roleSheetBackdrop">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div style="font-weight:800; font-size:15px; margin-bottom:14px;">表示する役割を選択</div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
          <button class="role-option" data-role="citizen" ${citizenLoggedIn ? "" : "disabled"}>
            ${renderIcon("user", 16)}
            <div style="text-align:left; flex:1;">
              <div class="ro-title">市民${citizenLoggedIn ? `（${State.citizenUser.username}）` : ""}</div>
              <div class="ro-sub">${citizenLoggedIn ? "ログイン中：自分の報告に印がつきます" : "下のフォームからログイン／登録してください"}</div>
            </div>
            ${State.role === "citizen" ? renderIcon("check", 16, "var(--green)") : ""}
          </button>

          <button class="role-option" data-role="public">
            ${renderIcon("eye", 16)}
            <div style="text-align:left; flex:1;">
              <div class="ro-title">公開ビュー</div>
              <div class="ro-sub">通報者名などを伏せた状態で全件を閲覧（ログイン不要）</div>
            </div>
            ${State.role === "public" ? renderIcon("check", 16, "var(--green)") : ""}
          </button>

          ${
            staffLoggedIn
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

        ${citizenLoggedIn ? renderCitizenLoggedIn() : renderCitizenAuthForm()}

        ${
          staffLoggedIn
            ? `
          <div style="border-top:1px solid var(--border); padding-top:14px; margin-top:14px;">
            <button class="btn-secondary" id="staffLogoutBtn" style="width:100%;">${renderIcon("logout", 15)} 管理者からログアウト</button>
          </div>
        `
            : renderStaffLoginForm()
        }
      </div>
    </div>
  `;
}

function renderCitizenLoggedIn() {
  return `
    <div style="border-top:1px solid var(--border); padding-top:14px; margin-bottom:6px;">
      <button class="btn-secondary" id="citizenLogoutBtn" style="width:100%;">${renderIcon("logout", 15)} 市民アカウントからログアウト</button>
    </div>
  `;
}

function renderCitizenAuthForm() {
  const tab = State.authTab; // "login" | "signup"
  return `
    <div style="border-top:1px solid var(--border); padding-top:16px;">
      <div class="seg" style="margin-bottom:12px; width:100%;">
        <button data-authtab="login" class="${tab === "login" ? "active" : ""}" style="flex:1; justify-content:center;">ログイン</button>
        <button data-authtab="signup" class="${tab === "signup" ? "active" : ""}" style="flex:1; justify-content:center;">新規登録</button>
      </div>

      <div class="field" style="margin-bottom:10px;">
        <input type="text" id="citizenUsername" placeholder="ユーザーID（3〜20文字）" autocomplete="username" />
      </div>
      <div class="field" style="margin-bottom:6px;">
        <input type="password" id="citizenPassword" placeholder="パスワード（4文字以上）" autocomplete="${tab === "signup" ? "new-password" : "current-password"}" />
      </div>

      ${State.loginError ? `<div style="color:#dc2626; font-size:12.5px; margin-bottom:10px;">${State.loginError}</div>` : ""}

      <button class="btn-primary" id="citizenAuthBtn" style="width:100%; margin-top:6px;">
        ${renderIcon("user", 15, "#fff")} ${tab === "signup" ? "登録してログイン" : "ログイン"}
      </button>
      <div style="font-size:11.5px; color:var(--sub); margin-top:9px; line-height:1.6;">
        メールアドレスは不要です。好きなユーザーIDとパスワードを決めて登録してください。
      </div>
    </div>
  `;
}

function renderStaffLoginForm() {
  return `
    <div style="border-top:1px solid var(--border); padding-top:16px; margin-top:14px;">
      <div style="font-weight:700; font-size:13.5px; margin-bottom:10px;">自治体職員ログイン</div>
      <div class="field" style="margin-bottom:10px;">
        <input type="text" id="staffUsername" placeholder="ユーザー名" autocomplete="username" />
      </div>
      <div class="field" style="margin-bottom:6px;">
        <input type="password" id="staffPassword" placeholder="パスワード" autocomplete="current-password" />
      </div>
      <button class="btn-secondary" id="staffLoginBtn" style="width:100%; margin-top:6px;">
        ${renderIcon("user", 15)} 管理者としてログイン
      </button>
    </div>
  `;
}
