/**
 * views/gateView.js
 * -------------------
 * アプリを開いた時に最初に表示する入口画面。
 *   - 新規登録 / ログイン / ゲストとして続行 の3択
 *   - 新規登録・ログインを選ぶと、その場でフォームに切り替わる
 *   - ここでのログインは「市民」アカウントのみを対象とする
 *     （自治体職員ログインは、ゲートを抜けた後に右上の役割ピルから行う）
 */

import { renderIcon } from "../icons.js";
import { State } from "../state.js";

export function renderGate() {
  return `
    <div class="gate">
      <div class="gate-card">
        <div class="gate-logo">${renderIcon("pin", 26, "#fff")}</div>
        <div class="gate-title">インフラ報告</div>
        <div class="gate-sub">道路の陥没、照明不灯、不法投棄など。<br/>まちの困りごとを、みんなで見つけて共有するアプリです。</div>
        ${State.gateStep === "choice" ? renderChoice() : renderAuthForm()}
      </div>
    </div>
  `;
}

function renderChoice() {
  return `
    <div class="gate-choice">
      <button class="btn-primary" data-gate="signup" style="width:100%;">${renderIcon("user", 15, "#fff")} 新規登録</button>
      <button class="btn-secondary" data-gate="login" style="width:100%;">${renderIcon("user", 15)} ログイン</button>
    </div>
    <div class="gate-guest-link">
      <button data-gate="guest">ゲストとして続行</button>
    </div>
  `;
}

function renderAuthForm() {
  const isSignup = State.gateStep === "signup";
  return `
    <button class="gate-back" id="gateBack">${renderIcon("chevleft", 16)} 戻る</button>

    <div style="font-weight:800; font-size:15px; margin-bottom:14px;">${isSignup ? "新規登録" : "ログイン"}</div>

    <div class="field" style="margin-bottom:10px;">
      <input type="text" id="gateUsername" placeholder="ユーザーID（3〜20文字）" autocomplete="username" />
    </div>
    <div class="field" style="margin-bottom:6px;">
      <input type="password" id="gatePassword" placeholder="パスワード（4文字以上）" autocomplete="${isSignup ? "new-password" : "current-password"}" />
    </div>

    ${State.loginError ? `<div style="color:#dc2626; font-size:12.5px; margin-bottom:10px;">${State.loginError}</div>` : ""}

    <button class="btn-primary" id="gateSubmit" style="width:100%; margin-top:6px;">
      ${renderIcon("check", 15, "#fff")} ${isSignup ? "登録してはじめる" : "ログイン"}
    </button>

    ${
      isSignup
        ? `<div style="font-size:11.5px; color:var(--sub); margin-top:10px; line-height:1.6;">メールアドレスは不要です。好きなユーザーIDとパスワードを決めてください。</div>`
        : ""
    }

    <div class="gate-guest-link" style="margin-top:18px;">
      <button data-gate="guest">ゲストとして続行</button>
    </div>
  `;
}
