var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var SQM_TO_PING = 0.3025;
var COL_MAP_A = {
  "\u9109\u93AE\u5E02\u5340": "district",
  "\u4EA4\u6613\u6A19\u7684": "transaction_type",
  "\u571F\u5730\u4F4D\u7F6E\u5EFA\u7269\u9580\u724C": "address",
  "\u571F\u5730\u79FB\u8F49\u7E3D\u9762\u7A4D\u5E73\u65B9\u516C\u5C3A": "land_area_sqm",
  "\u90FD\u5E02\u571F\u5730\u4F7F\u7528\u5206\u5340": "zoning",
  "\u975E\u90FD\u5E02\u571F\u5730\u4F7F\u7528\u5206\u5340": "non_urban_zoning",
  "\u975E\u90FD\u5E02\u571F\u5730\u4F7F\u7528\u7DE8\u5B9A": "non_urban_land_use",
  "\u4EA4\u6613\u5E74\u6708\u65E5": "transaction_date",
  "\u4EA4\u6613\u7B46\u68DF\u6578": "transaction_units",
  "\u79FB\u8F49\u5C64\u6B21": "floor_transfer",
  "\u7E3D\u6A13\u5C64\u6578": "total_floors",
  "\u5EFA\u7269\u578B\u614B": "building_type",
  "\u4E3B\u8981\u7528\u9014": "main_purpose",
  "\u4E3B\u8981\u5EFA\u6750": "main_material",
  "\u5EFA\u7BC9\u5B8C\u6210\u5E74\u6708": "construction_date",
  "\u5EFA\u7269\u79FB\u8F49\u7E3D\u9762\u7A4D\u5E73\u65B9\u516C\u5C3A": "building_area_sqm",
  "\u5EFA\u7269\u73FE\u6CC1\u683C\u5C40-\u623F": "rooms",
  "\u5EFA\u7269\u73FE\u6CC1\u683C\u5C40-\u5EF3": "halls",
  "\u5EFA\u7269\u73FE\u6CC1\u683C\u5C40-\u885B": "bathrooms",
  "\u5EFA\u7269\u73FE\u6CC1\u683C\u5C40-\u9694\u9593": "partitions",
  "\u6709\u7121\u7BA1\u7406\u7D44\u7E54": "management",
  "\u7E3D\u50F9\u5143": "total_price",
  "\u55AE\u50F9\u5143\u5E73\u65B9\u516C\u5C3A": "unit_price_sqm",
  "\u8ECA\u4F4D\u985E\u5225": "parking_type",
  "\u8ECA\u4F4D\u79FB\u8F49\u7E3D\u9762\u7A4D\u5E73\u65B9\u516C\u5C3A": "parking_area_sqm",
  "\u8ECA\u4F4D\u7E3D\u50F9\u5143": "parking_price",
  "\u5099\u8A3B": "remarks",
  "\u4E3B\u5EFA\u7269\u9762\u7A4D": "main_building_area",
  "\u9644\u5C6C\u5EFA\u7269\u9762\u7A4D": "auxiliary_building_area",
  "\u967D\u53F0\u9762\u7A4D": "balcony_area",
  "\u96FB\u68AF": "elevator",
  "\u79FB\u8F49\u7DE8\u865F": "transfer_id"
};
var COL_MAP_B = {
  ...COL_MAP_A,
  "\u5EFA\u6848\u540D\u7A31": "community_name",
  "\u68DF\u53CA\u865F": "building_block"
};
var DB_COLS = [
  "district",
  "address",
  "transaction_type",
  "transaction_date",
  "transaction_units",
  "building_type",
  "main_purpose",
  "main_material",
  "construction_date",
  "total_floors",
  "floor_transfer",
  "elevator",
  "rooms",
  "halls",
  "bathrooms",
  "partitions",
  "management",
  "land_area_sqm",
  "building_area_sqm",
  "parking_area_sqm",
  "land_area_ping",
  "building_area_ping",
  "building_area_excl_parking",
  "parking_area_ping",
  "main_building_area",
  "auxiliary_building_area",
  "balcony_area",
  "total_price",
  "total_price_10k",
  "unit_price_sqm",
  "unit_price_ping",
  "parking_price",
  "parking_type",
  "building_block",
  "zoning",
  "non_urban_zoning",
  "non_urban_land_use",
  "community_name",
  "remarks",
  "transfer_id",
  "source_id",
  "source_file"
];
function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') {
      inQ = !inQ;
    } else if (ch === "," && !inQ) {
      result.push(cur.trim() || null);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim() || null);
  return result;
}
__name(parseCSVLine, "parseCSVLine");
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 3) return [];
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.every((v) => v === null)) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] ?? null;
    });
    rows.push(row);
  }
  return rows;
}
__name(parseCSV, "parseCSV");
function toNum(v) {
  if (v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
__name(toNum, "toNum");
function toInt(v) {
  const n = toNum(v);
  return n === null ? null : Math.round(n);
}
__name(toInt, "toInt");
var INT_COLS = /* @__PURE__ */ new Set(["rooms", "halls", "bathrooms", "total_price", "parking_price", "transaction_date"]);
function mapRow(raw, colMap, isB) {
  const r = {};
  for (const [csvCol, dbCol] of Object.entries(colMap)) {
    const val = raw[csvCol] ?? null;
    r[dbCol] = INT_COLS.has(dbCol) ? toInt(val) : dbCol === "construction_date" ? toNum(val) : val;
  }
  const numAreaCols = [
    "land_area_sqm",
    "building_area_sqm",
    "parking_area_sqm",
    "unit_price_sqm",
    "main_building_area",
    "auxiliary_building_area",
    "balcony_area"
  ];
  for (const c of numAreaCols) {
    if (r[c] !== void 0) r[c] = toNum(r[c]);
  }
  r.total_price_10k = r.total_price ? r.total_price / 1e4 : null;
  r.land_area_ping = r.land_area_sqm ? r.land_area_sqm * SQM_TO_PING : null;
  r.building_area_ping = r.building_area_sqm ? r.building_area_sqm * SQM_TO_PING : null;
  const parkSqm = r.parking_area_sqm || 0;
  r.building_area_excl_parking = r.building_area_sqm ? (r.building_area_sqm - parkSqm) * SQM_TO_PING : null;
  r.parking_area_ping = r.parking_area_sqm ? r.parking_area_sqm * SQM_TO_PING : null;
  r.unit_price_ping = r.total_price_10k && r.building_area_ping && r.building_area_ping > 0 ? r.total_price_10k / r.building_area_ping : null;
  r.source_id = isB ? raw["\u7DE8\u865F"] ?? null : r.transfer_id ?? null;
  r.source_file = isB ? "b" : "a";
  return r;
}
__name(mapRow, "mapRow");
async function insertRows(db, rows) {
  const BATCH = 50;
  const colList = DB_COLS.join(",");
  const ph = `(${DB_COLS.map(() => "?").join(",")})`;
  const sql = `INSERT OR IGNORE INTO transactions (${colList}) VALUES ${ph}`;
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const stmts = rows.slice(i, i + BATCH).map(
      (r) => db.prepare(sql).bind(...DB_COLS.map((c) => r[c] ?? null))
    );
    const results = await db.batch(stmts);
    total += results.reduce((sum, r) => sum + (r.meta?.changes ?? 0), 0);
  }
  return total;
}
__name(insertRows, "insertRows");
async function fetchAndUpdate(db) {
  const sources = [
    {
      url: "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_a.csv",
      colMap: COL_MAP_A,
      isB: false
    },
    {
      url: "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_b.csv",
      colMap: COL_MAP_B,
      isB: true
    }
  ];
  const log = [];
  for (const src of sources) {
    try {
      const res = await fetch(src.url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) {
        log.push({ url: src.url, error: `HTTP ${res.status}` });
        continue;
      }
      const text = await res.text();
      const rawRows = parseCSV(text);
      const rows = rawRows.map((r) => mapRow(r, src.colMap, src.isB));
      const inserted = await insertRows(db, rows);
      log.push({ url: src.url, parsed: rawRows.length, inserted });
    } catch (e) {
      log.push({ url: src.url, error: String(e) });
    }
  }
  return log;
}
__name(fetchAndUpdate, "fetchAndUpdate");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}
__name(jsonResponse, "jsonResponse");
async function handleOptions$1(db) {
  const [districts, buildingTypes] = await Promise.all([
    db.prepare("SELECT DISTINCT district FROM transactions WHERE district IS NOT NULL ORDER BY district").all(),
    db.prepare("SELECT DISTINCT building_type FROM transactions WHERE building_type IS NOT NULL ORDER BY building_type").all()
  ]);
  return jsonResponse({
    districts: districts.results.map((r) => r.district),
    building_types: buildingTypes.results.map((r) => r.building_type),
    last_import: null
  });
}
__name(handleOptions$1, "handleOptions$1");
async function handleStats(db) {
  const total = (await db.prepare("SELECT COUNT(*) as n FROM transactions").first())?.n ?? 0;
  const bySource = await db.prepare("SELECT source_file, COUNT(*) as n FROM transactions WHERE source_file IS NOT NULL GROUP BY source_file").all();
  const byType = await db.prepare("SELECT building_type, COUNT(*) as n FROM transactions WHERE building_type IS NOT NULL GROUP BY building_type ORDER BY n DESC LIMIT 8").all();
  const by_source = {};
  for (const r of bySource.results) by_source[r.source_file] = r.n;
  const by_building_type = {};
  for (const r of byType.results) by_building_type[r.building_type] = r.n;
  return jsonResponse({ total, by_source, by_building_type });
}
__name(handleStats, "handleStats");
async function handleTransactions(db, url) {
  const p = url.searchParams;
  const district = p.get("district") || "";
  const yearFrom = parseInt(p.get("year_from") || "0", 10);
  const monthFrom = parseInt(p.get("month_from") || "0", 10);
  const yearTo = parseInt(p.get("year_to") || "0", 10);
  const monthTo = parseInt(p.get("month_to") || "0", 10);
  const community = p.get("community") || "";
  const buildingType = p.get("building_type") || "";
  const minPrice = parseInt(p.get("min_price") || "0", 10);
  const maxPrice = parseInt(p.get("max_price") || "0", 10);
  const minUnit = parseFloat(p.get("min_unit_price") || "0");
  const maxUnit = parseFloat(p.get("max_unit_price") || "0");
  const bedroomsP = parseInt(p.get("bedrooms") ?? "-1", 10);
  const bathroomsP = parseInt(p.get("bathrooms") ?? "-1", 10);
  const sortBy = p.get("sort_by") || "year_month";
  const sortDir = (p.get("sort_dir") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  const page = Math.max(1, parseInt(p.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(p.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  if (district) {
    conditions.push("district = ?");
    params.push(district);
  }
  if (yearFrom > 0) {
    const from = yearFrom * 100 + (monthFrom > 0 ? monthFrom : 1);
    conditions.push("CAST(transaction_date / 100 AS INTEGER) >= ?");
    params.push(from);
  }
  if (yearTo > 0) {
    const to = yearTo * 100 + (monthTo > 0 ? monthTo : 12);
    conditions.push("CAST(transaction_date / 100 AS INTEGER) <= ?");
    params.push(to);
  }
  if (community) {
    conditions.push("community_name LIKE ?");
    params.push(`%${community}%`);
  }
  if (buildingType) {
    conditions.push("building_type = ?");
    params.push(buildingType);
  }
  if (minPrice > 0) {
    conditions.push("total_price >= ?");
    params.push(minPrice);
  }
  if (maxPrice > 0) {
    conditions.push("total_price <= ?");
    params.push(maxPrice);
  }
  if (minUnit > 0) {
    conditions.push("unit_price_sqm >= ?");
    params.push(minUnit);
  }
  if (maxUnit > 0) {
    conditions.push("unit_price_sqm <= ?");
    params.push(maxUnit);
  }
  if (bedroomsP >= 0) {
    conditions.push("rooms = ?");
    params.push(bedroomsP);
  }
  if (bathroomsP >= 0) {
    conditions.push("bathrooms = ?");
    params.push(bathroomsP);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortColMap = { total_price: "total_price", unit_price: "unit_price_sqm", year_month: "transaction_date" };
  const orderCol = sortColMap[sortBy] || "transaction_date";
  const selectCols = [
    "district AS \u9109\u93AE\u5E02\u5340",
    "section AS \u5340\u6BB5",
    "CASE WHEN transaction_date IS NOT NULL THEN CAST(transaction_date / 100 AS TEXT) ELSE NULL END AS \u4EA4\u6613\u5E74\u6708",
    "community_name AS \u793E\u5340\u6848\u540D",
    "source_file AS \u4F86\u6E90\u6A94\u6848",
    "address AS \u571F\u5730\u5340\u6BB5\u4F4D\u7F6E\u5EFA\u7269\u5340\u6BB5\u9580\u724C",
    "building_block AS \u68DF\u5225",
    "floor_transfer AS \u79FB\u8F49\u5C64\u6B21",
    "total_floors AS \u7E3D\u6A13\u5C64\u6578",
    "building_type AS \u5EFA\u7269\u578B\u614B",
    "main_purpose AS \u4E3B\u8981\u7528\u9014",
    "main_material AS \u4E3B\u8981\u5EFA\u6750",
    "CASE WHEN construction_date IS NOT NULL THEN CAST(CAST(construction_date AS INTEGER) / 100 AS TEXT) ELSE NULL END AS \u5EFA\u7BC9\u5B8C\u6210\u5E74\u6708",
    "elevator AS \u96FB\u68AF",
    "management AS \u6709\u7121\u7BA1\u7406\u7D44\u7E54",
    "rooms AS \u683C\u5C40_\u623F",
    "halls AS \u683C\u5C40_\u5EF3",
    "bathrooms AS \u683C\u5C40_\u885B",
    "partitions AS \u683C\u5C40_\u9694\u9593",
    "building_area_ping AS \u5EFA\u7269\u79FB\u8F49\u7E3D\u9762\u7A4D_\u576A",
    "building_area_excl_parking AS \u5EFA\u7269\u79FB\u8F49\u4E0D\u542B\u8ECA\u9762\u7A4D_\u576A",
    "main_building_area AS \u4E3B\u5EFA\u7269\u9762\u7A4D",
    "auxiliary_building_area AS \u9644\u5C6C\u5EFA\u7269\u9762\u7A4D",
    "balcony_area AS \u967D\u53F0\u9762\u7A4D",
    "land_area_ping AS \u571F\u5730\u79FB\u8F49\u7E3D\u9762\u7A4D_\u576A",
    "parking_area_ping AS \u8ECA\u4F4D\u79FB\u8F49\u7E3D\u9762\u7A4D_\u576A",
    "total_price_10k AS \u7E3D\u50F9_\u842C\u5143",
    "unit_price_sqm AS \u55AE\u50F9_\u5143\u6BCF\u5E73\u65B9",
    "unit_price_ping AS \u5EFA\u7269\u55AE\u50F9_\u842C\u6BCF\u576A",
    "parking_price AS \u8ECA\u4F4D\u7E3D\u50F9_\u5143",
    "parking_type AS \u8ECA\u4F4D\u985E\u5225",
    "transaction_type AS \u4EA4\u6613\u6A19\u7684",
    "transaction_units AS \u4EA4\u6613\u7B46\u68DF\u6578",
    "zoning AS \u4F7F\u7528\u5206\u5340\u7DE8\u5B9A",
    "remarks AS \u5099\u8A3B",
    "transfer_id AS \u79FB\u8F49\u7DE8\u865F"
  ].join(", ");
  const total = (await db.prepare(`SELECT COUNT(*) as n FROM transactions ${where}`).bind(...params).first())?.n ?? 0;
  const rows = await db.prepare(`SELECT ${selectCols} FROM transactions ${where} ORDER BY ${orderCol} ${sortDir} LIMIT ? OFFSET ?`).bind(...params, limit, offset).all();
  return jsonResponse({ total, page, limit, data: rows.results });
}
__name(handleTransactions, "handleTransactions");
async function handleSearch(db, url) {
  const p = url.searchParams;
  const district = p.get("district") || "";
  const buildingType = p.get("building_type") || "";
  const minPrice = parseInt(p.get("min_price") || "0", 10);
  const maxPrice = parseInt(p.get("max_price") || "0", 10);
  const dateFrom = parseInt(p.get("date_from") || "0", 10);
  const dateTo = parseInt(p.get("date_to") || "0", 10);
  const page = Math.max(1, parseInt(p.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(p.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  if (district) {
    conditions.push("district = ?");
    params.push(district);
  }
  if (buildingType) {
    conditions.push("building_type = ?");
    params.push(buildingType);
  }
  if (minPrice > 0) {
    conditions.push("total_price_10k >= ?");
    params.push(minPrice);
  }
  if (maxPrice > 0) {
    conditions.push("total_price_10k <= ?");
    params.push(maxPrice);
  }
  if (dateFrom > 0) {
    conditions.push("transaction_date >= ?");
    params.push(dateFrom);
  }
  if (dateTo > 0) {
    conditions.push("transaction_date <= ?");
    params.push(dateTo);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM transactions ${where}`).bind(...params).first();
  const total = countResult?.total ?? 0;
  const rows = await db.prepare(
    `SELECT district, address, transaction_type, transaction_date,
              building_type, total_floors, floor_transfer,
              rooms, halls, bathrooms,
              total_price_10k, unit_price_ping,
              land_area_ping, building_area_ping, building_area_excl_parking,
              parking_type, parking_price, community_name, remarks
       FROM transactions ${where}
       ORDER BY transaction_date DESC
       LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();
  return jsonResponse({ total, page, limit, data: rows.results });
}
__name(handleSearch, "handleSearch");
async function handleExport(db, url) {
  const p = url.searchParams;
  const district = p.get("district") || "";
  const yearFrom = parseInt(p.get("year_from") || "0", 10);
  const monthFrom = parseInt(p.get("month_from") || "0", 10);
  const yearTo = parseInt(p.get("year_to") || "0", 10);
  const monthTo = parseInt(p.get("month_to") || "0", 10);
  const community = p.get("community") || "";
  const buildingType = p.get("building_type") || "";
  const minPrice = parseInt(p.get("min_price") || "0", 10);
  const maxPrice = parseInt(p.get("max_price") || "0", 10);
  const minUnit = parseFloat(p.get("min_unit_price") || "0");
  const maxUnit = parseFloat(p.get("max_unit_price") || "0");
  const bedroomsP = parseInt(p.get("bedrooms") ?? "-1", 10);
  const bathroomsP = parseInt(p.get("bathrooms") ?? "-1", 10);
  const sortBy = p.get("sort_by") || "year_month";
  const sortDir = (p.get("sort_dir") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  const conditions = [];
  const params = [];
  if (district) {
    conditions.push("district = ?");
    params.push(district);
  }
  if (yearFrom > 0) {
    const from = yearFrom * 100 + (monthFrom > 0 ? monthFrom : 1);
    conditions.push("CAST(transaction_date / 100 AS INTEGER) >= ?");
    params.push(from);
  }
  if (yearTo > 0) {
    const to = yearTo * 100 + (monthTo > 0 ? monthTo : 12);
    conditions.push("CAST(transaction_date / 100 AS INTEGER) <= ?");
    params.push(to);
  }
  if (community) {
    conditions.push("community_name LIKE ?");
    params.push(`%${community}%`);
  }
  if (buildingType) {
    conditions.push("building_type = ?");
    params.push(buildingType);
  }
  if (minPrice > 0) {
    conditions.push("total_price >= ?");
    params.push(minPrice);
  }
  if (maxPrice > 0) {
    conditions.push("total_price <= ?");
    params.push(maxPrice);
  }
  if (minUnit > 0) {
    conditions.push("unit_price_sqm >= ?");
    params.push(minUnit);
  }
  if (maxUnit > 0) {
    conditions.push("unit_price_sqm <= ?");
    params.push(maxUnit);
  }
  if (bedroomsP >= 0) {
    conditions.push("rooms = ?");
    params.push(bedroomsP);
  }
  if (bathroomsP >= 0) {
    conditions.push("bathrooms = ?");
    params.push(bathroomsP);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortColMap = { total_price: "total_price", unit_price: "unit_price_sqm", year_month: "transaction_date" };
  const orderCol = sortColMap[sortBy] || "transaction_date";
  const selectCols = [
    "district AS \u9109\u93AE\u5E02\u5340",
    "CASE WHEN transaction_date IS NOT NULL THEN CAST(transaction_date / 100 AS TEXT) ELSE NULL END AS \u4EA4\u6613\u5E74\u6708",
    "community_name AS \u793E\u5340\u6848\u540D",
    "source_file AS \u4F86\u6E90\u6A94\u6848",
    "address AS \u571F\u5730\u5340\u6BB5\u4F4D\u7F6E\u5EFA\u7269\u5340\u6BB5\u9580\u724C",
    "building_block AS \u68DF\u5225",
    "floor_transfer AS \u79FB\u8F49\u5C64\u6B21",
    "total_floors AS \u7E3D\u6A13\u5C64\u6578",
    "building_type AS \u5EFA\u7269\u578B\u614B",
    "main_purpose AS \u4E3B\u8981\u7528\u9014",
    "main_material AS \u4E3B\u8981\u5EFA\u6750",
    "CASE WHEN construction_date IS NOT NULL THEN CAST(CAST(construction_date AS INTEGER) / 100 AS TEXT) ELSE NULL END AS \u5EFA\u7BC9\u5B8C\u6210\u5E74\u6708",
    "elevator AS \u96FB\u68AF",
    "management AS \u6709\u7121\u7BA1\u7406\u7D44\u7E54",
    "rooms AS \u683C\u5C40_\u623F",
    "halls AS \u683C\u5C40_\u5EF3",
    "bathrooms AS \u683C\u5C40_\u885B",
    "building_area_ping AS \u5EFA\u7269\u79FB\u8F49\u7E3D\u9762\u7A4D_\u576A",
    "building_area_excl_parking AS \u5EFA\u7269\u79FB\u8F49\u4E0D\u542B\u8ECA\u9762\u7A4D_\u576A",
    "land_area_ping AS \u571F\u5730\u79FB\u8F49\u7E3D\u9762\u7A4D_\u576A",
    "total_price_10k AS \u7E3D\u50F9_\u842C\u5143",
    "unit_price_sqm AS \u55AE\u50F9_\u5143\u6BCF\u5E73\u65B9",
    "unit_price_ping AS \u5EFA\u7269\u55AE\u50F9_\u842C\u6BCF\u576A",
    "parking_price AS \u8ECA\u4F4D\u7E3D\u50F9_\u5143",
    "parking_type AS \u8ECA\u4F4D\u985E\u5225",
    "transaction_type AS \u4EA4\u6613\u6A19\u7684",
    "remarks AS \u5099\u8A3B",
    "transfer_id AS \u79FB\u8F49\u7DE8\u865F"
  ].join(", ");
  const total = (await db.prepare(`SELECT COUNT(*) as n FROM transactions ${where}`).bind(...params).first())?.n ?? 0;
  const rows = await db.prepare(`SELECT ${selectCols} FROM transactions ${where} ORDER BY ${orderCol} ${sortDir} LIMIT 100000`).bind(...params).all();
  return jsonResponse({ total, data: rows.results });
}
__name(handleExport, "handleExport");
var src_default = {
  // HTTP requests
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (url.pathname === "/api/options") return handleOptions$1(env.DB);
    if (url.pathname === "/api/stats") return handleStats(env.DB);
    if (url.pathname === "/api/transactions") return handleTransactions(env.DB, url);
    if (url.pathname === "/api/export") return handleExport(env.DB, url);
    if (url.pathname === "/api/search") return handleSearch(env.DB, url);
    if (url.pathname === "/api/update") {
      const log = await fetchAndUpdate(env.DB);
      return jsonResponse({ ok: true, log });
    }
    return new Response("Not Found", { status: 404 });
  },
  // Cron: 每月 5/15/25 日 02:00 UTC
  async scheduled(event, env, ctx) {
    ctx.waitUntil(fetchAndUpdate(env.DB));
  }
};

// C:/Users/u1070/AppData/Local/npm-cache/_npx/61e1327a8aba9411/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/u1070/AppData/Local/npm-cache/_npx/61e1327a8aba9411/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-N6aCiE/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// C:/Users/u1070/AppData/Local/npm-cache/_npx/61e1327a8aba9411/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-N6aCiE/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
