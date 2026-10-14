function normalizeHex(input) {
  let h = String(input || "").trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return "#" + h.toUpperCase();
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbString(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

function hslString(hex) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function guessColorName(hex) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  if (l < 15) return "Deep Black";
  if (l > 90) return "Pure White";
  if (s < 15) {
    if (l < 40) return "Dark Charcoal";
    if (l < 70) return "Cool Gray";
    return "Soft Silver";
  }
  if (h < 15 || h >= 345) return "Crimson Red";
  if (h < 45) return "Warm Amber";
  if (h < 70) return "Golden Yellow";
  if (h < 160) return "Vibrant Emerald";
  if (h < 200) return "Cyan Breeze";
  if (h < 260) return "Ocean Blue";
  if (h < 310) return "Deep Purple";
  return "Hot Magenta";
}

function getContrastRatio(hex) {
  const { r, g, b } = hexToRgb(hex);
  const getLuma = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * getLuma(r) + 0.7152 * getLuma(g) + 0.0722 * getLuma(b);
  const ratio = (1.05 / (lum + 0.05));
  return ratio.toFixed(1);
}

if (typeof module !== "undefined") {
  module.exports = { normalizeHex, hexToRgb, rgbToHsl, rgbString, hslString, guessColorName, getContrastRatio };
}