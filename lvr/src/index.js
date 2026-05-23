const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SQM_TO_PING = 0.3025;

const COL_MAP_A = {
  "鄉鎮市區": "district",
  "交易標的": "transaction_type",
  "土地位置建物門牌": "address",
  "土地移轉總面積平方公尺": "land_area_sqm",
  "都市土地使用分區": "zoning",
  "非都市土地使用分區": "non_urban_zoning",
  "非都市土地使用編定": "non_urban_land_use",
  "交易年月日": "transaction_date",
  "交易筆棟數": "transaction_units",
  "移轉層次": "floor_transfer",
  "總樓層數": "total_floors",
  "建物型態": "building_type",
  "主要用途": "main_purpose",
  "主要建材": "main_material",
  "建築完成年月": "construction_date",
  "建物移轉總面積平方公尺": "building_area_sqm",
  "建物現況格局-房": "rooms",
  "建物現況格局-廳": "halls",
  "建物現況格局-衛": "bathrooms",
  "建物現況格局-隔間": "partitions",
  "有無管理組織": "management",
  "總價元": "total_price",
  "單價元平方公尺": "unit_price_sqm",
  "車位類別": "parking_type",
  "車位移轉總面積平方公尺": "parking_area_sqm",
  "車位總價元": "parking_price",
  "備註": "remarks",
  "主建物面積": "main_building_area",
  "附屬建物面積": "auxiliary_building_area",
  "陽台面積": "balcony_area",
  "電梯": "elevator",
  "移轉編號": "transfer_id",
};

const COL_MAP_B = {
  ...COL_MAP_A,
  "建案名稱": "community_name",
};

const DB_COLS = [
  "district", "address", "transaction_type", "transaction_date", "transaction_units",
  "building_type", "main_purpose", "main_material", "construction_date",
  "total_floors", "floor_transfer", "elevator",
  "rooms", "halls", "bathrooms", "partitions", "management",
  "land_area_sqm", "building_area_sqm", "parking_area_sqm",
  "land_area_ping", "building_area_ping", "building_area_excl_parking",
  "parking_area_ping", "main_building_area", "auxiliary_building_area", "balcony_area",
  "total_price", "total_price_10k", "unit_price_sqm", "unit_price_ping", "parking_price",
  "parking_type", "zoning", "non_urban_zoning", "non_urban_land_use",
  "community_name", "remarks", "transfer_id", "source_id",
];

// ── CSV 解析 ──────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === "," && !inQ) { result.push(cur.trim() || null); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim() || null);
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 3) return [];
  const headers = parseCSVLine(lines[0]);
  // lines[1] 是英文說明列，跳過
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.every(v => v === null)) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? null; });
    rows.push(row);
  }
  return rows;
}

// ── 欄位轉換 ─────────────────────────────────────────────

function toNum(v) {
  if (v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function toInt(v) {
  const n = toNum(v);
  return n === null ? null : Math.round(n);
}

const INT_COLS = new Set(["rooms", "halls", "bathrooms", "total_price", "parking_price", "transaction_date"]);

function mapRow(raw, colMap, isB) {
  const r = {};
  for (const [csvCol, dbCol] of Object.entries(colMap)) {
    const val = raw[csvCol] ?? null;
    r[dbCol] = INT_COLS.has(dbCol) ? toInt(val) : (dbCol === "construction_date" ? toNum(val) : val);
  }

  // Numeric area / price conversions
  const numAreaCols = ["land_area_sqm", "building_area_sqm", "parking_area_sqm",
    "unit_price_sqm", "main_building_area", "auxiliary_building_area", "balcony_area"];
  for (const c of numAreaCols) {
    if (r[c] !== undefined) r[c] = toNum(r[c]);
  }

  // Derived fields
  r.total_price_10k   = r.total_price ? r.total_price / 10000 : null;
  r.land_area_ping    = r.land_area_sqm ? r.land_area_sqm * SQM_TO_PING : null;
  r.building_area_ping = r.building_area_sqm ? r.building_area_sqm * SQM_TO_PING : null;
  const parkSqm       = r.parking_area_sqm || 0;
  r.building_area_excl_parking = r.building_area_sqm
    ? (r.building_area_sqm - parkSqm) * SQM_TO_PING : null;
  r.parking_area_ping = r.parking_area_sqm ? r.parking_area_sqm * SQM_TO_PING : null;
  r.unit_price_ping   = (r.total_price_10k && r.building_area_ping && r.building_area_ping > 0)
    ? r.total_price_10k / r.building_area_ping : null;

  // source_id: a 用移轉編號，b 用編號
  r.source_id = isB ? (raw["編號"] ?? null) : (r.transfer_id ?? null);

  return r;
}

// ── D1 批次寫入 ───────────────────────────────────────────

async function insertRows(db, rows) {
  // D1 SQL variables limit = 100; with 40 cols, use one INSERT per row via batch()
  const BATCH = 50; // statements per batch() call
  const colList = DB_COLS.join(",");
  const ph = `(${DB_COLS.map(() => "?").join(",")})`;
  const sql = `INSERT OR IGNORE INTO transactions (${colList}) VALUES ${ph}`;

  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const stmts = rows.slice(i, i + BATCH).map(r =>
      db.prepare(sql).bind(...DB_COLS.map(c => r[c] ?? null))
    );
    const results = await db.batch(stmts);
    total += results.reduce((sum, r) => sum + (r.meta?.changes ?? 0), 0);
  }
  return total;
}

// ── 下載並更新 ────────────────────────────────────────────

async function fetchAndUpdate(db) {
  const sources = [
    {
      url: "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_a.csv",
      colMap: COL_MAP_A,
      isB: false,
    },
    {
      url: "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_b.csv",
      colMap: COL_MAP_B,
      isB: true,
    },
  ];

  const log = [];
  for (const src of sources) {
    try {
      const res = await fetch(src.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) { log.push({ url: src.url, error: `HTTP ${res.status}` }); continue; }
      const text = await res.text();
      const rawRows = parseCSV(text);
      const rows = rawRows.map(r => mapRow(r, src.colMap, src.isB));
      const inserted = await insertRows(db, rows);
      log.push({ url: src.url, parsed: rawRows.length, inserted });
    } catch (e) {
      log.push({ url: src.url, error: String(e) });
    }
  }
  return log;
}

// ── HTTP 查詢 API ─────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function handleOptions$1(db) {
  const [districts, buildingTypes] = await Promise.all([
    db.prepare("SELECT DISTINCT district FROM transactions WHERE district IS NOT NULL ORDER BY district").all(),
    db.prepare("SELECT DISTINCT building_type FROM transactions WHERE building_type IS NOT NULL ORDER BY building_type").all(),
  ]);
  return jsonResponse({
    districts: districts.results.map(r => r.district),
    building_types: buildingTypes.results.map(r => r.building_type),
  });
}

async function handleSearch(db, url) {
  const p = url.searchParams;
  const district    = p.get("district") || "";
  const buildingType = p.get("building_type") || "";
  const minPrice    = parseInt(p.get("min_price") || "0", 10);
  const maxPrice    = parseInt(p.get("max_price") || "0", 10);
  const dateFrom    = parseInt(p.get("date_from") || "0", 10);
  const dateTo      = parseInt(p.get("date_to")   || "0", 10);
  const page        = Math.max(1, parseInt(p.get("page")  || "1",  10));
  const limit       = Math.min(100, Math.max(1, parseInt(p.get("limit") || "20", 10)));
  const offset      = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (district)     { conditions.push("district = ?");          params.push(district); }
  if (buildingType) { conditions.push("building_type = ?");     params.push(buildingType); }
  if (minPrice > 0) { conditions.push("total_price_10k >= ?");  params.push(minPrice); }
  if (maxPrice > 0) { conditions.push("total_price_10k <= ?");  params.push(maxPrice); }
  if (dateFrom > 0) { conditions.push("transaction_date >= ?"); params.push(dateFrom); }
  if (dateTo   > 0) { conditions.push("transaction_date <= ?"); params.push(dateTo); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM transactions ${where}`)
    .bind(...params).first();
  const total = countResult?.total ?? 0;

  const rows = await db
    .prepare(
      `SELECT district, address, transaction_type, transaction_date,
              building_type, total_floors, floor_transfer,
              rooms, halls, bathrooms,
              total_price_10k, unit_price_ping,
              land_area_ping, building_area_ping, building_area_excl_parking,
              parking_type, parking_price, community_name, remarks
       FROM transactions ${where}
       ORDER BY transaction_date DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset).all();

  return jsonResponse({ total, page, limit, data: rows.results });
}

// ── 主 export ─────────────────────────────────────────────

export default {
  // HTTP requests
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (url.pathname === "/api/options") return handleOptions$1(env.DB);
    if (url.pathname === "/api/search")  return handleSearch(env.DB, url);
    // 手動觸發更新（測試用）
    if (url.pathname === "/api/update") {
      const log = await fetchAndUpdate(env.DB);
      return jsonResponse({ ok: true, log });
    }
    return new Response("Not Found", { status: 404 });
  },

  // Cron: 每月 5/15/25 日 02:00 UTC
  async scheduled(event, env, ctx) {
    ctx.waitUntil(fetchAndUpdate(env.DB));
  },
};
