#!/usr/bin/env bash
set -euo pipefail

# One-time data migration helper.
# Usage:
#   backend/scripts/migrate-sqlite-to-postgres.sh <postgres_url> [sqlite_db_path]
# Or:
#   SPRING_DATASOURCE_URL=... backend/scripts/migrate-sqlite-to-postgres.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

POSTGRES_URL="${1:-${SPRING_DATASOURCE_URL:-}}"
SQLITE_DB="${2:-${REPO_ROOT}/backend/swapu_db.sqlite}"
SCHEMA_SQL="${REPO_ROOT}/backend/src/main/resources/db/migration/V1__init_schema.sql"

if [[ -z "${POSTGRES_URL}" ]]; then
  echo "ERROR: Missing Postgres URL."
  echo "Pass it as the first argument or set SPRING_DATASOURCE_URL."
  exit 1
fi

if [[ ! -f "${SQLITE_DB}" ]]; then
  echo "ERROR: SQLite database not found at: ${SQLITE_DB}"
  exit 1
fi

if [[ ! -f "${SCHEMA_SQL}" ]]; then
  echo "ERROR: Schema file not found at: ${SCHEMA_SQL}"
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "ERROR: sqlite3 is required."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required."
  exit 1
fi

# Convert Spring JDBC URL (jdbc:postgresql://...) to a libpq URL for psql.
PSQL_URL="${POSTGRES_URL#jdbc:}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo "Exporting SQLite data from ${SQLITE_DB}..."

sqlite3 -csv -header -nullvalue '\N' "${SQLITE_DB}" \
  "SELECT id, campus, contact_url, email, password, phone_number, total_co2saved, total_swaps_completed, total_water_saved, username FROM users;" \
  > "${TMP_DIR}/users.csv"

sqlite3 -csv -header -nullvalue '\N' "${SQLITE_DB}" \
  "SELECT id, active, campus, category, clothing_type, color, color_tags, condition, description, gender, image_url, size, style, style_tags, title, user_id FROM clothing_items;" \
  > "${TMP_DIR}/clothing_items.csv"

sqlite3 -csv -header -nullvalue '\N' "${SQLITE_DB}" \
  "SELECT id, action, confirmed, item_id_to, timestamp, user_id_from FROM swipe_ledger;" \
  > "${TMP_DIR}/swipe_ledger.csv"

echo "Importing into Postgres..."

if [[ -n "${SPRING_DATASOURCE_USERNAME:-}" && -z "${PGUSER:-}" ]]; then
  export PGUSER="${SPRING_DATASOURCE_USERNAME}"
fi

if [[ -n "${SPRING_DATASOURCE_PASSWORD:-}" && -z "${PGPASSWORD:-}" ]]; then
  export PGPASSWORD="${SPRING_DATASOURCE_PASSWORD}"
fi

psql "${PSQL_URL}" -v ON_ERROR_STOP=1 -f "${SCHEMA_SQL}"

psql "${PSQL_URL}" \
  -v ON_ERROR_STOP=1 \
  -v users_csv="${TMP_DIR}/users.csv" \
  -v clothing_items_csv="${TMP_DIR}/clothing_items.csv" \
  -v swipe_ledger_csv="${TMP_DIR}/swipe_ledger.csv" <<'SQL'
BEGIN;

TRUNCATE TABLE swipe_ledger, clothing_items, users RESTART IDENTITY;

\copy users (id, campus, contact_url, email, password, phone_number, total_co2saved, total_swaps_completed, total_water_saved, username) FROM :'users_csv' WITH (FORMAT csv, HEADER true, NULL '\N');
\copy clothing_items (id, active, campus, category, clothing_type, color, color_tags, condition, description, gender, image_url, size, style, style_tags, title, user_id) FROM :'clothing_items_csv' WITH (FORMAT csv, HEADER true, NULL '\N');
\copy swipe_ledger (id, action, confirmed, item_id_to, timestamp, user_id_from) FROM :'swipe_ledger_csv' WITH (FORMAT csv, HEADER true, NULL '\N');

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM users;
SELECT setval(pg_get_serial_sequence('clothing_items', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM clothing_items;
SELECT setval(pg_get_serial_sequence('swipe_ledger', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM swipe_ledger;

COMMIT;
SQL

echo "Migration complete."
