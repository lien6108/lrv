# Export Filtered Results — Design Spec

**Date:** 2026-05-31
**Status:** Approved

## Overview

Add an export button to the query results page that lets users download the currently filtered dataset as CSV or XLSX. The export respects all active filter conditions but always includes all 34 database columns regardless of the Studio column visibility settings.

## Architecture

Pure client-side approach. The existing `/api/export` Cloudflare Worker endpoint already accepts the same filter params as `/api/transactions` and returns JSON with Chinese column headers and up to 100,000 rows. No backend changes are needed.

- **CSV:** Native JS string building — no library dependency. UTF-8 BOM prepended so Excel opens the file without Chinese character encoding issues.
- **XLSX:** SheetJS (xlsx.js) loaded from CDN via a `<script>` tag in `<head>`. Conversion via `XLSX.utils.json_to_sheet()` → `XLSX.writeFile()`.

## UI

A **「匯出 ▾」** dropdown button placed in the toolbar next to the existing「欄位設定」button. Clicking it opens a two-item menu:

```
[ 欄位設定 ]  [ 匯出 ▾ ]
                ┌──────────────┐
                │ 匯出 CSV     │
                │ 匯出 XLSX    │
                └──────────────┘
```

Button states:
- **Disabled (grey)** when `state.total === 0` — no data to export.
- **「匯出中…」+ disabled** while the fetch and conversion are in progress — prevents duplicate triggers.
- **Normal** once the download is initiated or on error.

## Data Flow

1. User applies filters → clicks search → paginated results appear.
2. User clicks 「匯出 ▾」 → selects CSV or XLSX.
3. If `state.total > 50000`, show `confirm()` dialog: _「共 X 筆，資料量較大，確定匯出？」_. Cancel aborts.
4. Frontend calls `/api/export?{same filter params}` (omitting `page`, `limit`).
5. Worker returns `{ total, data: [...] }` — all matching rows, all 34 columns, Chinese keys.
6. Frontend converts the `data` array to the chosen format and triggers `<a download>`.

## File Naming

| Format | Filename |
|--------|----------|
| CSV  | `實價登錄_YYYYMMDD.csv`  |
| XLSX | `實價登錄_YYYYMMDD.xlsx` |

Date is derived from `new Date()` at download time, formatted as eight digits (e.g., `20260531`).

## Error Handling

| Situation | Behaviour |
|-----------|-----------|
| 0 results | Button disabled; no action possible |
| > 50,000 rows | `confirm()` warning before fetch |
| Network / fetch error | `alert('匯出失敗，請稍後再試')`, button restores to normal |
| SheetJS not yet loaded | XLSX conversion deferred until `script.onload` — no race condition |

## Files Changed

| File | Change |
|------|--------|
| `public/index.html` | Add SheetJS `<script>` tag; add export dropdown button HTML |
| `static/index.html` | Same as above (mirrored file) |
| `public/app.js` | Add `exportData(format)` function; wire up dropdown events |
| `static/app.js` | Same as above (mirrored file) |

No changes to `src/index.js` or any backend file.

## Out of Scope

- Exporting only visible columns (Studio settings do not affect export).
- Server-side file generation.
- Streaming / chunked download for very large datasets.
