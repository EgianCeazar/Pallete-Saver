const $ = (id) => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 9);

let state = null;
let toastTimer = null;
let confirmTimer = null;

const THEMES = [
  { key: "slate",     name: "Slate Dark", bg: "#0f172a", ink: "#f8fafc", panel: "#1e293b", accent: "#38bdf8", hover: "#334155", primaryHover: "#0284c7" },
  { key: "mint",      name: "Mint",       bg: "#d6efe3", ink: "#1f2d3d", panel: "#f3fbf7", accent: "#ff6f95", hover: "#ffffff", primaryHover: "#2d4259" },
  { key: "bubblegum", name: "Bubblegum",  bg: "#ffd9e8", ink: "#3b1f3a", panel: "#fff2f8", accent: "#7a5cff", hover: "#ffffff", primaryHover: "#5a3558" },
  { key: "ocean",     name: "Ocean",      bg: "#cfe8f7", ink: "#12304a", panel: "#eef8fd", accent: "#ff8a3d", hover: "#ffffff", primaryHover: "#245173" },
  { key: "sunset",    name: "Sunset",     bg: "#ffe0c2", ink: "#4a1f1a", panel: "#fff4e8", accent: "#d6336c", hover: "#ffffff", primaryHover: "#6e3a33" },
  { key: "lavender",  name: "Lavender",   bg: "#e3dcff", ink: "#2b2350", panel: "#f6f3ff", accent: "#2fbf9b", hover: "#ffffff", primaryHover: "#443a77" },
  { key: "midnight",  name: "Midnight",   bg: "#1b2230", ink: "#e8eef7", panel: "#263043", accent: "#ff6f95", hover: "#33415a", primaryHover: "#ffffff" },
  { key: "terminal",  name: "Terminal",   bg: "#0f1a0f", ink: "#8dff8d", panel: "#162616", accent: "#ffd447", hover: "#1f361f", primaryHover: "#c8ffc8" }
];
let themeKey = "slate";

function applyTheme(key) {
  const t = THEMES.find((x) => x.key === key) || THEMES[0];
  themeKey = t.key;
  const s = document.documentElement.style;
  s.setProperty("--bg", t.bg);
  s.setProperty("--ink", t.ink);
  s.setProperty("--panel", t.panel);
  s.setProperty("--accent", t.accent);
  s.setProperty("--hover", t.hover);
  s.setProperty("--primary-hover", t.primaryHover);
  s.setProperty("--border", t.hover);
  buildThemes();
}

function buildThemes() {
  const wrap = $("themes");
  wrap.innerHTML = "";
  THEMES.forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "theme-btn";
    b.title = t.name;
    b.setAttribute("aria-label", t.name + " theme");
    b.setAttribute("aria-pressed", String(t.key === themeKey));
    b.style.background = `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`;
    b.style.borderColor = t.ink;
    b.addEventListener("click", () => {
      applyTheme(t.key);
      chrome.storage.local.set({ theme: t.key });
    });
    wrap.appendChild(b);
  });
}

function freshState() {
  const id = uid();
  return { palettes: [{ id, name: "My Colors", colors: [] }], active: id };
}

async function load() {
  const r = await chrome.storage.local.get("data");
  state = r.data || freshState();
  if (!state.palettes.length) state = freshState();
  if (!state.palettes.some((p) => p.id === state.active)) state.active = state.palettes[0].id;
}

const save = () => chrome.storage.local.set({ data: state });
const current = () => state.palettes.find((p) => p.id === state.active);

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
}

async function copy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast(label || "Copied " + text);
  } catch (e) {
    toast("Couldn't copy");
  }
}

function addColor(hexInput, customName = "") {
  const hex = normalizeHex(hexInput);
  if (!hex) { toast("That's not a valid hex"); return; }
  const p = current();
  if (p.colors.some((c) => c.hex === hex)) { toast(hex + " is already saved"); return; }
  const name = customName || guessColorName(hex);
  p.colors.push({ hex, name });
  save();
  render();
  toast("Saved " + hex);
}

async function pick() {
  if (!("EyeDropper" in window)) {
    toast("Eyedropper not supported. Type a hex instead.");
    return;
  }
  try {
    const result = await new EyeDropper().open();
    addColor(result.sRGBHex);
  } catch (e) {
    // Esc pressed
  }
}

function newPalette() {
  const id = uid();
  state.palettes.push({ id, name: "Palette " + state.palettes.length, colors: [] });
  state.active = id;
  save();
  render();
  $("pname").focus();
  $("pname").select();
}

function deletePalette() {
  const btn = $("del");
  if (btn.dataset.sure !== "1") {
    btn.dataset.sure = "1";
    btn.textContent = "Sure?";
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(resetDeleteBtn, 3000);
    return;
  }
  resetDeleteBtn();
  state.palettes = state.palettes.filter((p) => p.id !== state.active);
  if (!state.palettes.length) state = freshState();
  state.active = state.palettes[0].id;
  save();
  render();
}

function resetDeleteBtn() {
  const btn = $("del");
  btn.dataset.sure = "0";
  btn.textContent = "Delete";
}

function removeColor(hex) {
  const p = current();
  p.colors = p.colors.filter((c) => c.hex !== hex);
  save();
  render();
}

function exportCss() {
  const p = current();
  if (!p.colors.length) { toast("Nothing to export"); return; }
  const lines = p.colors.map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.name} */`);
  copy(`:root {\n${lines.join("\n")}\n}`, "Copied CSS variables");
}

function exportTailwind() {
  const p = current();
  if (!p.colors.length) { toast("Nothing to export"); return; }
  const obj = {};
  p.colors.forEach((c, i) => { obj[`color-${i + 1}`] = c.hex; });
  copy(JSON.stringify(obj, null, 2), "Copied Tailwind JSON");
}

function exportScss() {
  const p = current();
  if (!p.colors.length) { toast("Nothing to export"); return; }
  const lines = p.colors.map((c, i) => `$color-${i + 1}: ${c.hex}; // ${c.name}`);
  copy(lines.join("\n"), "Copied SCSS variables");
}

function exportJson() {
  const p = current();
  if (!p.colors.length) { toast("Nothing to export"); return; }
  const out = { name: p.name, colors: p.colors };
  copy(JSON.stringify(out, null, 2), "Copied JSON");
}

function handleImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 50; canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      const imgData = ctx.getImageData(0, 0, 50, 50).data;
      const found = new Set();
      for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i], g = imgData[i+1], b = imgData[i+2];
        const hex = "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
        found.add(hex);
        if (found.size >= 5) break;
      }
      found.forEach(h => addColor(h));
      toast("Extracted colors from image!");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function render() {
  const sel = $("palettes");
  sel.innerHTML = "";
  state.palettes.forEach((p) => {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = `${p.name} (${p.colors.length})`;
    sel.appendChild(o);
  });
  sel.value = state.active;

  const p = current();
  if (document.activeElement !== $("pname")) $("pname").value = p.name;

  const filter = ($("search").value || "").toLowerCase();
  const filteredColors = p.colors.filter(c => c.hex.toLowerCase().includes(filter) || c.name.toLowerCase().includes(filter));

  $("empty").hidden = p.colors.length > 0;

  const grid = $("grid");
  grid.innerHTML = "";
  filteredColors.forEach((c) => {
    const card = document.createElement("div");
    card.className = "card";

    const sw = document.createElement("button");
    sw.className = "swatch";
    sw.type = "button";
    sw.style.background = c.hex;
    sw.setAttribute("aria-label", "Copy " + c.hex);
    sw.addEventListener("click", () => copy(c.hex));

    const nameInput = document.createElement("input");
    nameInput.className = "namelabel";
    nameInput.type = "text";
    nameInput.value = c.name;
    nameInput.setAttribute("aria-label", "Edit color name");
    nameInput.addEventListener("input", (e) => {
      c.name = e.target.value;
      save();
    });

    const hexBtn = document.createElement("button");
    hexBtn.className = "hexlabel";
    hexBtn.type = "button";
    hexBtn.textContent = c.hex;
    hexBtn.addEventListener("click", () => copy(c.hex));

    const metaRow = document.createElement("div");
    metaRow.className = "meta-row";

    const contrastRatio = getContrastRatio(c.hex);
    const contrastBadge = document.createElement("span");
    contrastBadge.className = "contrast-badge " + (contrastRatio >= 4.5 ? "pass" : "fail");
    contrastBadge.textContent = contrastRatio + ":1";
    contrastBadge.title = "WCAG Contrast Ratio against white";

    metaRow.appendChild(contrastBadge);

    const fmt = document.createElement("div");
    fmt.className = "fmt";
    const rgb = document.createElement("button");
    rgb.type = "button";
    rgb.textContent = "RGB";
    rgb.title = rgbString(c.hex);
    rgb.addEventListener("click", () => copy(rgbString(c.hex)));
    const hsl = document.createElement("button");
    hsl.type = "button";
    hsl.textContent = "HSL";
    hsl.title = hslString(c.hex);
    hsl.addEventListener("click", () => copy(hslString(c.hex)));
    fmt.append(rgb, hsl);

    const x = document.createElement("button");
    x.className = "x";
    x.type = "button";
    x.textContent = "×";
    x.setAttribute("aria-label", "Delete " + c.hex);
    x.addEventListener("click", () => removeColor(c.hex));

    card.append(sw, nameInput, hexBtn, metaRow, fmt, x);
    grid.appendChild(card);
  });
}

(async function init() {
  await load();
  const saved = await chrome.storage.local.get("theme");
  applyTheme(saved.theme || "slate");
  render();

  $("close-panel").addEventListener("click", () => window.close());
  $("pick").addEventListener("click", pick);
  $("manual").addEventListener("submit", (e) => {
    e.preventDefault();
    addColor($("hex").value);
    $("hex").value = "";
  });
  $("palettes").addEventListener("change", (e) => {
    state.active = e.target.value;
    save();
    render();
  });
  $("new").addEventListener("click", newPalette);
  $("del").addEventListener("click", deletePalette);
  $("pname").addEventListener("input", (e) => {
    current().name = e.target.value.trim() || "Untitled";
    save();
    const opt = $("palettes").selectedOptions[0];
    if (opt) opt.textContent = `${current().name} (${current().colors.length})`;
  });
  $("search").addEventListener("input", render);

  const dropzone = $("dropzone");
  dropzone.addEventListener("click", () => $("image-file").click());
  $("image-file").addEventListener("change", (e) => {
    if (e.target.files[0]) handleImageFile(e.target.files[0]);
  });
  dropzone.addEventListener("dragover", (e) => e.preventDefault());
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
  });

  $("copy-css").addEventListener("click", exportCss);
  $("copy-tailwind").addEventListener("click", exportTailwind);
  $("copy-scss").addEventListener("click", exportScss);
  $("copy-json").addEventListener("click", exportJson);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.theme && changes.theme.newValue !== themeKey) {
      applyTheme(changes.theme.newValue);
    }
    if (area === "local" && changes.data) {
      state = changes.data.newValue || freshState();
      if (!state.palettes.some((p) => p.id === state.active)) state.active = state.palettes[0].id;
      render();
    }
  });
})();