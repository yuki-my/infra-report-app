/**
 * state.js
 * --------
 * アプリ全体で共有する「状態」を一箇所にまとめる。
 * 各ビュー(views/*.js)はこの State を読み書きし、変更後は
 * main.js の renderAll() を呼んで再描画する。
 */

export const State = {
  role: "citizen",   // citizen | staff | public
  view: "map",        // map | form | dashboard
  mapMode: "map",     // map | list

  showGate: true,      // true: 入口ゲート（ログイン/登録/ゲスト選択）を表示中
  gateStep: "choice",  // ゲート内の画面: "choice" | "signup" | "login"

  reports: [],         // /api/reports から取得したキャッシュ
  stats: {},

  search: "",
  fCat: "all",
  fStatus: "all",

  selectedId: null,
  toast: null,

  citizenUser: null,    // {username} 市民ログイン中のみ値が入る
  staffUser: null,      // {username, displayName, municipality} 管理者ログイン中のみ値が入る
  showRoleSheet: false,  // 役割切替シートの表示/非表示
  authTab: "login",      // citizenセクション内の "login" | "signup" タブ
  loginError: null,      // ログイン/登録失敗時のエラーメッセージ
  onlyMine: false,       // true: 自分が送った報告だけに絞る（市民ログイン時のみ使用可）

  // 新規報告フォームの入力途中の値
  form: {
    photoData: null,
    lat: 35.6464,
    lng: 139.6532,
    addressNote: "",
    category: "",
    part: "",
    title: "",
    comment: "",
  },

  // Leaflet マップインスタンスの参照（再マウント時に破棄するため保持）
  leaflet: { form: null, list: null, formMarker: null },
};

export function resetForm() {
  State.form = {
    photoData: null,
    lat: 35.6464,
    lng: 139.6532,
    addressNote: "",
    category: "",
    part: "",
    title: "",
    comment: "",
  };
}

export function roleLabel() {
  if (State.role === "staff") return State.staffUser ? State.staffUser.displayName : "管理者";
  if (State.role === "citizen") return State.citizenUser ? State.citizenUser.username : "市民";
  return "公開";
}

/** 報告一覧。役割を問わず常に全件を対象にする。
 * 市民ログイン中に「自分の報告のみ」がONになっている時だけ絞り込む。 */
export function visibleReports() {
  if (State.onlyMine && State.citizenUser) {
    return State.reports.filter((r) => r.reporter === State.citizenUser.username);
  }
  return State.reports;
}
