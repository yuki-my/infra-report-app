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

  reports: [],         // /api/reports から取得したキャッシュ
  stats: {},

  search: "",
  fCat: "all",
  fStatus: "all",

  selectedId: null,
  toast: null,

  staffUser: null,      // {username, displayName, municipality} ログイン中のみ値が入る
  showRoleSheet: false,  // 役割切替シートの表示/非表示
  loginError: null,      // ログイン失敗時のエラーメッセージ

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
  return State.role === "citizen" ? "市民" : State.role === "staff" ? "管理者" : "公開";
}

/** 役割に応じて表示してよい報告だけに絞る（クライアント側の表示制御） */
export function visibleReports() {
  let list = State.reports;
  if (State.role === "citizen") list = list.filter((r) => r.reporter === "あなた");
  return list;
}
