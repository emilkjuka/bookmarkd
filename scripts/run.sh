#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
	cat <<'EOF'
Usage: scripts/run.sh [options]

Creates .env if missing, generates BETTER_AUTH_SECRET when empty, builds and starts Bookmarkd.

Options:
  --native      Build and run with Bun instead of Docker
  --foreground  Run Docker in the foreground (default: detached)
  --help        Show this help

Examples:
  ./scripts/run.sh                 # Docker: build + start in background
  ./scripts/run.sh --foreground    # Docker: build + start with logs attached
  ./scripts/run.sh --native        # Bun: install, db push, build, start
EOF
}

ensure_env() {
	if [[ ! -f .env ]]; then
		cp .env.example .env
		echo "Created .env from .env.example"
	fi

	if ! grep -qE '^BETTER_AUTH_SECRET=.+$' .env; then
		secret="$(openssl rand -base64 32)"
		if grep -q '^BETTER_AUTH_SECRET=' .env; then
			sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${secret}|" .env
		else
			echo "BETTER_AUTH_SECRET=${secret}" >> .env
		fi
		echo "Generated BETTER_AUTH_SECRET"
	fi

	if grep -qE '^ORIGIN=http://localhost:3000$' .env; then
		cat <<'EOF'

Reminder: set ORIGIN in .env to the URL you use in the browser
  (e.g. http://100.64.0.5:3000). Auth cookies depend on it.

EOF
	fi
}

run_docker() {
	command -v docker >/dev/null || {
		echo "Docker is not installed. See docs/DEPLOY.md for setup."
		exit 1
	}

	ensure_env

	if [[ "${FOREGROUND}" == "1" ]]; then
		docker compose up --build
	else
		docker compose up -d --build
		echo ""
		echo "Bookmarkd is running. Check status: docker compose ps"
		echo "View logs: docker compose logs -f bookmarkd"
	fi
}

run_native() {
	command -v bun >/dev/null || {
		echo "Bun is not installed. See https://bun.sh"
		exit 1
	}

	ensure_env
	bun install --frozen-lockfile
	bun run db:push:force
	bun run build
	exec bun run start
}

FOREGROUND=0
MODE=docker

while [[ $# -gt 0 ]]; do
	case "$1" in
		--native)
			MODE=native
			shift
			;;
		--foreground | -f)
			FOREGROUND=1
			shift
			;;
		--help | -h)
			usage
			exit 0
			;;
		*)
			echo "Unknown option: $1"
			usage
			exit 1
			;;
	esac
done

case "$MODE" in
	docker) run_docker ;;
	native) run_native ;;
esac
