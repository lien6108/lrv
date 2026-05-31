# Export Filtered Results — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-05-31-export-filtered-results-design.md`
**Date:** 2026-05-31

## Overview

Add CSV/XLSX export to the query results page. Pure client-side: existing `/api/export` endpoint returns JSON; frontend converts and downloads. No backend changes.

Files touched: `public/index.html`, `static/index.html`, `public/app.js`, `static/app.js`.

---

## Step 1 — Add SheetJS CDN to HTML `<head>`

**File:** `public/index.html` and `static/index.html`

Add before the closing `</head>` tag:

```html
<script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
```

This loads SheetJS globally as `XLSX`.

---

## Step 2 — Add export dropdown button HTML

**File:** `public/index.html` and `static/index.html`

In the toolbar row that already contains `#btn-studio` (around line 302–310), add the export dropdown **before** the 欄位設定 button:

```html
<!-- Export dropdown -->
<div class="relative" id="export-dropdown-container">
  <button id="btn-export"
    class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    disabled>
    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    匯出 ▾
  </button>
  <div id="export-menu"
    class="hidden absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1">
    <button onclick="exportData('csv')"
      class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
      匯出 CSV
    </button>
    <button onclick="exportData('xlsx')"
      class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
      匯出 XLSX
    </button>
  </div>
</div>
```

---

## Step 3 — Wire up dropdown toggle in app.js

**File:** `public/app.js` (then mirror to `static/app.js`)

In the `DOMContentLoaded` block, add:

```js
document.getElementById("btn-export").addEventListener("click", e => {
  e.stopPropagation();
  document.getElementById("export-menu").classList.toggle("hidden");
});
document.addEventListener("click", () => {
  document.getElementById("export-menu").classList.add("hidden");
});
```

---

## Step 4 — Enable/disable export button based on results

**File:** `public/app.js`

In the `search()` function, after `state.total` is set, add:

```js
document.getElementById("btn-export").disabled = state.total === 0;
```

---

## Step 5 — Add `exportData(format)` function

**File:** `public/app.js`

Add after the `resetColumns()` / `selectAllColumns()` block:

```js
async function exportData(format) {
  document.getElementById("export-menu").classList.add("hidden");

  if (state.total > 50000) {
    if (!confirm(`共 ${state.total.toLocaleString()} 筆，資料量較大，確定匯出？`)) return;
  }

  const btn = document.getElementById("btn-export");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.textContent = "匯出中…";

  try {
    // Build same filter params as search(), without page/limit
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
    btn.innerHTML = originalText;
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
```

---

## Step 6 — Mirror changes to `static/`

After all changes are confirmed working in `public/`:
- Apply identical changes to `static/index.html`
- Apply identical changes to `static/app.js`

---

## Step 7 — Manual smoke test

1. Load the page, verify export button is disabled initially.
2. Run a search with results → button enables.
3. Click 匯出 ▾ → menu opens; click elsewhere → menu closes.
4. Export CSV → file downloads, open in Excel, verify Chinese headers and no garbled text.
5. Export XLSX → file downloads, open in Excel, verify Chinese headers and sheet name.
6. Clear filters → search returns 0 results → button disabled again.
7. (Optional) Set a filter that returns > 50,000 rows → confirm dialog appears.

---

## Step 8 — Commit and deploy

```bash
git add public/index.html public/app.js static/index.html static/app.js
git commit -m "feat: add CSV/XLSX export for filtered results"
npx wrangler deploy
git push origin main
```
