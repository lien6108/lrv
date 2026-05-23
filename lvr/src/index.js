const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function handleOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

async function handleOptions$1(db) {
  const [districts, buildingTypes] = await Promise.all([
    db.prepare("SELECT DISTINCT district FROM transactions WHERE district IS NOT NULL ORDER BY district").all(),
    db.prepare("SELECT DISTINCT building_type FROM transactions WHERE building_type IS NOT NULL ORDER BY building_type").all(),
  ]);
  return jsonResponse({
    districts: districts.results.map((r) => r.district),
    building_types: buildingTypes.results.map((r) => r.building_type),
  });
}

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

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM transactions ${where}`)
    .bind(...params)
    .first();
  const total = countResult?.total ?? 0;

  const rows = await db
    .prepare(
      `SELECT
        district, address, transaction_type, transaction_date,
        building_type, total_floors, floor_transfer,
        rooms, halls, bathrooms,
        total_price_10k, unit_price_ping,
        land_area_ping, building_area_ping, building_area_excl_parking,
        parking_type, parking_price,
        community_name, remarks
      FROM transactions ${where}
      ORDER BY transaction_date DESC
      LIMIT ? OFFSET ?`
    )
    .bind(...params, limit, offset)
    .all();

  return jsonResponse({ total, page, limit, data: rows.results });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return handleOptions();

    if (url.pathname === "/api/options") return handleOptions$1(env.DB);
    if (url.pathname === "/api/search") return handleSearch(env.DB, url);

    return new Response("Not Found", { status: 404 });
  },
};
