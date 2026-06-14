# Chart Export API — Design Spec

**Date:** 2026-06-02
**Status:** Approved

## Problem

The dashboard charts rely on Chart.js with hover-only tooltips. When users screenshot or export charts for use in PowerPoint presentations, numerical values are invisible. External programs that generate PPT slides also have no way to programmatically download chart images.

## Goal

Add a Flask API that renders each chart as a PPT-ready PNG image (1280×720, white background, data labels always visible), accessible via HTTP GET so any external PPT-generating program can download them directly.

---

## Architecture

A new module `backend/chart_exporter.py` handles all matplotlib rendering. `backend/api.py` gains new routes that query SQLite, call the exporter, and return PNG bytes. The existing Chart.js frontend is unchanged.

```text
backend/
├── api.py              ← add /api/charts/export/... routes
├── chart_exporter.py   ← NEW: matplotlib rendering functions
├── importer.py
├── db.py
└── schema.sql
```

Data flow:

```text
GET /api/charts/export/department-trend?month=2026-04
  → api.py queries SQLite for chart data
  → chart_exporter.py renders matplotlib figure
  → returns PNG bytes (Content-Type: image/png)
```

---

## API Endpoints

All endpoints accept the following optional query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `month` | latest available | e.g. `2026-04` |
| `billing_group` | all groups combined | e.g. `AI` to filter to one group |

### Individual chart endpoints

| Endpoint | Chart | Type |
|----------|-------|------|
| `GET /api/charts/export/department-trend` | 部門費用趨勢 | Line chart |
| `GET /api/charts/export/top-projects` | Top 7 專案成長 | Horizontal bar chart |
| `GET /api/charts/export/by-cost-center` | 費用分布 by 成本中心 | Pie chart |
| `GET /api/charts/export/by-section` | 費用分布 by 處室 | Pie chart |
| `GET /api/charts/export/by-category` | 費用分布 by 類別 | Pie chart |
| `GET /api/charts/export/shared-infra` | Shared Infra 服務分布 | Horizontal bar chart |

### Bulk download

| Endpoint | Description |
|----------|-------------|
| `GET /api/charts/export/all.zip` | All 6 charts as a ZIP archive, filenames in English |

---

## chart_exporter.py — Module Design

One public function per chart, each with the signature:

```python
def render_<chart_name>(data: dict, **kwargs) -> bytes:
    """Returns PNG bytes."""
```

A shared `_apply_ppt_style(fig, ax)` helper sets all PPT defaults (figure size, fonts, background, grid) so individual functions only handle data-specific layout.

**Public functions:**

- `render_department_trend(data)`
- `render_top_projects(data)`
- `render_by_cost_center(data)`
- `render_by_section(data)`
- `render_by_category(data)`
- `render_shared_infra(data)`

---

## PPT-Ready Chart Style

Every exported chart uses these settings:

| Property | Value |
|----------|-------|
| Figure size | 1280×720px @ 96 DPI (16:9) |
| Background | White (`#FFFFFF`) |
| Title font size | 18pt, bold |
| Axis label font size | 13pt |
| Data label font size | 11pt |
| Number format | `$1,234萬` (TWD, rounded to 萬) |
| Primary color | Cathay Bank blue `#003087` |
| Chinese font | 微軟正黑體 (Windows) / Noto Sans TC (fallback) |
| Grid | Light horizontal lines only (`#E5E7EB`, alpha 0.5) |

**Pie chart extras:** Each slice shows name + percentage + TWD amount as three lines, rendered outside the slice with leader lines. Slices under 3% are grouped into "其他".

**Line/bar chart extras:** Data labels rendered directly above each point/bar. Y-axis tick labels use 萬 unit. Legend placed inside figure top-right.

---

## Error Handling

| Situation | Response |
|-----------|----------|
| No data for requested month/group | `404 {"error": "no data for month=YYYY-MM"}` |
| Unknown chart name | `404 {"error": "unknown chart"}` |
| Font not available | Falls back silently to DejaVu Sans (ASCII only) |
| Rendering failure | `500 {"error": "render failed", "detail": "..."}` |

---

## Dependencies

Add to requirements (or install directly):

```text
matplotlib>=3.7
```

No other new dependencies. `zipfile` is stdlib.

---

## Out of Scope

- SVG export format
- Authentication / API keys on the export endpoints
- Caching rendered images to disk
- The PPT-generating program itself
