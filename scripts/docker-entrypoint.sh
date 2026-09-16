#!/bin/sh
set -e

DB_PATH="${DATABASE_URL:-/data/bookmarkd.db}"

if [ ! -f "$DB_PATH" ]; then
	echo "Initializing database at $DB_PATH"
	DATABASE_URL="$DB_PATH" bun run db:push:force
else
	echo "Applying database schema updates"
	DATABASE_URL="$DB_PATH" bun run db:push:force
fi

exec bun ./build/index.js
