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
  --no-cache    Rebuild the Docker image without cache
  --help        Show this help

Examples:
  ./scripts/run.sh                 # Docker: build + start in background
  ./scripts/run.sh --foreground    # Docker: build + start with logs attached
  ./scripts/run.sh --no-cache      # Force a full rebuild (use after changing ORIGIN)
  ./scripts/run.sh --native        # Bun: install, db push, build, start
EOF
}

read_env_var() {
	local key="$1"
	local value
	value="$(grep -E "^${key}=" .env | tail -1 | cut -d= -f2- | tr -d '\r')"
	value="${value#\"}"
	value="${value%\"}"
	value="${value#\'}"
	value="${value%\'}"
	value="${value%/}"
	printf '%s' "$value"
}

normalize_origin() {
	local origin="$1"
	local port="$2"

	# Already has an explicit port
	if [[ "$origin" =~ ^https?://[^:/]+:[0-9]+ ]]; then
		printf '%s' "$origin"
		return
	fi

	# Host only — append the published port (e.g. http://192.168.1.5 → http://192.168.1.5:3000)
	if [[ "$origin" =~ ^(https?://[^:/]+)$ ]]; then
		printf '%s' "${BASH_REMATCH[1]}:${port}"
		return
	fi

	printf '%s' "$origin"
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
}

load_build_env() {
	ensure_env

	local raw_origin port
	raw_origin="$(read_env_var ORIGIN)"
	port="$(read_env_var BOOKMARKD_PORT)"
	port="${port:-3000}"

	if [[ -z "$raw_origin" ]]; then
		echo "Error: ORIGIN is not set in .env" >&2
		exit 1
	fi

	ORIGIN="$(normalize_origin "$raw_origin" "$port")"
	BETTER_AUTH_SECRET="$(read_env_var BETTER_AUTH_SECRET)"
	DISABLE_CSRF="$(read_env_var DISABLE_CSRF)"
	DISABLE_CSRF="${DISABLE_CSRF:-false}"

	if [[ -z "$BETTER_AUTH_SECRET" ]]; then
		echo "Error: BETTER_AUTH_SECRET is not set in .env" >&2
		exit 1
	fi

	if [[ "$ORIGIN" != "$raw_origin" ]]; then
		echo "Note: normalized ORIGIN from ${raw_origin} → ${ORIGIN}"
		echo "      (include :${port} in .env to match the URL in your browser exactly)"
		if grep -q '^ORIGIN=' .env; then
			sed -i "s|^ORIGIN=.*|ORIGIN=${ORIGIN}|" .env
		else
			echo "ORIGIN=${ORIGIN}" >> .env
		fi
	fi

	export ORIGIN BETTER_AUTH_SECRET DISABLE_CSRF BOOKMARKD_PORT="$port"
	echo "Building with ORIGIN=${ORIGIN}"
	if [[ "$DISABLE_CSRF" == "true" ]]; then
		echo "CSRF origin checks disabled (DISABLE_CSRF=true)"
	fi
}

verify_baked_origin() {
	local baked
	baked="$(docker compose exec -T bookmarkd sh -c 'grep -ho "const origin = \"[^\"]*\"" build/server/chunks/handler*.js 2>/dev/null | head -1 | cut -d\" -f2' || true)"
	if [[ -n "$baked" ]]; then
		echo "Baked server origin: ${baked}"
		if [[ "$baked" != "$ORIGIN" ]]; then
			echo "Warning: baked origin does not match ORIGIN=${ORIGIN}" >&2
			echo "         Run ./scripts/run.sh --no-cache and try again." >&2
		fi
	else
		echo "Could not read baked origin from container (build may still be starting)"
	fi
}

run_docker() {
	command -v docker >/dev/null || {
		echo "Docker is not installed. See docs/DEPLOY.md for setup."
		exit 1
	}

	load_build_env

	local -a build_args=(--build-arg "ORIGIN=${ORIGIN}" --build-arg "BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}" --build-arg "DISABLE_CSRF=${DISABLE_CSRF}")
	if [[ "${NO_CACHE}" == "1" ]]; then
		build_args=(--no-cache "${build_args[@]}")
	fi

	docker compose build "${build_args[@]}"

	if [[ "${FOREGROUND}" == "1" ]]; then
		docker compose up --force-recreate
	else
		docker compose up -d --force-recreate
		echo ""
		verify_baked_origin
		echo ""
		echo "Bookmarkd is running. Open: ${ORIGIN}"
		echo "Check status: docker compose ps"
		echo "View logs: docker compose logs -f bookmarkd"
	fi
}

run_native() {
	command -v bun >/dev/null || {
		echo "Bun is not installed. See https://bun.sh"
		exit 1
	}

	load_build_env
	bun install --frozen-lockfile
	bun run db:push:force
	bun run build
	exec bun run start
}

FOREGROUND=0
NO_CACHE=0
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
		--no-cache)
			NO_CACHE=1
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
