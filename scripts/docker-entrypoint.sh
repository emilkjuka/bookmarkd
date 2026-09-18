#!/bin/sh
set -e

if [ -z "${ORIGIN:-}" ]; then
	echo "ERROR: ORIGIN is not set. Add it to .env (e.g. ORIGIN=http://192.168.1.5:3000) and recreate the container." >&2
	exit 1
fi

baked_origin="$(grep -rho 'const origin = \"[^\"]*\"' /app/build/server/chunks/handler*.js 2>/dev/null | head -1 | cut -d\" -f2 || true)"
if [ -n "$baked_origin" ] && [ "$baked_origin" != "$ORIGIN" ]; then
	echo "WARNING: Runtime ORIGIN=$ORIGIN does not match the baked CSRF origin ($baked_origin)." >&2
	echo "         Form POSTs may return 403 until you rebuild: ./scripts/run.sh --no-cache" >&2
fi

echo "Bookmarkd ORIGIN=$ORIGIN"

DB_PATH="${DATABASE_URL:-/data/bookmarkd.db}"

if [ ! -f "$DB_PATH" ]; then
	echo "Initializing database at $DB_PATH"
	DATABASE_URL="$DB_PATH" bun run db:push:force
else
	echo "Applying database schema updates"
	DATABASE_URL="$DB_PATH" bun run db:push:force
fi

exec bun ./build/index.js
