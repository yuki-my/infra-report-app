/**
 * icons.js
 * --------
 * 線画アイコン（SVGパス）をひとまとめにしたモジュール。
 * 他のファイルは Icons.render('camera', 18) のように呼ぶだけでよい。
 */

export const ICONS = {
  pin: '<path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  map: '<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.4"/>',
  crosshair: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  chevdown: '<path d="M6 9l6 6 6-6"/>',
  chevleft: '<path d="M15 18l-6-6 6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkcircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5 11 15l4.5-5.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4L15 12l-3-3 2.7-2.7z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>',
  tree: '<path d="M12 2 7.5 9h2L6 15h3.5L6.5 20h11L14.5 15H18l-3.5-6h2L12 2z"/><path d="M12 20v2"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.5.5.8 1 .8 1.7V16h6.4v-.8c0-.7.3-1.2.8-1.7A6 6 0 0 0 12 3z"/>',
  volume: '<path d="M5 9v6h4l5 4V5l-5 4H5z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  msg: '<path d="M4 5h16v10H8l-4 4V5z"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3" cy="6" r="1.2"/><circle cx="3" cy="12" r="1.2"/><circle cx="3" cy="18" r="1.2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
};

export function renderIcon(name, size = 16, color = "currentColor") {
  const body = ICONS[name] || "";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
