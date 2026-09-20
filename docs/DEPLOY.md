# Self-hosting Bookmarkd

Bookmarkd runs as a single Docker container with a persistent SQLite volume. This guide covers deployment on a **Proxmox LXC** container (or any Docker host).

## Architecture

### Reverse proxy (recommended)

Point your reverse proxy at the Docker container and set `ORIGIN` to the URL you use in the browser.

```text
Browser
   │
   ▼
Reverse proxy  ← ORIGIN (e.g. http://bookmarks.local)
   │
   ▼
Docker: bookmarkd (:3000)
   │
   └── volume: /data/bookmarkd.db
```

`ORIGIN` must **exactly** match what you type in the address bar (scheme, host, and port if non-standard). Auth cookies and CSRF checks depend on it.

### Direct container access (optional)

You can skip a reverse proxy and open `http://<host-ip>:3000` directly. Set `ORIGIN` to that same URL.

## Proxmox LXC setup

### 1. Create the LXC container

In Proxmox, create an **Ubuntu 24.04** or **Debian 12** LXC:

| Setting | Recommendation |
|---------|----------------|
| CPU | 1–2 cores |
| RAM | 1–2 GB |
| Disk | 8 GB+ |
| Features | `nesting=1` (required for Docker inside LXC) |

For unprivileged containers, enable nesting under **Options → Features**:

```text
nesting=1
```

If Docker fails to start, you may also need `keyctl=1` on some Proxmox versions.

### 2. Prepare the container

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

### 3. Deploy Bookmarkd

```bash
git clone https://github.com/YOUR_USER/bukmarkd.git
cd bukmarkd
cp .env.example .env
```

Edit `.env`:

```env
ORIGIN=http://bookmarks.local
BETTER_AUTH_SECRET=<output of: openssl rand -base64 32>
HOST_PORT=3000
```

Build and start:

```bash
./scripts/run.sh
```

Configure your reverse proxy to forward traffic to `http://127.0.0.1:3000` (or the LXC IP on port 3000).

Verify the container:

```bash
docker compose ps
docker compose logs -f bookmarkd
curl -I http://127.0.0.1:3000/login
```

Then open your `ORIGIN` URL in a browser and sign in.

### Changing `ORIGIN`

After editing `ORIGIN` in `.env`, rebuild without cache:

```bash
./scripts/run.sh --no-cache
```

Restarting alone does not update the baked CSRF origin or reload env — use `./scripts/run.sh` or `docker compose up -d --force-recreate` after changing `.env`.

## Backups

The entire database is a single file inside the Docker volume:

```bash
# Find volume path
docker volume inspect bukmarkd_bookmarkd_data

# Or copy out directly
docker compose exec bookmarkd cp /data/bookmarkd.db /tmp/backup.db
docker cp $(docker compose ps -q bookmarkd):/data/bookmarkd.db ./bookmarkd-$(date +%F).db
```

Schedule this with cron on the LXC host.

## Updates

```bash
cd bukmarkd
git pull
./scripts/run.sh
```

Schema changes are applied automatically on container start via `drizzle-kit push`.

## HTTPS with Caddy (optional)

If you want TLS on a public domain, run Caddy (or any reverse proxy) in front of the container.

Install Caddy on the LXC:

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

Copy and edit the example config:

```bash
cp Caddyfile.example /etc/caddy/Caddyfile
# Replace bookmarks.example.com with your domain
systemctl reload caddy
```

Set `ORIGIN` to your HTTPS URL and rebuild:

```env
ORIGIN=https://bookmarks.example.com
```

```bash
./scripts/run.sh --no-cache
```

## Alternative: Docker on the Proxmox host

If you prefer not to run Docker inside LXC:

1. Run Bookmarkd on the **Proxmox host** (or a dedicated VM) with Docker.
2. Use an LXC only as a lightweight jump box, or skip LXC entirely.

LXC + Docker is still a good fit when you want isolated, resource-limited workloads on Proxmox without a full VM.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ORIGIN` | Yes | URL you use in the browser (reverse proxy address), e.g. `http://bookmarks.local` |
| `BETTER_AUTH_SECRET` | Yes | 32+ character secret for auth tokens |
| `DISABLE_CSRF` | No | Set to `true` only as a last resort if form POSTs return 403 |
| `DATABASE_URL` | Auto in Docker | Path to SQLite file (`/data/bookmarkd.db` in Compose) |
| `HOST` | Auto | Bind address (`0.0.0.0` in Docker) |
| `PORT` | Auto | Listen port (`3000`) |
| `HOST_PORT` | No | Host port mapped by Compose (default `3000`) |

## Troubleshooting

**"Invalid origin" on login** — `ORIGIN` must exactly match the URL in your browser. Rebuild after changing it: `./scripts/run.sh --no-cache`. Check logs for `Bookmarkd ORIGIN=...`.

**403 "Cross-site POST form submissions are forbidden"** — `ORIGIN` in `.env` doesn't match the browser URL, or the image was built before `ORIGIN` was set. Rebuild with `./scripts/run.sh --no-cache`.

**Auth cookies not working** — same as above: `ORIGIN` must match the browser URL exactly (scheme + host + port if non-standard).

**Permission errors on `/data`** — ensure the Docker volume is writable; avoid bind-mounting a root-owned path without correct permissions.

**Container restart loop** — check logs: `docker compose logs bookmarkd`. Usually a missing `BETTER_AUTH_SECRET`, missing `ORIGIN`, or an outdated `@sveltejs/adapter-node` (must be `6.x` with SvelteKit 3).

**`Cannot find module '@sveltejs/kit/node/polyfills'`** — upgrade `@sveltejs/adapter-node` to `6.0.0-next.12` or later, then rebuild.

**Docker won't start inside LXC** — confirm `nesting=1` is enabled on the container.
