/**
 * constants.js
 * ------------
 * カテゴリ・状態・部位など、フロントエンド全体で共有する定義値。
 * バックエンド(models.py)の ALLOWED_CATEGORIES / ALLOWED_STATUSES と
 * 値（キー）は必ず一致させること。
 */

export const CATS = {
  road:       { label: "道路陥没",           icon: "alert",  color: "#dc2626" },
  guardrail:  { label: "ガードレール破損",     icon: "wrench", color: "#ea580c" },
  vegetation: { label: "視界不良（植生）",      icon: "tree",   color: "#0d9488" },
  dumping:    { label: "不法投棄物",           icon: "trash",  color: "#92400e" },
  light:      { label: "照明不灯",             icon: "bulb",   color: "#ca8a04" },
  noise:      { label: "騒音・苦情",           icon: "volume", color: "#4338ca" },
};

export const PARTS = ["車道", "歩道", "信号機", "街路灯", "ガードレール", "標識", "公園設備", "その他"];

export const STATUS = {
  received:    { label: "受付",   color: "#f59e0b", icon: "clock" },
  in_review:   { label: "確認中", color: "#3b82f6", icon: "eye" },
  in_progress: { label: "対応中", color: "#f97316", icon: "wrench" },
  done:        { label: "完了",   color: "#16a34a", icon: "checkcircle" },
};

export const AREAS = [
  "世田谷区 北沢", "世田谷区 三軒茶屋", "世田谷区 若林",
  "瑞穂町 箱根ケ崎", "瑞穂町 元狭山",
];

export function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return "今日";
  return `${d}日前`;
}
