// Bas Gaza: traffic signs, drawn by us as SVG (100 x 100). Shapes and meanings follow
// the official KGM "Karayolu Trafik İşaretleme Standartları" (2020); the drawings are our own.

const SIGNS = {
  dur: '<polygon points="94.3,68.4 68.4,94.3 31.6,94.3 5.7,68.4 5.7,31.6 31.6,5.7 68.4,5.7 94.3,31.6" fill="#fff"/><polygon points="89.7,66.5 66.5,89.7 33.5,89.7 10.3,66.5 10.3,33.5 33.5,10.3 66.5,10.3 89.7,33.5" fill="#d32f2f"/><text x="50" y="61" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="30" fill="#fff">DUR</text>',
  yolVer: '<polygon points="6,13 94,13 50,91" fill="#fff" stroke="#d32f2f" stroke-width="9" stroke-linejoin="round"/>',
  girisiOlmayan: '<circle cx="50" cy="50" r="48" fill="#d32f2f"/><rect x="18" y="42" width="64" height="16" fill="#fff"/>',
  gecmeYasak: '<circle cx="50" cy="50" r="44" fill="#fff" stroke="#d32f2f" stroke-width="10"/><rect x="23" y="38" width="22" height="22" rx="5" fill="#d32f2f"/><rect x="27" y="31" width="14" height="10" rx="3" fill="#d32f2f"/><rect x="29" y="33" width="10" height="6" rx="2" fill="#fff"/><rect x="25" y="58" width="5" height="6" fill="#1f2328"/><rect x="38" y="58" width="5" height="6" fill="#1f2328"/><rect x="55" y="38" width="22" height="22" rx="5" fill="#1f2328"/><rect x="59" y="31" width="14" height="10" rx="3" fill="#1f2328"/><rect x="61" y="33" width="10" height="6" rx="2" fill="#fff"/><rect x="57" y="58" width="5" height="6" fill="#1f2328"/><rect x="70" y="58" width="5" height="6" fill="#1f2328"/>',
  hiz50: '<circle cx="50" cy="50" r="44" fill="#fff" stroke="#d32f2f" stroke-width="10"/><text x="50" y="64" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="#1f2328">50</text>',
  kornaYasak: '<circle cx="50" cy="50" r="44" fill="#fff" stroke="#d32f2f" stroke-width="10"/><polygon points="27,42 38,42 66,28 66,72 38,58 27,58" fill="#1f2328"/><line x1="21" y1="21" x2="79" y2="79" stroke="#d32f2f" stroke-width="9"/>',
  solaDonulmez: '<circle cx="50" cy="50" r="44" fill="#fff" stroke="#d32f2f" stroke-width="10"/><path d="M60 78 V48 Q60 38 50 38 H36" fill="none" stroke="#1f2328" stroke-width="9"/><polygon points="22,38 38,26 38,50" fill="#1f2328"/><line x1="21" y1="21" x2="79" y2="79" stroke="#d32f2f" stroke-width="9"/>',
  adaEtrafinda: '<circle cx="50" cy="50" r="48" fill="#1565c0"/><path d="M67.4 29.3 A27 27 0 0 0 34.5 27.9" fill="none" stroke="#fff" stroke-width="8"/><polygon points="25.5,34.2 29.4,20.5 39.7,35.3" fill="#fff"/><path d="M59.2 75.4 A27 27 0 0 0 76.9 47.6" fill="none" stroke="#fff" stroke-width="8"/><polygon points="75.9,36.7 85.9,46.9 67.9,48.4" fill="#fff"/><path d="M23.4 45.3 A27 27 0 0 0 38.6 74.5" fill="none" stroke="#fff" stroke-width="8"/><polygon points="48.6,79.1 34.8,82.6 42.4,66.3" fill="#fff"/>',
  yayaGecidi: '<polygon points="50,9 94,87 6,87" fill="#fff" stroke="#d32f2f" stroke-width="8" stroke-linejoin="round"/><rect x="28" y="74" width="7" height="7" fill="#1f2328"/><rect x="40" y="74" width="7" height="7" fill="#1f2328"/><rect x="52" y="74" width="7" height="7" fill="#1f2328"/><rect x="64" y="74" width="7" height="7" fill="#1f2328"/><circle cx="51" cy="35" r="5" fill="#1f2328"/><path d="M50 42 L47 57 L40 70 M47 57 L56 70 M49 46 L40 53 M49 46 L59 51" fill="none" stroke="#1f2328" stroke-width="5" stroke-linecap="round"/>',
  kayganYol: '<polygon points="50,9 94,87 6,87" fill="#fff" stroke="#d32f2f" stroke-width="8" stroke-linejoin="round"/><g transform="rotate(-18 50 46)"><rect x="40" y="34" width="20" height="26" rx="5" fill="#1f2328"/><rect x="43" y="38" width="14" height="6" rx="2" fill="#fff"/></g><path d="M36 82 q-6 -6 0 -12 t0 -12 M64 82 q6 -6 0 -12 t0 -12" fill="none" stroke="#1f2328" stroke-width="4" stroke-linecap="round"/>',
  // Dashboard warning lights (ISO-style symbols, drawn by us)
  isikYagBasinci: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><path d="M12 46 L22 50 L28 44 H58 L84 34 L88 38 L64 64 H28 V54 Z" fill="#ef4444"/><rect x="36" y="36" width="12" height="8" rx="2" fill="#ef4444"/><path d="M86 52 q-5 8 0 12 q5 -4 0 -12z" fill="#ef4444"/>',
  isikSuSicakligi: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><line x1="50" y1="16" x2="50" y2="58" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/><line x1="50" y1="24" x2="62" y2="24" stroke="#ef4444" stroke-width="5"/><line x1="50" y1="36" x2="62" y2="36" stroke="#ef4444" stroke-width="5"/><circle cx="50" cy="62" r="8" fill="#ef4444"/><path d="M14 76 q9 -7 18 0 t18 0 t18 0 t18 0 M14 88 q9 -7 18 0 t18 0 t18 0 t18 0" fill="none" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>',
  isikAku: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><rect x="16" y="34" width="68" height="42" rx="4" fill="none" stroke="#ef4444" stroke-width="7"/><rect x="26" y="26" width="12" height="8" fill="#ef4444"/><rect x="62" y="26" width="12" height="8" fill="#ef4444"/><path d="M26 54 h14 M33 47 v14 M60 54 h14" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>',
  isikArkaCam: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><path d="M16 76 V30 Q16 22 24 22 H76 Q84 22 84 30 V76" fill="none" stroke="#f59e0b" stroke-width="6"/><path d="M34 70 q-6 -8 0 -16 t0 -16 M50 70 q-6 -8 0 -16 t0 -16 M66 70 q-6 -8 0 -16 t0 -16" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/><polygon points="34,30 27,40 41,40" fill="#f59e0b"/><polygon points="50,30 43,40 57,40" fill="#f59e0b"/><polygon points="66,30 59,40 73,40" fill="#f59e0b"/>',
  isikSagSinyal: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><polygon points="20,40 50,40 50,24 82,50 50,76 50,60 20,60" fill="#22c55e"/>',
  isikDortlu: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><polygon points="44,43 26,43 26,35 10,50 26,65 26,57 44,57" fill="#22c55e"/><polygon points="56,43 74,43 74,35 90,50 74,65 74,57 56,57" fill="#22c55e"/>',
  isikUzunFar: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><path d="M50 24 Q86 24 86 50 Q86 76 50 76 Z" fill="none" stroke="#3b82f6" stroke-width="7" stroke-linejoin="round"/><line x1="14" y1="30" x2="40" y2="30" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/><line x1="14" y1="44" x2="40" y2="44" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/><line x1="14" y1="58" x2="40" y2="58" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/><line x1="14" y1="72" x2="40" y2="72" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/>',
  isikKisaFar: '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1f2328"/><path d="M50 24 Q86 24 86 50 Q86 76 50 76 Z" fill="none" stroke="#22c55e" stroke-width="7" stroke-linejoin="round"/><line x1="12" y1="40" x2="40" y2="28" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/><line x1="12" y1="54" x2="40" y2="42" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/><line x1="12" y1="68" x2="40" y2="56" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>',
};

function signSvg(name) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${SIGNS[name]}</svg>`;
}

// The same drawing as an image, so the canvas can show the sign beside the road.
const signImages = {};
function signImage(name) {
  if (!signImages[name]) {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(signSvg(name))}`;
    signImages[name] = image;
  }
  return signImages[name];
}
