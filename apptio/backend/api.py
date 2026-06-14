"""
GCP Billing Dashboard — Flask API
Run: cd backend && python api.py
Then open http://localhost:5000
"""
import io
import sys
import zipfile
from pathlib import Path

try:
    from flask import Flask, jsonify, request, send_from_directory, Response
except ImportError:
    print("Flask not found. Run: pip install flask", file=sys.stderr)
    sys.exit(1)

try:
    import chart_exporter
except ImportError:
    chart_exporter = None

from db import get_connection

DB_PATH = str(Path(__file__).parent / "billing.db")
FRONTEND_DIR = str(Path(__file__).parent.parent / "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR)


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/api/filters")
def filters():
    with get_connection(DB_PATH) as conn:
        groups = [
            r[0]
            for r in conn.execute(
                "SELECT DISTINCT billing_group FROM billing_file ORDER BY billing_group"
            ).fetchall()
        ]
        months = [
            r[0]
            for r in conn.execute(
                "SELECT DISTINCT billing_year_month FROM billing_file"
                " ORDER BY billing_year_month DESC"
            ).fetchall()
        ]
    return jsonify({"billing_groups": groups, "billing_year_months": months})


@app.route("/api/summary")
def summary():
    with get_connection(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT
                bf.billing_group,
                bf.billing_year_month,
                bs.gcp_usage_total_usd,
                bs.partner_usage_total_usd,
                bs.exchange_rate,
                bs.total_payable_twd
            FROM billing_summary bs
            JOIN billing_file bf ON bs.billing_file_id = bf.id
            ORDER BY bf.billing_year_month DESC, bf.billing_group
            """
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/line-items")
def line_items():
    billing_group = request.args.get("billing_group", "")
    billing_year_month = request.args.get("billing_year_month", "")
    project_id = request.args.get("project_id", "")
    page = max(1, int(request.args.get("page", 1)))
    page_size = min(200, max(10, int(request.args.get("page_size", 50))))

    conditions, params = [], []
    if billing_group:
        conditions.append("bf.billing_group = ?")
        params.append(billing_group)
    if billing_year_month:
        conditions.append("bf.billing_year_month = ?")
        params.append(billing_year_month)
    if project_id:
        conditions.append("li.project_id LIKE ?")
        params.append(f"%{project_id}%")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    offset = (page - 1) * page_size

    with get_connection(DB_PATH) as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM billing_line_item li"
            f" JOIN billing_file bf ON li.billing_file_id = bf.id {where}",
            params,
        ).fetchone()[0]

        rows = conn.execute(
            f"""
            SELECT
                bf.billing_group,
                bf.billing_year_month,
                li.project_id,
                li.project_name,
                li.service_description,
                li.sku_description,
                li.usage_start_date,
                li.usage_end_date,
                li.usage_amount,
                li.usage_unit,
                li.google_cost,
                li.partner_cost,
                li.total_discount
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            {where}
            ORDER BY bf.billing_year_month DESC, li.partner_cost DESC
            LIMIT ? OFFSET ?
            """,
            params + [page_size, offset],
        ).fetchall()

    return jsonify(
        {
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size),
            "data": [dict(r) for r in rows],
        }
    )


@app.route("/api/charts")
def charts():
    with get_connection(DB_PATH) as conn:
        latest_month = conn.execute(
            "SELECT MAX(billing_year_month) FROM billing_file"
        ).fetchone()[0]

        # 1. 每個部門近六個月花費
        dept_rows = conn.execute(
            """
            WITH recent_months AS (
                SELECT DISTINCT billing_year_month FROM billing_file
                ORDER BY billing_year_month DESC LIMIT 6
            )
            SELECT
                COALESCE(pm.department, '未分類') AS department,
                bf.billing_year_month,
                SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            JOIN recent_months rm ON bf.billing_year_month = rm.billing_year_month
            LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
            LEFT JOIN project_master pm ON li.project_id = pm.project_id
            WHERE pm.category = 'applications'
            GROUP BY department, bf.billing_year_month
            ORDER BY bf.billing_year_month, department
            """
        ).fetchall()

        # 2. 最花錢的前七個專案近半年成長
        proj_rows = conn.execute(
            """
            WITH recent_months AS (
                SELECT DISTINCT billing_year_month FROM billing_file
                ORDER BY billing_year_month DESC LIMIT 6
            ),
            top_projects AS (
                SELECT li.project_id
                FROM billing_line_item li
                JOIN billing_file bf ON li.billing_file_id = bf.id
                JOIN recent_months rm ON bf.billing_year_month = rm.billing_year_month
                JOIN project_master pm ON li.project_id = pm.project_id
                WHERE pm.category = 'applications'
                GROUP BY li.project_id
                ORDER BY SUM(COALESCE(li.partner_cost, li.google_cost, 0)) DESC
                LIMIT 7
            )
            SELECT
                li.project_id,
                COALESCE(pm.project_name, li.project_name, li.project_id) AS project_label,
                bf.billing_year_month,
                SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            JOIN recent_months rm ON bf.billing_year_month = rm.billing_year_month
            JOIN top_projects tp ON li.project_id = tp.project_id
            LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
            LEFT JOIN project_master pm ON li.project_id = pm.project_id
            WHERE pm.category = 'applications'
            GROUP BY li.project_id, project_label, bf.billing_year_month
            ORDER BY bf.billing_year_month, li.project_id
            """
        ).fetchall()

        # 3. 各版塊本月花費 (section = 科別)
        section_rows = conn.execute(
            """
            WITH latest_month AS (
                SELECT MAX(billing_year_month) AS ym FROM billing_file
            )
            SELECT
                COALESCE(pm.section, '未分類') AS section,
                SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            JOIN latest_month lm ON bf.billing_year_month = lm.ym
            LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
            LEFT JOIN project_master pm ON li.project_id = pm.project_id
            WHERE pm.category = 'applications'
            GROUP BY section
            HAVING cost > 0
            ORDER BY cost DESC
            """
        ).fetchall()

        # 4. 成本中心本月花費 (category = applications)
        cost_center_rows = conn.execute(
            """
            WITH latest_month AS (
                SELECT MAX(billing_year_month) AS ym FROM billing_file
            )
            SELECT
                COALESCE(pm.cost_center, '未分類') AS cost_center,
                SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            JOIN latest_month lm ON bf.billing_year_month = lm.ym
            LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
            LEFT JOIN project_master pm ON li.project_id = pm.project_id
            WHERE pm.category = 'applications'
            GROUP BY cost_center
            HAVING cost > 0
            ORDER BY cost DESC
            """
        ).fetchall()

        # 5. applications 本月 vs 上月增加 > TWD 200 的系統（以 apid 為單位，加總所有環境）
        mom_surge_rows = conn.execute(
            """
            WITH two_months AS (
                SELECT billing_year_month
                FROM billing_file
                GROUP BY billing_year_month
                ORDER BY billing_year_month DESC
                LIMIT 2
            ),
            curr_month AS (SELECT MIN(billing_year_month) AS ym FROM two_months),
            prev_month AS (SELECT MAX(billing_year_month) AS ym FROM two_months),
            app_costs AS (
                SELECT
                    pm.apid,
                    MAX(COALESCE(pm.project_name, pm.apid)) AS system_name,
                    MAX(COALESCE(pm.department, '未分類'))   AS department,
                    bf.billing_year_month,
                    SUM(
                        COALESCE(li.partner_cost, li.google_cost, 0)
                        * COALESCE(bs.exchange_rate, 1)
                        * 1.05
                    ) AS cost_twd
                FROM billing_line_item li
                JOIN billing_file bf ON li.billing_file_id = bf.id
                LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
                JOIN project_master pm ON li.project_id = pm.project_id
                WHERE pm.category = 'applications'
                  AND pm.apid IS NOT NULL
                GROUP BY pm.apid, bf.billing_year_month
            )
            SELECT
                c.department,
                c.system_name,
                c.apid,
                COALESCE(p.cost_twd, 0)                    AS prev_cost,
                c.cost_twd                                  AS curr_cost,
                c.cost_twd - COALESCE(p.cost_twd, 0)        AS diff,
                (SELECT ym FROM curr_month)                  AS curr_month,
                (SELECT ym FROM prev_month)                  AS prev_month
            FROM app_costs c
            JOIN curr_month cm ON c.billing_year_month = cm.ym
            LEFT JOIN app_costs p
                ON c.apid = p.apid
                AND p.billing_year_month = (SELECT ym FROM prev_month)
            WHERE c.cost_twd - COALESCE(p.cost_twd, 0) > 200
            ORDER BY diff DESC
            """
        ).fetchall()

        # 6. shared_infra 3 月費用 by service
        shared_infra_march_rows = conn.execute(
            """
            WITH march_month AS (
                SELECT MAX(billing_year_month) AS ym
                FROM billing_file
                WHERE billing_year_month LIKE '%-03'
            )
            SELECT
                COALESCE(li.service_description, '未知服務') AS service,
                SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            JOIN march_month mm ON bf.billing_year_month = mm.ym
            LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
            JOIN project_master pm ON li.project_id = pm.project_id
            WHERE pm.category = 'shared_infra'
            GROUP BY service
            HAVING cost > 0
            ORDER BY cost DESC
            """
        ).fetchall()

        shared_infra_march_month = conn.execute(
            "SELECT MAX(billing_year_month) FROM billing_file WHERE billing_year_month LIKE '%-03'"
        ).fetchone()[0]

        # 6. 類別本月花費 (applications / shared_infra / lab+poc)
        category_rows = conn.execute(
            """
            WITH latest_month AS (
                SELECT MAX(billing_year_month) AS ym FROM billing_file
            )
            SELECT
                COALESCE(pm.category, '未分類') AS category,
                SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            JOIN latest_month lm ON bf.billing_year_month = lm.ym
            LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
            LEFT JOIN project_master pm ON li.project_id = pm.project_id
            GROUP BY category
            HAVING cost > 0
            ORDER BY cost DESC
            """
        ).fetchall()

    return jsonify(
        {
            "latest_month": latest_month,
            "dept_monthly": [dict(r) for r in dept_rows],
            "top_projects_monthly": [dict(r) for r in proj_rows],
            "section_this_month": [dict(r) for r in section_rows],
            "cost_center_this_month": [dict(r) for r in cost_center_rows],
            "mom_surge": [dict(r) for r in mom_surge_rows],
            "shared_infra_march": [dict(r) for r in shared_infra_march_rows],
            "shared_infra_march_month": shared_infra_march_month,
            "category_this_month": [dict(r) for r in category_rows],
        }
    )


# ── Chart Export API ──────────────────────────────────────────────────────────

def _resolve_month(conn, month: str | None) -> str | None:
    """Return the requested month if it exists, otherwise the latest month."""
    if month:
        exists = conn.execute(
            "SELECT 1 FROM billing_file WHERE billing_year_month = ? LIMIT 1", (month,)
        ).fetchone()
        return month if exists else None
    return conn.execute(
        "SELECT MAX(billing_year_month) FROM billing_file"
    ).fetchone()[0]


def _billing_group_filter(billing_group: str | None) -> tuple[str, list]:
    if billing_group:
        return "AND bf.billing_group = ?", [billing_group]
    return "", []


def _query_dept_trend(conn, month: str | None, billing_group: str | None) -> list[dict]:
    bg_clause, bg_params = _billing_group_filter(billing_group)
    month_clause = f"AND billing_year_month <= '{month}'" if month else ""
    rows = conn.execute(
        f"""
        WITH recent_months AS (
            SELECT DISTINCT billing_year_month FROM billing_file
            WHERE 1=1 {month_clause}
            ORDER BY billing_year_month DESC LIMIT 6
        )
        SELECT
            COALESCE(pm.department, '未分類') AS department,
            bf.billing_year_month,
            SUM(COALESCE(li.partner_cost, li.google_cost, 0)
                * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
        FROM billing_line_item li
        JOIN billing_file bf ON li.billing_file_id = bf.id
        JOIN recent_months rm ON bf.billing_year_month = rm.billing_year_month
        LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
        LEFT JOIN project_master pm ON li.project_id = pm.project_id
        WHERE pm.category = 'applications' {bg_clause}
        GROUP BY department, bf.billing_year_month
        ORDER BY bf.billing_year_month, department
        """,
        bg_params,
    ).fetchall()
    return [dict(r) for r in rows]


def _query_top_projects(conn, month: str | None, billing_group: str | None) -> list[dict]:
    bg_clause, bg_params = _billing_group_filter(billing_group)
    month_clause = f"AND billing_year_month <= '{month}'" if month else ""
    rows = conn.execute(
        f"""
        WITH recent_months AS (
            SELECT DISTINCT billing_year_month FROM billing_file
            WHERE 1=1 {month_clause}
            ORDER BY billing_year_month DESC LIMIT 6
        ),
        top_projects AS (
            SELECT li.project_id
            FROM billing_line_item li
            JOIN billing_file bf ON li.billing_file_id = bf.id
            JOIN recent_months rm ON bf.billing_year_month = rm.billing_year_month
            JOIN project_master pm ON li.project_id = pm.project_id
            WHERE pm.category = 'applications' {bg_clause}
            GROUP BY li.project_id
            ORDER BY SUM(COALESCE(li.partner_cost, li.google_cost, 0)) DESC
            LIMIT 7
        )
        SELECT
            li.project_id,
            COALESCE(pm.project_name, li.project_name, li.project_id) AS project_label,
            bf.billing_year_month,
            SUM(COALESCE(li.partner_cost, li.google_cost, 0)
                * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
        FROM billing_line_item li
        JOIN billing_file bf ON li.billing_file_id = bf.id
        JOIN recent_months rm ON bf.billing_year_month = rm.billing_year_month
        JOIN top_projects tp ON li.project_id = tp.project_id
        LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
        LEFT JOIN project_master pm ON li.project_id = pm.project_id
        WHERE pm.category = 'applications' {bg_clause}
        GROUP BY li.project_id, project_label, bf.billing_year_month
        ORDER BY bf.billing_year_month, li.project_id
        """,
        bg_params * 2,
    ).fetchall()
    return [dict(r) for r in rows]


def _query_distribution(conn, group_col: str, month: str | None,
                        billing_group: str | None) -> list[dict]:
    bg_clause, bg_params = _billing_group_filter(billing_group)
    resolved = _resolve_month(conn, month)
    if not resolved:
        return []
    rows = conn.execute(
        f"""
        SELECT
            COALESCE(pm.{group_col}, '未分類') AS {group_col},
            SUM(COALESCE(li.partner_cost, li.google_cost, 0)
                * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
        FROM billing_line_item li
        JOIN billing_file bf ON li.billing_file_id = bf.id
        LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
        LEFT JOIN project_master pm ON li.project_id = pm.project_id
        WHERE bf.billing_year_month = ? AND pm.category = 'applications' {bg_clause}
        GROUP BY {group_col}
        HAVING cost > 0
        ORDER BY cost DESC
        """,
        [resolved] + bg_params,
    ).fetchall()
    return [dict(r) for r in rows]


def _query_shared_infra(conn, month: str | None, billing_group: str | None) -> list[dict]:
    bg_clause, bg_params = _billing_group_filter(billing_group)
    resolved = _resolve_month(conn, month)
    if not resolved:
        return []
    rows = conn.execute(
        f"""
        SELECT
            COALESCE(li.service_description, '未知服務') AS service,
            SUM(COALESCE(li.partner_cost, li.google_cost, 0)
                * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
        FROM billing_line_item li
        JOIN billing_file bf ON li.billing_file_id = bf.id
        LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
        JOIN project_master pm ON li.project_id = pm.project_id
        WHERE bf.billing_year_month = ? AND pm.category = 'shared_infra' {bg_clause}
        GROUP BY service
        HAVING cost > 0
        ORDER BY cost DESC
        """,
        [resolved] + bg_params,
    ).fetchall()
    return [dict(r) for r in rows]


_CHART_REGISTRY = {
    "department-trend": (
        lambda conn, m, bg: _query_dept_trend(conn, m, bg),
        lambda rows: chart_exporter.render_department_trend(rows),
        "department-trend.png",
    ),
    "top-projects": (
        lambda conn, m, bg: _query_top_projects(conn, m, bg),
        lambda rows: chart_exporter.render_top_projects(rows),
        "top-projects.png",
    ),
    "by-cost-center": (
        lambda conn, m, bg: _query_distribution(conn, "cost_center", m, bg),
        lambda rows: chart_exporter.render_by_cost_center(rows),
        "by-cost-center.png",
    ),
    "by-section": (
        lambda conn, m, bg: _query_distribution(conn, "section", m, bg),
        lambda rows: chart_exporter.render_by_section(rows),
        "by-section.png",
    ),
    "by-category": (
        lambda conn, m, bg: _query_distribution(conn, "category", m, bg),
        lambda rows: chart_exporter.render_by_category(rows),
        "by-category.png",
    ),
    "shared-infra": (
        lambda conn, m, bg: _query_shared_infra(conn, m, bg),
        lambda rows: chart_exporter.render_shared_infra(rows),
        "shared-infra.png",
    ),
}


@app.route("/api/charts/export/<chart_name>")
def export_chart(chart_name):
    if chart_exporter is None:
        return jsonify({"error": "matplotlib not installed"}), 500
    if chart_name not in _CHART_REGISTRY:
        return jsonify({"error": f"unknown chart '{chart_name}'"}), 404

    month         = request.args.get("month")
    billing_group = request.args.get("billing_group")
    query_fn, render_fn, _ = _CHART_REGISTRY[chart_name]

    try:
        with get_connection(DB_PATH) as conn:
            rows = query_fn(conn, month, billing_group)
        if not rows:
            return jsonify({"error": f"no data for month={month or 'latest'}"}), 404
        png = render_fn(rows)
    except Exception as exc:
        return jsonify({"error": "render failed", "detail": str(exc)}), 500

    return Response(png, mimetype="image/png")


@app.route("/api/charts/export/all.zip")
def export_all_charts():
    if chart_exporter is None:
        return jsonify({"error": "matplotlib not installed"}), 500

    month         = request.args.get("month")
    billing_group = request.args.get("billing_group")

    buf = io.BytesIO()
    errors = []
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        with get_connection(DB_PATH) as conn:
            for name, (query_fn, render_fn, filename) in _CHART_REGISTRY.items():
                try:
                    rows = query_fn(conn, month, billing_group)
                    png  = render_fn(rows) if rows else chart_exporter._empty_png("No data")
                    zf.writestr(filename, png)
                except Exception as exc:
                    errors.append(f"{name}: {exc}")

    if errors:
        # Still return the ZIP but add an error log
        with zipfile.ZipFile(buf, "a") as zf:
            zf.writestr("errors.txt", "\n".join(errors))

    buf.seek(0)
    return Response(
        buf.read(),
        mimetype="application/zip",
        headers={"Content-Disposition": "attachment; filename=charts.zip"},
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)
