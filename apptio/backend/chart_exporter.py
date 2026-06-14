"""
PPT-ready chart renderer using matplotlib.
All public render_* functions accept a list of dicts and return PNG bytes at
1280x720px (16:9, 96 DPI) with data labels always visible.
"""
import io
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np

# ── Layout constants ──────────────────────────────────────────────────────────
FIG_W, FIG_H = 13.33, 7.5   # inches @ 96 DPI → 1280×720 px
DPI = 96
TITLE_SIZE = 18
AXIS_LABEL_SIZE = 13
TICK_SIZE = 12
DATA_LABEL_SIZE = 11

PRIMARY = "#003087"          # Cathay Bank blue
GREY    = "#B0BEC5"
PALETTE = [
    "#003087", "#E8392A", "#F5A623", "#27AE60",
    "#9B59B6", "#1ABC9C", "#F39C12", "#2980B9",
    "#E74C3C", "#16A085",
]
GRID_COLOR = "#E5E7EB"

# ── CJK font setup ────────────────────────────────────────────────────────────
_CJK_CANDIDATES = [
    "Microsoft JhengHei",
    "Microsoft YaHei",
    "Noto Sans TC",
    "SimHei",
    "PingFang TC",
]


def _setup_font() -> str | None:
    available = {f.name for f in fm.fontManager.ttflist}
    for name in _CJK_CANDIDATES:
        if name in available:
            matplotlib.rcParams["font.family"] = name
            return name
    return None


_FONT = _setup_font()


# ── Shared helpers ─────────────────────────────────────────────────────────────
def _fmt_wan(value: float) -> str:
    wan = value / 10_000
    if wan >= 1:
        return f"${wan:,.1f}萬"
    return f"${value:,.0f}"


def _apply_ppt_style(fig, ax, title: str = "", xgrid: bool = False, ygrid: bool = True):
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    if title:
        ax.set_title(title, fontsize=TITLE_SIZE, fontweight="bold", pad=14)
    ax.tick_params(labelsize=TICK_SIZE)
    if ygrid:
        ax.yaxis.grid(True, color=GRID_COLOR, alpha=0.7, linewidth=0.8, zorder=0)
    if xgrid:
        ax.xaxis.grid(True, color=GRID_COLOR, alpha=0.7, linewidth=0.8, zorder=0)
    ax.set_axisbelow(True)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)


def _png_bytes(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=DPI, bbox_inches="tight",
                facecolor="white", edgecolor="none")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


def _empty_png(msg: str = "No data") -> bytes:
    fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
    fig.patch.set_facecolor("white")
    ax.text(0.5, 0.5, msg, transform=ax.transAxes,
            ha="center", va="center", fontsize=20, color="#999999")
    ax.axis("off")
    return _png_bytes(fig)


# ── Chart renderers ───────────────────────────────────────────────────────────

def render_department_trend(rows: list[dict]) -> bytes:
    """
    rows: [{department, billing_year_month, cost}, ...]
    Line chart — one line per department, X=month, Y=TWD cost.
    """
    if not rows:
        return _empty_png("無部門費用資料")

    months = sorted({r["billing_year_month"] for r in rows})
    depts  = sorted({r["department"] for r in rows})
    pivot: dict[str, dict[str, float]] = defaultdict(dict)
    for r in rows:
        pivot[r["department"]][r["billing_year_month"]] = r["cost"]

    fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
    _apply_ppt_style(fig, ax, title="部門費用趨勢 — 近六個月")

    x = list(range(len(months)))
    for i, dept in enumerate(depts):
        costs = [pivot[dept].get(m, 0) for m in months]
        color = PALETTE[i % len(PALETTE)]
        ax.plot(x, costs, marker="o", linewidth=2.5, markersize=7,
                color=color, label=dept, zorder=3)
        for xi, cost in zip(x, costs):
            if cost > 0:
                ax.annotate(
                    _fmt_wan(cost),
                    xy=(xi, cost), xytext=(0, 9),
                    textcoords="offset points",
                    ha="center", va="bottom",
                    fontsize=DATA_LABEL_SIZE, color=color,
                )

    ax.set_xticks(x)
    ax.set_xticklabels(months, fontsize=TICK_SIZE)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: _fmt_wan(v)))
    ax.set_ylabel("費用（TWD 含稅）", fontsize=AXIS_LABEL_SIZE)
    ax.legend(loc="upper left", fontsize=TICK_SIZE - 1, framealpha=0.9)
    fig.tight_layout()
    return _png_bytes(fig)


def render_top_projects(rows: list[dict]) -> bytes:
    """
    rows: [{project_id, project_label, billing_year_month, cost}, ...]
    Horizontal grouped bar — current month (blue) vs previous month (grey), top 7.
    """
    if not rows:
        return _empty_png("無專案費用資料")

    months = sorted({r["billing_year_month"] for r in rows})
    curr_month = months[-1]
    prev_month = months[-2] if len(months) >= 2 else None

    curr_costs: dict[str, float] = defaultdict(float)
    prev_costs: dict[str, float] = defaultdict(float)
    proj_labels: dict[str, str]  = {}
    for r in rows:
        pid = r.get("project_id", r["project_label"])
        proj_labels[pid] = r["project_label"]
        if r["billing_year_month"] == curr_month:
            curr_costs[pid] += r["cost"]
        elif r["billing_year_month"] == prev_month:
            prev_costs[pid] += r["cost"]

    top7 = sorted(curr_costs, key=lambda p: curr_costs[p], reverse=True)[:7]
    labels    = [proj_labels[p][:28] for p in top7]
    curr_vals = [curr_costs[p] for p in top7]
    prev_vals = [prev_costs.get(p, 0) for p in top7]
    max_val   = max(curr_vals) if curr_vals else 1

    prev_label = prev_month if prev_month else "上月"
    fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
    _apply_ppt_style(fig, ax,
                     title=f"Top 7 專案費用 — {curr_month} vs {prev_label}",
                     xgrid=True, ygrid=False)

    y      = np.arange(len(labels))
    bar_h  = 0.35
    ax.barh(y + bar_h / 2, curr_vals, bar_h, color=PRIMARY,   label=curr_month, zorder=3)
    ax.barh(y - bar_h / 2, prev_vals, bar_h, color=GREY,      label=prev_label, zorder=3)

    for idx, (cv, pv) in enumerate(zip(curr_vals, prev_vals)):
        offset = max_val * 0.012
        if cv > 0:
            ax.text(cv + offset, y[idx] + bar_h / 2,
                    _fmt_wan(cv), va="center", ha="left",
                    fontsize=DATA_LABEL_SIZE, color=PRIMARY)
        if pv > 0:
            ax.text(pv + offset, y[idx] - bar_h / 2,
                    _fmt_wan(pv), va="center", ha="left",
                    fontsize=DATA_LABEL_SIZE, color="#607D8B")

    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=TICK_SIZE)
    ax.invert_yaxis()
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: _fmt_wan(v)))
    ax.set_xlabel("費用（TWD 含稅）", fontsize=AXIS_LABEL_SIZE)
    ax.legend(loc="lower right", fontsize=TICK_SIZE - 1)
    fig.tight_layout()
    return _png_bytes(fig)


def _render_pie(labels: list, values: list, title: str) -> bytes:
    """Shared pie renderer with outside labels. Groups slices < 3% into 其他."""
    total = sum(values)
    if total == 0:
        return _empty_png("無費用資料")

    threshold = total * 0.03
    main_labels, main_vals, other_val = [], [], 0.0
    for lbl, val in zip(labels, values):
        if val >= threshold:
            main_labels.append(lbl)
            main_vals.append(val)
        else:
            other_val += val
    if other_val > 0:
        main_labels.append("其他")
        main_vals.append(other_val)

    colors  = [PALETTE[i % len(PALETTE)] for i in range(len(main_labels))]
    fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")
    ax.set_title(title, fontsize=TITLE_SIZE, fontweight="bold", pad=14)

    wedges, _ = ax.pie(
        main_vals, colors=colors, startangle=140,
        wedgeprops={"linewidth": 1.5, "edgecolor": "white"},
    )

    bbox_props = dict(boxstyle="round,pad=0.3", fc="white", ec="#CCCCCC",
                      lw=0.6, alpha=0.9)
    kw = dict(
        arrowprops=dict(arrowstyle="-", color="#999999", lw=0.8),
        bbox=bbox_props, zorder=4, va="center", fontsize=DATA_LABEL_SIZE,
    )

    for wedge, lbl, val in zip(wedges, main_labels, main_vals):
        ang   = (wedge.theta2 + wedge.theta1) / 2
        cos_a = np.cos(np.deg2rad(ang))
        sin_a = np.sin(np.deg2rad(ang))
        pct   = val / total * 100
        ha    = "left" if cos_a > 0 else "right"
        ax.annotate(
            f"{lbl}\n{pct:.1f}%\n{_fmt_wan(val)}",
            xy=(cos_a * 1.05, sin_a * 1.05),
            xytext=(cos_a * 1.5, sin_a * 1.45),
            ha=ha, **kw,
        )

    ax.set_xlim(-2.4, 2.4)
    ax.set_ylim(-2.0, 2.0)
    return _png_bytes(fig)


def render_by_cost_center(rows: list[dict]) -> bytes:
    """rows: [{cost_center, cost}, ...]"""
    return _render_pie(
        [r["cost_center"] for r in rows],
        [r["cost"]        for r in rows],
        "費用分布 — 成本中心",
    )


def render_by_section(rows: list[dict]) -> bytes:
    """rows: [{section, cost}, ...]"""
    return _render_pie(
        [r["section"] for r in rows],
        [r["cost"]    for r in rows],
        "費用分布 — 處室",
    )


def render_by_category(rows: list[dict]) -> bytes:
    """rows: [{category, cost}, ...]"""
    return _render_pie(
        [r["category"] for r in rows],
        [r["cost"]     for r in rows],
        "費用分布 — 類別",
    )


def render_shared_infra(rows: list[dict]) -> bytes:
    """
    rows: [{service, cost}, ...]
    Horizontal bar chart sorted by cost descending.
    """
    if not rows:
        return _empty_png("無 Shared Infra 資料")

    rows_s = sorted(rows, key=lambda r: r["cost"], reverse=True)
    labels = [r["service"][:32] for r in rows_s]
    values = [r["cost"]         for r in rows_s]
    max_v  = max(values)

    fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
    _apply_ppt_style(fig, ax, title="Shared Infra 費用分布 — 服務別",
                     xgrid=True, ygrid=False)

    y = np.arange(len(labels))
    ax.barh(y, values, color=PRIMARY, zorder=3)

    for yi, val in zip(y, values):
        ax.text(val + max_v * 0.012, yi,
                _fmt_wan(val), va="center", ha="left",
                fontsize=DATA_LABEL_SIZE, color=PRIMARY)

    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=TICK_SIZE)
    ax.invert_yaxis()
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: _fmt_wan(v)))
    ax.set_xlabel("費用（TWD 含稅）", fontsize=AXIS_LABEL_SIZE)
    fig.tight_layout()
    return _png_bytes(fig)
