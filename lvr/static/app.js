// ── Column Definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  { key:"鄉鎮市區",                 label:"鄉鎮市區",       group:"基本資訊", def:true  },
  { key:"區段",                     label:"區段",           group:"基本資訊", def:false },
  { key:"交易年月",                 label:"交易年月",       group:"基本資訊", def:true,  sort:"year_month"  },
  { key:"社區案名",                 label:"社區案名",       group:"基本資訊", def:true  },
  { key:"來源檔案",                 label:"來源",           group:"基本資訊", def:true  },
  { key:"土地區段位置建物區段門牌", label:"地址門牌",       group:"地址",     def:false },
  { key:"棟別",                     label:"棟別",           group:"地址",     def:false },
  { key:"移轉層次",                 label:"樓層",           group:"地址",     def:false },
  { key:"總樓層數",                 label:"總樓層",         group:"地址",     def:false },
  { key:"建物型態",                 label:"建物型態",       group:"建物",     def:true  },
  { key:"主要用途",                 label:"主要用途",       group:"建物",     def:false },
  { key:"主要建材",                 label:"主要建材",       group:"建物",     def:false },
  { key:"建築完成年月",             label:"完工年月",       group:"建物",     def:false },
  { key:"電梯",                     label:"電梯",           group:"建物",     def:false },
  { key:"有無管理組織",             label:"管理組織",       group:"建物",     def:false },
  { key:"格局",                     label:"格局",           group:"格局",     def:true  },
  { key:"格局_隔間",                label:"隔間",           group:"格局",     def:false },
  { key:"建物移轉總面積_坪",        label:"面積（坪）",     group:"面積",     def:true  },
  { key:"建物移轉不含車面積_坪",    label:"不含車（坪）",   group:"面積",     def:false },
  { key:"主建物面積",               label:"主建物（坪）",   group:"面積",     def:false },
  { key:"附屬建物面積",             label:"附屬建物（坪）", group:"面積",     def:false },
  { key:"陽台面積",                 label:"陽台（坪）",     group:"面積",     def:false },
  { key:"土地移轉總面積_坪",        label:"土地（坪）",     group:"面積",     def:false },
  { key:"車位移轉總面積_坪",        label:"車位面積（坪）", group:"面積",     def:false },
  { key:"總價_萬元",                label:"總價（萬）",     group:"價格",     def:true,  sort:"total_price" },
  { key:"單價_元每平方",            label:"單價（元/㎡）",  group:"價格",     def:true,  sort:"unit_price"  },
  { key:"建物單價_萬每坪",          label:"單價（萬/坪）",  group:"價格",     def:false },
  { key:"車位總價_元",              label:"車位總價（元）", group:"價格",     def:false },
  { key:"車位類別",                 label:"車位類別",       group:"車位",     def:false },
  { key:"交易標的",                 label:"交易標的",       group:"其他",     def:false },
  { key:"交易筆棟數",               label:"交易筆棟數",     group:"其他",     def:false },
  { key:"使用分區編定",             label:"使用分區",       group:"其他",     def:false },
  { key:"備註",                     label:"備註",           group:"其他",     def:false },
  { key:"移轉編號",                 label:"移轉編號",       group:"其他",     def:false },
];

const STORAGE_KEY = "lvr_visible_columns";

function loadColumnPrefs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch (_) {}
  return new Set(COLUMNS.filter(c => c.def).map(c => c.key));
}

function saveColumnPrefs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.visibleKeys]));
}

function getVisibleColumns() {
  return COLUMNS.filter(col => state.visibleKeys.has(col.key));
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  page: 1,
  limit: 20,
  total: 0,
  sortBy: "year_month",
  sortDir: "desc",
  lastRows: [],
  visibleKeys: loadColumnPrefs(),
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  buildHeader();
  await Promise.all([loadOptions(), loadDashboard()]);
  await search();

  document.getElementById("btn-search").addEventListener("click", () => { state.page = 1; search(); });
  document.getElementById("btn-clear").addEventListener("click", clearFilters);
  document.getElementById("btn-prev").addEventListener("click", () => { if (state.page > 1) { state.page--; search(); } });
  document.getElementById("btn-next").addEventListener("click", () => { if (state.page < totalPages()) { state.page++; search(); } });

  document.getElementById("filter-toggle").addEventListener("click", () => {
    document.getElementById("filter-body").classList.toggle("collapsed");
    document.getElementById("filter-chevron").classList.toggle("collapsed");
  });

  document.getElementById("page-size").addEventListener("change", e => {
    state.limit = parseInt(e.target.value, 10);
    state.page = 1;
    search();
  });

  document.getElementById("btn-studio").addEventListener("click", openStudio);
  document.getElementById("studio-overlay").addEventListener("click", closeStudio);

  document.getElementById("btn-export").addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("export-menu").classList.toggle("hidden");
  });
  document.addEventListener("click", () => {
    document.getElementById("export-menu").classList.add("hidden");
  });

  document.querySelectorAll("input").forEach(el => {
    el.addEventListener("keydown", e => { if (e.key === "Enter") { state.page = 1; search(); } });
  });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json();
    renderDashboard(data);
  } catch (e) {
    console.error("Failed to load dashboard", e);
  }
}

function renderDashboard(data) {
  const total = data.total || 0;

  document.getElementById("dash-total").textContent = total.toLocaleString();

  const container = document.getElementById("dash-building-types");
  container.innerHTML = "";
  const entries = Object.entries(data.by_building_type || {}).sort((a, b) => b[1] - a[1]);
  const maxCount = entries[0]?.[1] || 1;

  entries.forEach(([type, count]) => {
    const pct = total > 0 ? (count / total * 100).toFixed(1) : "0.0";
    const barW = (count / maxCount * 100).toFixed(1);
    const el = document.createElement("div");
    el.className = "flex items-center gap-2 text-xs";
    el.innerHTML = `
      <span class="bar-label w-28 truncate flex-shrink-0" title="${type}">${type}</span>
      <div class="bar-track flex-1 h-1.5 min-w-[60px]">
        <div class="bg-brand-500 h-1.5 rounded-full transition-all duration-500" style="width:${barW}%"></div>
      </div>
      <span class="bar-value w-24 text-right flex-shrink-0">${count.toLocaleString()} (${pct}%)</span>
    `;
    container.appendChild(el);
  });
}

// ── Load dropdown options ─────────────────────────────────────────────────────
async function loadOptions() {
  try {
    const res = await fetch("/api/options");
    const data = await res.json();

    fillSelect("f-district", data.districts);
    fillSelect("f-building-type", data.building_types);

    if (data.last_import) {
      const d = new Date(data.last_import);
      document.getElementById("last-update").textContent =
        `最後更新：${d.toLocaleDateString("zh-TW")} ${d.toLocaleTimeString("zh-TW")}`;
    } else {
      document.getElementById("last-update").textContent = "尚無資料";
    }
  } catch (e) {
    console.error("Failed to load options", e);
  }
}

function fillSelect(id, items) {
  const sel = document.getElementById(id);
  items.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
async function search() {
  setLoading(true);

  const params = new URLSearchParams();
  params.set("page", state.page);
  params.set("limit", state.limit);
  params.set("sort_by", state.sortBy);
  params.set("sort_dir", state.sortDir);

  const add = (id, key) => {
    const val = document.getElementById(id)?.value?.trim();
    if (val) params.set(key, val);
  };

  updateFilterBadge();

  add("f-district", "district");
  add("f-year", "year");
  add("f-month", "month");
  add("f-community", "community");
  add("f-building-type", "building_type");
  add("f-min-price", "min_price");
  add("f-max-price", "max_price");
  add("f-min-unit", "min_unit_price");
  add("f-max-unit", "max_unit_price");
  add("f-bedrooms", "bedrooms");
  add("f-bathrooms", "bathrooms");

  try {
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    state.total = data.total;
    renderTable(data.data);
    renderPagination();
    document.getElementById("btn-export").disabled = state.total === 0;
  } catch (e) {
    console.error("Search failed", e);
  } finally {
    setLoading(false);
  }
}

// ── Column Studio ─────────────────────────────────────────────────────────────
function openStudio() {
  renderStudioGroups();
  document.getElementById("studio-overlay").classList.remove("hidden");
  document.getElementById("studio-panel").classList.add("open");
}

function closeStudio() {
  document.getElementById("studio-overlay").classList.add("hidden");
  document.getElementById("studio-panel").classList.remove("open");
}

function renderStudioGroups() {
  const groups = {};
  COLUMNS.forEach(col => {
    if (!groups[col.group]) groups[col.group] = [];
    groups[col.group].push(col);
  });

  const container = document.getElementById("studio-groups");
  container.innerHTML = "";

  Object.entries(groups).forEach(([groupName, cols]) => {
    const section = document.createElement("div");
    section.className = "mb-5";

    const hdr = document.createElement("div");
    hdr.className = "studio-group-hdr";
    hdr.textContent = groupName;
    section.appendChild(hdr);

    cols.forEach(col => {
      const visible = state.visibleKeys.has(col.key);
      const label = document.createElement("label");
      label.className = "studio-item";
      label.innerHTML = `
        <input type="checkbox" class="w-3.5 h-3.5 accent-indigo-500 cursor-pointer flex-shrink-0"
               data-key="${col.key}" ${visible ? "checked" : ""}>
        <span class="${visible ? "studio-lbl-on" : "studio-lbl-off"}">${col.label}</span>
      `;
      const cb = label.querySelector("input");
      const span = label.querySelector("span");
      cb.addEventListener("change", e => {
        toggleColumn(col.key, e.target.checked);
        span.className = e.target.checked ? "studio-lbl-on" : "studio-lbl-off";
      });
      section.appendChild(label);
    });

    container.appendChild(section);
  });
}

function toggleColumn(key, visible) {
  if (visible) {
    state.visibleKeys.add(key);
  } else {
    if (state.visibleKeys.size <= 1) return;
    state.visibleKeys.delete(key);
  }
  saveColumnPrefs();
  buildHeader();
  if (state.lastRows.length) renderTable(state.lastRows);
}

function resetColumns() {
  state.visibleKeys = new Set(COLUMNS.filter(c => c.def).map(c => c.key));
  saveColumnPrefs();
  buildHeader();
  if (state.lastRows.length) renderTable(state.lastRows);
  renderStudioGroups();
}

function selectAllColumns() {
  state.visibleKeys = new Set(COLUMNS.map(c => c.key));
  saveColumnPrefs();
  buildHeader();
  if (state.lastRows.length) renderTable(state.lastRows);
  renderStudioGroups();
}

// ── Export ────────────────────────────────────────────────────────────────────
async function exportData(format) {
  document.getElementById("export-menu").classList.add("hidden");

  if (state.total > 50000) {
    if (!confirm(`共 ${state.total.toLocaleString()} 筆，資料量較大，確定匯出？`)) return;
  }

  const btn = document.getElementById("btn-export");
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "匯出中…";

  try {
    const params = new URLSearchParams();
    const add = (id, key) => {
      const val = document.getElementById(id)?.value?.trim();
      if (val) params.set(key, val);
    };

    add("f-district", "district");
    add("f-year-from", "year_from");
    add("f-month-from", "month_from");
    add("f-year-to", "year_to");
    add("f-month-to", "month_to");
    add("f-community", "community");
    add("f-building-type", "building_type");

    const minP = document.getElementById("f-min-price")?.value?.trim();
    const maxP = document.getElementById("f-max-price")?.value?.trim();
    if (minP) params.set("min_price", parseInt(minP, 10) * 10000);
    if (maxP) params.set("max_price", parseInt(maxP, 10) * 10000);

    add("f-min-unit", "min_unit_price");
    add("f-max-unit", "max_unit_price");
    add("f-bedrooms", "bedrooms");
    add("f-bathrooms", "bathrooms");

    params.set("sort_by", state.sortBy);
    params.set("sort_dir", state.sortDir);

    const res = await fetch(`/api/export?${params}`);
    if (!res.ok) throw new Error("fetch failed");
    const { data } = await res.json();

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `實價登錄_${dateStr}`;

    if (format === "csv") {
      const headers = Object.keys(data[0] || {});
      const escape = v => {
        const s = v == null ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows = [headers.join(","), ...data.map(r => headers.map(h => escape(r[h])).join(","))];
      const blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      triggerDownload(blob, `${filename}.csv`);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "實價登錄");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
  } catch (_) {
    alert("匯出失敗，請稍後再試");
  } finally {
    btn.disabled = state.total === 0;
    btn.innerHTML = originalHTML;
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Render ────────────────────────────────────────────────────────────────────
function buildHeader() {
  const thead = document.getElementById("result-head");
  const tr = document.createElement("tr");
  tr.className = "th-row text-left text-xs uppercase tracking-wider";

  getVisibleColumns().forEach(col => {
    const th = document.createElement("th");
    th.className = "th-cell px-3 py-3 whitespace-nowrap";
    th.textContent = col.label;
    if (col.sort) {
      th.dataset.sort = col.sort;
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        if (state.sortBy === col.sort) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortBy = col.sort;
          state.sortDir = "desc";
        }
        state.page = 1;
        updateSortHeaders();
        search();
      });
    }
    tr.appendChild(th);
  });

  thead.innerHTML = "";
  thead.appendChild(tr);
  updateSortHeaders();
}

function renderTable(rows) {
  state.lastRows = rows;
  const tbody = document.getElementById("result-body");
  const empty = document.getElementById("empty");
  tbody.innerHTML = "";

  if (!rows.length) {
    empty.classList.remove("hidden");
    document.getElementById("total-count").textContent = "0";
    return;
  }
  empty.classList.add("hidden");
  document.getElementById("total-count").textContent = state.total.toLocaleString();

  const visibleCols = getVisibleColumns();
  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.className = "row-hover";
    tr.innerHTML = visibleCols.map(col => renderCell(col, r)).join("");
    tbody.appendChild(tr);
  });
}

function renderCell(col, r) {
  switch (col.key) {
    case "鄉鎮市區":   return `<td class="px-3 py-3 cell-secondary whitespace-nowrap">${r.鄉鎮市區 ?? "—"}</td>`;
    case "區段":       return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.區段 ?? "—"}</td>`;
    case "交易年月":   return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${formatYearMonth(r.交易年月)}</td>`;
    case "社區案名":   return `<td class="px-3 py-3 cell-primary cell-name max-w-[160px] truncate" title="${r.社區案名 ?? ''}">${r.社區案名 ?? "—"}</td>`;
    case "來源檔案":   return `<td class="px-3 py-3"><span class="${r.來源檔案 === 'a' ? 'tag-a' : 'tag-b'}">${r.來源檔案 === 'a' ? '買賣' : '預售'}</span></td>`;
    case "土地區段位置建物區段門牌": return `<td class="px-3 py-3 cell-muted max-w-[180px] truncate" title="${r.土地區段位置建物區段門牌 ?? ''}">${r.土地區段位置建物區段門牌 ?? "—"}</td>`;
    case "棟別":           return `<td class="px-3 py-3 cell-muted">${r.棟別 ?? "—"}</td>`;
    case "移轉層次":       return `<td class="px-3 py-3 cell-muted">${r.移轉層次 ?? "—"}</td>`;
    case "總樓層數":       return `<td class="px-3 py-3 cell-muted">${r.總樓層數 ?? "—"}</td>`;
    case "建物型態":       return `<td class="px-3 py-3 cell-secondary">${r.建物型態 ?? "—"}</td>`;
    case "主要用途":       return `<td class="px-3 py-3 cell-muted">${r.主要用途 ?? "—"}</td>`;
    case "主要建材":       return `<td class="px-3 py-3 cell-muted">${r.主要建材 ?? "—"}</td>`;
    case "建築完成年月":   return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${formatYearMonth(r.建築完成年月)}</td>`;
    case "電梯":           return `<td class="px-3 py-3 cell-muted">${r.電梯 ?? "—"}</td>`;
    case "有無管理組織":   return `<td class="px-3 py-3 cell-muted">${r.有無管理組織 ?? "—"}</td>`;
    case "格局":           return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${formatLayout(r)}</td>`;
    case "格局_隔間":      return `<td class="px-3 py-3 cell-muted">${r.格局_隔間 ?? "—"}</td>`;
    case "建物移轉總面積_坪":     return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.建物移轉總面積_坪 != null ? r.建物移轉總面積_坪.toFixed(2) : "—"}</td>`;
    case "建物移轉不含車面積_坪": return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.建物移轉不含車面積_坪 != null ? r.建物移轉不含車面積_坪.toFixed(2) : "—"}</td>`;
    case "主建物面積":            return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.主建物面積 != null ? r.主建物面積.toFixed(2) : "—"}</td>`;
    case "附屬建物面積":          return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.附屬建物面積 != null ? r.附屬建物面積.toFixed(2) : "—"}</td>`;
    case "陽台面積":              return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.陽台面積 != null ? r.陽台面積.toFixed(2) : "—"}</td>`;
    case "土地移轉總面積_坪":     return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.土地移轉總面積_坪 != null ? r.土地移轉總面積_坪.toFixed(2) : "—"}</td>`;
    case "車位移轉總面積_坪":     return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.車位移轉總面積_坪 != null ? r.車位移轉總面積_坪.toFixed(2) : "—"}</td>`;
    case "總價_萬元":         return `<td class="px-3 py-3 cell-price whitespace-nowrap">${formatPrice(r.總價_萬元)}</td>`;
    case "單價_元每平方":     return `<td class="px-3 py-3 cell-unit whitespace-nowrap">${formatUnitPrice(r.單價_元每平方)}</td>`;
    case "建物單價_萬每坪":   return `<td class="px-3 py-3 cell-subprice whitespace-nowrap">${r.建物單價_萬每坪 != null ? r.建物單價_萬每坪.toFixed(2) : "—"}</td>`;
    case "車位總價_元":       return `<td class="px-3 py-3 cell-muted whitespace-nowrap">${r.車位總價_元 != null ? r.車位總價_元.toLocaleString() : "—"}</td>`;
    case "車位類別":          return `<td class="px-3 py-3 cell-muted">${r.車位類別 ?? "—"}</td>`;
    case "交易標的":          return `<td class="px-3 py-3 cell-muted">${r.交易標的 ?? "—"}</td>`;
    case "交易筆棟數":        return `<td class="px-3 py-3 cell-muted">${r.交易筆棟數 ?? "—"}</td>`;
    case "使用分區編定":      return `<td class="px-3 py-3 cell-muted">${r.使用分區編定 ?? "—"}</td>`;
    case "備註":              return `<td class="px-3 py-3 cell-muted max-w-[160px] truncate" title="${r.備註 ?? ''}">${r.備註 ?? "—"}</td>`;
    case "移轉編號":          return `<td class="px-3 py-3 cell-faint text-xs">${r.移轉編號 ?? "—"}</td>`;
    default: return `<td class="px-3 py-3 cell-muted">—</td>`;
  }
}

function renderPagination() {
  const pages = totalPages();
  document.getElementById("page-info").textContent =
    state.total ? `第 ${state.page} 頁，共 ${pages} 頁` : "";
  document.getElementById("pagination-info").textContent =
    state.total ? `顯示第 ${(state.page - 1) * state.limit + 1}–${Math.min(state.page * state.limit, state.total)} 筆` : "";

  document.getElementById("btn-prev").disabled = state.page <= 1;
  document.getElementById("btn-next").disabled = state.page >= pages;
}

function updateSortHeaders() {
  document.querySelectorAll("#result-head th[data-sort]").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sort === state.sortBy) {
      th.classList.add(state.sortDir === "asc" ? "sort-asc" : "sort-desc");
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function totalPages() {
  return Math.max(1, Math.ceil(state.total / state.limit));
}

function setLoading(on) {
  document.getElementById("loading").classList.toggle("hidden", !on);
  document.getElementById("result-table").classList.toggle("hidden", on);
}

function updateFilterBadge() {
  const ids = ["f-district","f-building-type","f-year","f-month","f-community",
    "f-min-price","f-max-price","f-min-unit","f-max-unit","f-bedrooms","f-bathrooms"];
  const count = ids.filter(id => (document.getElementById(id)?.value?.trim() || "") !== "").length;
  const badge = document.getElementById("filter-badge");
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function clearFilters() {
  ["f-district", "f-building-type"].forEach(id => document.getElementById(id).value = "");
  ["f-year", "f-month", "f-community", "f-min-price", "f-max-price",
   "f-min-unit", "f-max-unit", "f-bedrooms", "f-bathrooms"].forEach(id => {
    document.getElementById(id).value = "";
  });
  state.page = 1;
  search();
}

function formatYearMonth(val) {
  if (!val || val.length < 5) return val ?? "—";
  const y = val.slice(0, 3);
  const m = val.slice(3, 5);
  return `${y}年${m}月`;
}

function formatPrice(val) {
  if (val == null) return "—";
  return val >= 10000
    ? `${(val / 10000).toFixed(0)} 億`
    : `${Math.round(val).toLocaleString()} 萬`;
}

function formatUnitPrice(val) {
  if (val == null) return "—";
  return `${Math.round(val).toLocaleString()}`;
}

function formatLayout(r) {
  const parts = [];
  if (r.格局_房 != null) parts.push(`${r.格局_房}房`);
  if (r.格局_廳 != null) parts.push(`${r.格局_廳}廳`);
  if (r.格局_衛 != null) parts.push(`${r.格局_衛}衛`);
  return parts.length ? parts.join("") : "—";
}
