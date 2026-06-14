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
  "棟及號": "building_block",
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
  "parking_type", "building_block", "zoning", "non_urban_zoning", "non_urban_land_use",
  "community_name", "remarks", "transfer_id", "source_id", "source_file",
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
  r.source_file = isB ? 'b' : 'a';

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
    last_import: null,
  });
}

async function handleStats(db) {
  const total = (await db.prepare("SELECT COUNT(*) as n FROM transactions").first())?.n ?? 0;

  const bySource = await db
    .prepare("SELECT source_file, COUNT(*) as n FROM transactions WHERE source_file IS NOT NULL GROUP BY source_file")
    .all();

  const byType = await db
    .prepare("SELECT building_type, COUNT(*) as n FROM transactions WHERE building_type IS NOT NULL GROUP BY building_type ORDER BY n DESC LIMIT 8")
    .all();

  const by_source = {};
  for (const r of bySource.results) by_source[r.source_file] = r.n;

  const by_building_type = {};
  for (const r of byType.results) by_building_type[r.building_type] = r.n;

  return jsonResponse({ total, by_source, by_building_type });
}

async function handleTransactions(db, url) {
  const p = url.searchParams;
  const district      = p.get("district") || "";
  const yearFrom      = parseInt(p.get("year_from")  || "0", 10);
  const monthFrom     = parseInt(p.get("month_from") || "0", 10);
  const yearTo        = parseInt(p.get("year_to")    || "0", 10);
  const monthTo       = parseInt(p.get("month_to")   || "0", 10);
  const community     = p.get("community") || "";
  const buildingType  = p.get("building_type") || "";
  const minPrice      = parseInt(p.get("min_price") || "0", 10);
  const maxPrice      = parseInt(p.get("max_price") || "0", 10);
  const minUnit       = parseFloat(p.get("min_unit_price") || "0");
  const maxUnit       = parseFloat(p.get("max_unit_price") || "0");
  const bedroomsP     = parseInt(p.get("bedrooms") ?? "-1", 10);
  const bathroomsP    = parseInt(p.get("bathrooms") ?? "-1", 10);
  const sortBy        = p.get("sort_by") || "year_month";
  const sortDir       = (p.get("sort_dir") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  const page          = Math.max(1, parseInt(p.get("page") || "1", 10));
  const limit         = Math.min(100, Math.max(1, parseInt(p.get("limit") || "20", 10)));
  const offset        = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (district)     { conditions.push("district = ?");           params.push(district); }
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
  if (community)     { conditions.push("community_name LIKE ?");  params.push(`%${community}%`); }
  if (buildingType)  { conditions.push("building_type = ?");      params.push(buildingType); }
  if (minPrice > 0)  { conditions.push("total_price >= ?");       params.push(minPrice); }
  if (maxPrice > 0)  { conditions.push("total_price <= ?");       params.push(maxPrice); }
  if (minUnit > 0)   { conditions.push("unit_price_sqm >= ?");    params.push(minUnit); }
  if (maxUnit > 0)   { conditions.push("unit_price_sqm <= ?");    params.push(maxUnit); }
  if (bedroomsP >= 0)  { conditions.push("rooms = ?");     params.push(bedroomsP); }
  if (bathroomsP >= 0) { conditions.push("bathrooms = ?"); params.push(bathroomsP); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortColMap = { total_price: "total_price", unit_price: "unit_price_sqm", year_month: "transaction_date" };
  const orderCol = sortColMap[sortBy] || "transaction_date";

  const selectCols = [
    "district AS 鄉鎮市區",
    "section AS 區段",
    "CASE WHEN transaction_date IS NOT NULL THEN CAST(transaction_date / 100 AS TEXT) ELSE NULL END AS 交易年月",
    "community_name AS 社區案名",
    "source_file AS 來源檔案",
    "address AS 土地區段位置建物區段門牌",
    "building_block AS 棟別",
    "floor_transfer AS 移轉層次",
    "total_floors AS 總樓層數",
    "building_type AS 建物型態",
    "main_purpose AS 主要用途",
    "main_material AS 主要建材",
    "CASE WHEN construction_date IS NOT NULL THEN CAST(CAST(construction_date AS INTEGER) / 100 AS TEXT) ELSE NULL END AS 建築完成年月",
    "elevator AS 電梯",
    "management AS 有無管理組織",
    "rooms AS 格局_房",
    "halls AS 格局_廳",
    "bathrooms AS 格局_衛",
    "partitions AS 格局_隔間",
    "building_area_ping AS 建物移轉總面積_坪",
    "building_area_excl_parking AS 建物移轉不含車面積_坪",
    "main_building_area AS 主建物面積",
    "auxiliary_building_area AS 附屬建物面積",
    "balcony_area AS 陽台面積",
    "land_area_ping AS 土地移轉總面積_坪",
    "parking_area_ping AS 車位移轉總面積_坪",
    "total_price_10k AS 總價_萬元",
    "unit_price_sqm AS 單價_元每平方",
    "unit_price_ping AS 建物單價_萬每坪",
    "parking_price AS 車位總價_元",
    "parking_type AS 車位類別",
    "transaction_type AS 交易標的",
    "transaction_units AS 交易筆棟數",
    "zoning AS 使用分區編定",
    "remarks AS 備註",
    "transfer_id AS 移轉編號",
  ].join(", ");

  const total = (await db
    .prepare(`SELECT COUNT(*) as n FROM transactions ${where}`)
    .bind(...params).first())?.n ?? 0;

  const rows = await db
    .prepare(`SELECT ${selectCols} FROM transactions ${where} ORDER BY ${orderCol} ${sortDir} LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset).all();

  return jsonResponse({ total, page, limit, data: rows.results });
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

// ── 匯出 API ──────────────────────────────────────────────

async function handleExport(db, url) {
  const p = url.searchParams;
  const district      = p.get("district") || "";
  const yearFrom      = parseInt(p.get("year_from")  || "0", 10);
  const monthFrom     = parseInt(p.get("month_from") || "0", 10);
  const yearTo        = parseInt(p.get("year_to")    || "0", 10);
  const monthTo       = parseInt(p.get("month_to")   || "0", 10);
  const community     = p.get("community") || "";
  const buildingType  = p.get("building_type") || "";
  const minPrice      = parseInt(p.get("min_price") || "0", 10);
  const maxPrice      = parseInt(p.get("max_price") || "0", 10);
  const minUnit       = parseFloat(p.get("min_unit_price") || "0");
  const maxUnit       = parseFloat(p.get("max_unit_price") || "0");
  const bedroomsP     = parseInt(p.get("bedrooms") ?? "-1", 10);
  const bathroomsP    = parseInt(p.get("bathrooms") ?? "-1", 10);
  const sortBy        = p.get("sort_by") || "year_month";
  const sortDir       = (p.get("sort_dir") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

  const conditions = [];
  const params = [];

  if (district)     { conditions.push("district = ?");           params.push(district); }
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
  if (community)     { conditions.push("community_name LIKE ?");  params.push(`%${community}%`); }
  if (buildingType)  { conditions.push("building_type = ?");      params.push(buildingType); }
  if (minPrice > 0)  { conditions.push("total_price >= ?");       params.push(minPrice); }
  if (maxPrice > 0)  { conditions.push("total_price <= ?");       params.push(maxPrice); }
  if (minUnit > 0)   { conditions.push("unit_price_sqm >= ?");    params.push(minUnit); }
  if (maxUnit > 0)   { conditions.push("unit_price_sqm <= ?");    params.push(maxUnit); }
  if (bedroomsP >= 0)  { conditions.push("rooms = ?");     params.push(bedroomsP); }
  if (bathroomsP >= 0) { conditions.push("bathrooms = ?"); params.push(bathroomsP); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortColMap = { total_price: "total_price", unit_price: "unit_price_sqm", year_month: "transaction_date" };
  const orderCol = sortColMap[sortBy] || "transaction_date";

  const selectCols = [
    "district AS 鄉鎮市區",
    "CASE WHEN transaction_date IS NOT NULL THEN CAST(transaction_date / 100 AS TEXT) ELSE NULL END AS 交易年月",
    "community_name AS 社區案名",
    "source_file AS 來源檔案",
    "address AS 土地區段位置建物區段門牌",
    "building_block AS 棟別",
    "floor_transfer AS 移轉層次",
    "total_floors AS 總樓層數",
    "building_type AS 建物型態",
    "main_purpose AS 主要用途",
    "main_material AS 主要建材",
    "CASE WHEN construction_date IS NOT NULL THEN CAST(CAST(construction_date AS INTEGER) / 100 AS TEXT) ELSE NULL END AS 建築完成年月",
    "elevator AS 電梯",
    "management AS 有無管理組織",
    "rooms AS 格局_房",
    "halls AS 格局_廳",
    "bathrooms AS 格局_衛",
    "building_area_ping AS 建物移轉總面積_坪",
    "building_area_excl_parking AS 建物移轉不含車面積_坪",
    "land_area_ping AS 土地移轉總面積_坪",
    "total_price_10k AS 總價_萬元",
    "unit_price_sqm AS 單價_元每平方",
    "unit_price_ping AS 建物單價_萬每坪",
    "parking_price AS 車位總價_元",
    "parking_type AS 車位類別",
    "transaction_type AS 交易標的",
    "remarks AS 備註",
    "transfer_id AS 移轉編號",
  ].join(", ");

  const total = (await db
    .prepare(`SELECT COUNT(*) as n FROM transactions ${where}`)
    .bind(...params).first())?.n ?? 0;

  const rows = await db
    .prepare(`SELECT ${selectCols} FROM transactions ${where} ORDER BY ${orderCol} ${sortDir} LIMIT 100000`)
    .bind(...params).all();

  return jsonResponse({ total, data: rows.results });
}

// ── 寄信通知 ──────────────────────────────────────────────

async function sendNotification(env, log, total) {
  if (!env.RESEND_API_KEY) return;

  const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
  const totalInserted = log.reduce((s, r) => s + (r.inserted ?? 0), 0);

  const rows = log.map(r => {
    const label = r.url.includes("_a.csv") ? "A 類（買賣成交）" : "B 類（預售屋）";
    if (r.error) {
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#dc2626;font-weight:bold;">✘ 失敗</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${r.error}</td>
      </tr>`;
    }
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#16a34a;font-weight:bold;">✔ 成功</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">新增 <strong>${r.inserted}</strong> 筆</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="zh-TW"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;padding:32px;">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;">
    <div style="background:#1d4ed8;padding:20px 24px;">
      <h2 style="color:#fff;margin:0;font-size:18px;">🏠 實價登錄資料更新通知</h2>
    </div>
    <div style="padding:24px;">
      <p style="margin-top:0;color:#374151;">實價登錄系統已完成最新一期資料同步，摘要如下：</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">來源</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">狀態</th>
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">結果</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-bottom:0;color:#6b7280;font-size:13px;">
        本次共新增 <strong>${totalInserted}</strong> 筆交易記錄。<br>
        資料庫目前總筆數：<strong>${total.toLocaleString()}</strong> 筆。<br>
        觸發方式：排程自動觸發 ／ 時間：${now}
      </p>
    </div>
    <div style="background:#f3f4f6;padding:12px 24px;font-size:12px;color:#9ca3af;">
      此信件由實價登錄查詢系統自動發送，請勿直接回覆。
    </div>
  </div>
</body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: ["u107029033@gap.kmu.edu.tw"],
      subject: `【實價登錄】資料更新完成，本次新增 ${totalInserted} 筆`,
      html,
    }),
  });
}

// ── 主 export ─────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (url.pathname === "/api/options")      return handleOptions$1(env.DB);
    if (url.pathname === "/api/stats")        return handleStats(env.DB);
    if (url.pathname === "/api/transactions") return handleTransactions(env.DB, url);
    if (url.pathname === "/api/export")       return handleExport(env.DB, url);
    if (url.pathname === "/api/search")       return handleSearch(env.DB, url);
    if (url.pathname === "/api/update") {
      const log = await fetchAndUpdate(env.DB);
      const total = (await env.DB.prepare("SELECT COUNT(*) as n FROM transactions").first())?.n ?? 0;
      await sendNotification(env, log, total);
      return jsonResponse({ ok: true, log });
    }
    return new Response("Not Found", { status: 404 });
  },

  // Cron: 每月 1/11/21 日 02:00 UTC（台灣時間 10:00）
  async scheduled(_event, env, ctx) {
    ctx.waitUntil((async () => {
      const log = await fetchAndUpdate(env.DB);
      const total = (await env.DB.prepare("SELECT COUNT(*) as n FROM transactions").first())?.n ?? 0;
      await sendNotification(env, log, total);
    })());
  },
};
