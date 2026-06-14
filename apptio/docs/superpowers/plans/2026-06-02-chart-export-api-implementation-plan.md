# Chart Export API — Implementation Plan

**Date:** 2026-06-02
**Spec:** [2026-06-02-chart-export-api-design.md](../specs/2026-06-02-chart-export-api-design.md)

---

## Phase 1 — Setup & Shared Infrastructure

### Step 1.1 — Install matplotlib

```bash
pip install "matplotlib>=3.7"
```

Add to `requirements.txt` (create if it doesn't exist):

```
flask
openpyxl
matplotlib>=3.7
```

### Step 1.2 — Create `backend/chart_exporter.py` skeleton

Create the file with:
- `_get_font()` — detects 微軟正黑體 on Windows, falls back to DejaVu Sans
- `_apply_ppt_style(fig, ax)` — sets figure size 1280×720 @ 96 DPI, white background, font sizes, grid
- `_fmt_wan(value)` — formats TWD number as `$1,234萬` string
- `_png_bytes(fig)` — renders figure to `io.BytesIO`, returns bytes, closes figure

No chart functions yet — just the helpers.

### Step 1.3 — Verify helpers work

Quick sanity check: create a blank 1280×720 figure using `_apply_ppt_style`, call `_png_bytes`, confirm it returns non-empty bytes.

---

## Phase 2 — Implement Chart Renderers (one at a time)

### Step 2.1 — `render_department_trend(data)`

- Input: `data = {"labels": [...months], "datasets": [{"label": dept, "values": [...TWD]}]}`
- Line chart, one line per department
- Data labels at each point (value above the point, `_fmt_wan`)
- Legend top-right inside axes
- X-axis: month labels, rotated 30°

### Step 2.2 — `render_top_projects(data)`

- Input: `data = {"projects": [...], "current": [...TWD], "previous": [...TWD]}`
- Horizontal bar chart, two bars per project (current month blue, previous month grey)
- Data labels at end of each bar
- Y-axis: project names (truncate to 20 chars if needed)

### Step 2.3 — `render_by_cost_center(data)` / `render_by_section(data)` / `render_by_category(data)`

All three share the same pie chart renderer. Implement one private `_render_pie(data, title)` function, then wrap:

```python
def render_by_cost_center(data): return _render_pie(data, "費用分布 — 成本中心")
def render_by_section(data):     return _render_pie(data, "費用分布 — 處室")
def render_by_category(data):    return _render_pie(data, "費用分布 — 類別")
```

Pie details:
- Slices < 3% grouped into "其他"
- Each slice label: `{name}\n{pct:.1f}%\n{_fmt_wan(value)}` outside with leader line (`autopct` off, use `ax.annotate`)
- Cathay blue `#003087` as first color, then a curated high-contrast palette

### Step 2.4 — `render_shared_infra(data)`

- Input: `data = {"services": [...], "costs": [...TWD]}`
- Horizontal bar chart, single series
- Data labels at end of each bar
- Sorted descending by cost

---

## Phase 3 — Flask Routes

### Step 3.1 — Add data-fetching helpers to `api.py`

Add private functions that query SQLite and return the dict shape each renderer expects:

| Helper | SQL focus |
|--------|-----------|
| `_query_department_trend(month, billing_group)` | billing_summary grouped by department × month |
| `_query_top_projects(month, billing_group)` | top 7 projects by TWD, current + previous month |
| `_query_distribution(month, billing_group, group_by)` | billing_line_item grouped by cost_center / section / category |
| `_query_shared_infra(month, billing_group)` | billing_line_item where category='shared_infra' grouped by service |

### Step 3.2 — Add individual export routes

Register a Blueprint `export_bp` in `api.py`:

```python
@export_bp.route("/api/charts/export/<chart_name>")
def export_chart(chart_name):
    month = request.args.get("month")          # None → latest
    billing_group = request.args.get("billing_group")  # None → all
    ...
```

Route dispatches `chart_name` to the correct `_query_*` + `render_*` pair, returns:
```python
return Response(png_bytes, mimetype="image/png")
```

Returns 404 JSON for unknown `chart_name` or no data; 500 JSON on render failure.

### Step 3.3 — Add `/api/charts/export/all.zip` route

Render all 6 charts, pack into `zipfile.ZipFile` in memory, return:
```python
return Response(zip_bytes, mimetype="application/zip",
                headers={"Content-Disposition": "attachment; filename=charts.zip"})
```

---

## Phase 4 — Testing

### Step 4.1 — Manual smoke test (each chart)

Start `python backend/api.py`, then curl each endpoint:

```bash
curl "http://localhost:5000/api/charts/export/department-trend" -o dept.png
curl "http://localhost:5000/api/charts/export/top-projects" -o top7.png
curl "http://localhost:5000/api/charts/export/by-cost-center" -o pie1.png
curl "http://localhost:5000/api/charts/export/by-section" -o pie2.png
curl "http://localhost:5000/api/charts/export/by-category" -o pie3.png
curl "http://localhost:5000/api/charts/export/shared-infra" -o infra.png
curl "http://localhost:5000/api/charts/export/all.zip" -o charts.zip
```

Open each PNG, confirm:
- [ ] 1280×720 resolution
- [ ] All data labels visible (no hover needed)
- [ ] Chinese characters render correctly
- [ ] White background

### Step 4.2 — Edge-case tests

```bash
# Unknown chart name → 404
curl -i "http://localhost:5000/api/charts/export/nonexistent"

# Specific month filter
curl "http://localhost:5000/api/charts/export/top-projects?month=2026-03" -o top7_march.png

# Specific billing group
curl "http://localhost:5000/api/charts/export/department-trend?billing_group=AI" -o dept_ai.png
```

---

## File Checklist

| File | Action |
|------|--------|
| `requirements.txt` | Create / update — add `matplotlib>=3.7` |
| `backend/chart_exporter.py` | Create new |
| `backend/api.py` | Add export Blueprint + routes |

---

## Order of Implementation

1. Step 1.1 — 1.3 (setup + helpers)
2. Step 2.1 (department trend line chart — simplest multi-series)
3. Step 3.1 — 3.2 (Flask routes for that one chart, smoke test it)
4. Step 2.2 (top projects bar chart)
5. Step 2.3 (pie charts × 3)
6. Step 2.4 (shared infra bar chart)
7. Step 3.3 (all.zip endpoint)
8. Step 4.1 — 4.2 (full smoke test)
