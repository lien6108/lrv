CREATE TABLE IF NOT EXISTS billing_file (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    billing_group       TEXT    NOT NULL,
    billing_year_month  TEXT    NOT NULL,
    imported_at         TEXT    NOT NULL,
    UNIQUE (billing_group, billing_year_month)
);

CREATE TABLE IF NOT EXISTS billing_line_item (
    id                                    INTEGER PRIMARY KEY AUTOINCREMENT,
    billing_file_id                       INTEGER NOT NULL REFERENCES billing_file(id),
    project_id                            TEXT,
    project_name                          TEXT,
    service_description                   TEXT,
    service_id                            TEXT,
    sku_description                       TEXT,
    sku_id                                TEXT,
    usage_start_date                      TEXT,
    usage_end_date                        TEXT,
    usage_amount                          REAL,
    usage_unit                            TEXT,
    free_tier                             REAL DEFAULT 0,
    committed_usage_discount              REAL DEFAULT 0,
    committed_usage_discount_dollar_base  REAL DEFAULT 0,
    discount                              REAL DEFAULT 0,
    promotion                             REAL DEFAULT 0,
    subscription_benefit                  REAL DEFAULT 0,
    sustained_usage_discount              REAL DEFAULT 0,
    google_cost                           REAL,
    partner_cost                          REAL,
    google_discount                       REAL DEFAULT 0,
    partner_discount                      REAL DEFAULT 0,
    total_discount                        REAL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_billing_line_item_file ON billing_line_item(billing_file_id);
CREATE INDEX IF NOT EXISTS idx_billing_line_item_proj ON billing_line_item(project_id);

CREATE TABLE IF NOT EXISTS billing_summary (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    billing_file_id         INTEGER NOT NULL UNIQUE REFERENCES billing_file(id),
    gcp_usage_total_usd     REAL,
    partner_usage_total_usd REAL,
    exchange_rate           REAL,
    total_payable_twd       REAL
);

CREATE TABLE IF NOT EXISTS project_master (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   TEXT UNIQUE NOT NULL,
    apid         TEXT,
    category     TEXT,
    sector       TEXT,
    department   TEXT,
    section      TEXT,
    project_name TEXT,
    environment  TEXT,
    cost_center  TEXT
);

CREATE INDEX IF NOT EXISTS idx_project_master_proj ON project_master(project_id);
