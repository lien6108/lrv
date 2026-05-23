const state = {
  page: 1,
  limit: 20,
  total: 0,
  sortBy: "year_month",
  sortDir: "desc",
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadOptions();
  await search();

  document.getElementById("btn-search").addEventListener("click", () => { state.page = 1; search(); });
  document.getElementById("btn-clear").addEventListener("click", clearFilters);
  document.getElementById("btn-prev").addEventListener("click", () => { if (state.page > 1) { state.page--; search(); } });
  document.getElementById("btn-next").addEventListener("click", () => { if (state.page < totalPages()) { state.page++; search(); } });

  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.sort;
      if (state.sortBy === col) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = col;
        state.sortDir = "desc";
      }
      state.page = 1;
      updateSortHeaders();
      search();
    });
  });

  // Enter key on any input triggers search
  document.querySelectorAll("input").forEach(el => {
    el.addEventListener("keydown", e => { if (e.key === "Enter") { state.page = 1; search(); } });
  });
});

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
  } catch (e) {
    console.error("Search failed", e);
  } finally {
    setLoading(false);
  }
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderTable(rows) {
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

  rows.forEach(r => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-800/50 transition-colors";
    tr.innerHTML = `
      <td class="px-3 py-3 text-gray-300">${r.鄉鎮市區 ?? "—"}</td>
      <td class="px-3 py-3 text-gray-400">${formatYearMonth(r.交易年月)}</td>
      <td class="px-3 py-3 text-white font-medium max-w-[160px] truncate" title="${r.社區案名 ?? ""}">${r.社區案名 ?? "—"}</td>
      <td class="px-3 py-3 text-gray-300">${r.建物型態 ?? "—"}</td>
      <td class="px-3 py-3 text-gray-400">${formatLayout(r)}</td>
      <td class="px-3 py-3 text-emerald-400 font-semibold">${formatPrice(r.總價_萬元)}</td>
      <td class="px-3 py-3 text-blue-400">${formatUnitPrice(r.單價_元每平方)}</td>
      <td class="px-3 py-3 text-gray-400">${r.建物移轉總面積_坪 ? r.建物移轉總面積_坪.toFixed(2) : "—"}</td>
      <td class="px-3 py-3"><span class="${r.來源檔案 === "a" ? "tag-a" : "tag-b"}">${r.來源檔案 === "a" ? "買賣" : "預售"}</span></td>
    `;
    tbody.appendChild(tr);
  });
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
  document.querySelectorAll("th[data-sort]").forEach(th => {
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
