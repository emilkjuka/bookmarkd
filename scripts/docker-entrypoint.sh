#!/bin/sh
set -e

if [ -z "${ORIGIN:-}" ]; then
	echo "ERROR: ORIGIN is not set. Set it to the URL you use in your browser (your reverse proxy address)." >&2
	exit 1
fi

baked_origin="$(grep -rho 'const origin = \"[^\"]*\"' /app/build/server/chunks/handler*.js 2>/dev/null | head -1 | cut -d\" -f2 || true)"
if [ -n "$baked_origin" ] && [ "$baked_origin" != "$ORIGIN" ]; then
	echo "WARNING: Runtime ORIGIN=$ORIGIN does not match baked CSRF origin ($baked_origin)." >&2
	echo "         Rebuild: ./scripts/run.sh --no-cache" >&2
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
