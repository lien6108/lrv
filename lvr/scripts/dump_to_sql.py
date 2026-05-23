"""
Generate batched SQL INSERT files from lvr.db for wrangler d1 execute.
Usage: python scripts/dump_to_sql.py
Outputs: import_batches/batch_000.sql, batch_001.sql, ...
"""
import sqlite3
import os

DB_FILE = "lvr.db"
OUT_DIR = "import_batches"
ROWS_PER_FILE = 5000
ROWS_PER_INSERT = 50

os.makedirs(OUT_DIR, exist_ok=True)

conn = sqlite3.connect(DB_FILE)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("PRAGMA table_info(transactions)")
cols = [row["name"] for row in cur.fetchall() if row["name"] != "id"]
col_list = ", ".join(cols)

cur.execute(f"SELECT COUNT(*) FROM transactions")
total = cur.fetchone()[0]
print(f"Total rows: {total}")

cur.execute(f"SELECT {col_list} FROM transactions")

batch_num = 0
rows_written = 0
f = None

def escape(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    return "'" + str(val).replace("'", "''") + "'"

while True:
    rows = cur.fetchmany(ROWS_PER_FILE)
    if not rows:
        break
    path = os.path.join(OUT_DIR, f"batch_{batch_num:03d}.sql")
    with open(path, "w", encoding="utf-8") as f:
        for chunk_start in range(0, len(rows), ROWS_PER_INSERT):
            chunk = rows[chunk_start:chunk_start + ROWS_PER_INSERT]
            values_lines = []
            for row in chunk:
                vals = ", ".join(escape(row[c]) for c in cols)
                values_lines.append(f"({vals})")
            f.write(f"INSERT INTO transactions ({col_list}) VALUES\n")
            f.write(",\n".join(values_lines))
            f.write(";\n")
    rows_written += len(rows)
    print(f"  batch_{batch_num:03d}.sql — {rows_written}/{total} rows")
    batch_num += 1

conn.close()
print(f"\nDone: {batch_num} files in {OUT_DIR}/")
print(f'Run: for f in {OUT_DIR}/*.sql; do wrangler d1 execute lvr_db --file=$f --remote; done')
