/**
 * views/dashboardView.js
 * -----------------------
 * 「ダッシュボード」画面：状態別の件数カードと最近の報告一覧。
 */

import { renderIcon } from "../icons.js";
import { STATUS } from "../constants.js";
import { State, visibleReports } from "../state.js";
import { reportCardHtml } from "./mapView.js";

export function renderDashboardView() {
  const list = visibleReports();
  const counts = { received: 0, in_review: 0, in_progress: 0, done: 0, ...State.stats };

  const bannerText =
    State.role === "staff"
      ? "管理者ビュー：全件の詳細・通報者情報・担当割当・状態変更が可能です。"
      : State.role === "public"
      ? "公開ビュー：通報者名・コメント本文・詳細な住所は非表示。エリア単位の傾向のみ表示します。"
      : "市民ビュー：自分が送った報告の進捗のみ確認できます。";

  const bannerColor = State.role === "staff" ? "#3b82f6" : State.role === "public" ? "#64748a" : "#f59e0b";

  return `
    <h1 class="page-title">ダッシュボード</h1>
    <p class="page-sub">通報状況の集計と一覧</p>

    <div class="banner" style="background:${bannerColor}0d; border:1px solid ${bannerColor}40;">
      ${renderIcon("eye", 14)} ${bannerText}
    </div>

    <div class="stat-grid">
      ${Object.entries(STATUS)
        .map(
          ([k, v]) => `
        <div class="stat-card">
          <div class="lbl">${renderIcon(v.icon, 13, v.color)} ${v.label}</div>
          <div class="num">${counts[k] || 0}</div>
        </div>
      `
        )
        .join("")}
    </div>

    <div style="font-weight:800; font-size:14.5px; margin-bottom:10px;">最近の報告</div>
    ${list.slice(0, 8).map(reportCardHtml).join("") || '<div class="empty">報告はまだありません</div>'}
  `;
}
