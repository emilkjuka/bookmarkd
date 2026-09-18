# syntax=docker/dockerfile:1

FROM oven/bun:1 AS base
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS builder
COPY . .
ARG ORIGIN=http://localhost:3000
ARG BETTER_AUTH_SECRET=build-time-secret-minimum-32-characters
ARG DISABLE_CSRF=false
ENV DATABASE_URL=/tmp/build.db \
	ORIGIN=${ORIGIN} \
	BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
	DISABLE_CSRF=${DISABLE_CSRF}
# .env is dockerignored — write production env so Vite + SvelteKit env both see ORIGIN at build time
RUN printf 'ORIGIN=%s\nBETTER_AUTH_SECRET=%s\nDISABLE_CSRF=%s\n' \
		"${ORIGIN}" "${BETTER_AUTH_SECRET}" "${DISABLE_CSRF}" > .env.production \
	&& echo "Building with ORIGIN=${ORIGIN} DISABLE_CSRF=${DISABLE_CSRF}" \
	&& bun run build \
	&& baked="$(grep -rho 'const origin = \"[^\"]*\"' build/server/chunks/handler*.js | head -1 | cut -d\" -f2)" \
	&& if [ "${DISABLE_CSRF}" != "true" ] && [ -n "${ORIGIN}" ] && [ "${baked}" != "${ORIGIN}" ]; then \
		echo "ERROR: ORIGIN=${ORIGIN} was not baked into the build (got: ${baked:-<empty>})" >&2; \
		exit 1; \
	fi

FROM base AS runner
ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=3000 \
	DATABASE_URL=/data/bookmarkd.db

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/lib/server/db ./src/lib/server/db
COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
	&& mkdir -p /data

VOLUME /data
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD bun -e "fetch('http://127.0.0.1:3000/login').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
