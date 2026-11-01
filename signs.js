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
