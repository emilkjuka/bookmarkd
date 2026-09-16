# Bookmarkd

Self-hostable bookmark manager built with SvelteKit, SQLite, and Better Auth.

## Development

```sh
bun install
cp .env.example .env
bun run dev
```

## Production (Docker)

```sh
cp .env.example .env
# Set ORIGIN and BETTER_AUTH_SECRET in .env
docker compose up -d --build
```

See [docs/DEPLOY.md](./docs/DEPLOY.md) for Proxmox LXC setup, HTTPS, and backups.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Run production build locally |
| `bun run db:push` | Apply schema to local database |
