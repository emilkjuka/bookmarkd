# Self-hosting Bookmarkd

Bookmarkd is designed to run as a single container with a persistent SQLite volume. This guide covers deployment on a **Proxmox LXC** container.

## Architecture

```text
Internet
   │
   ▼
Reverse proxy (Caddy / NPM / Traefik)  ← optional but recommended for HTTPS
   │
   ▼
Docker: bookmarkd (:3000)
   │
   └── volume: /data/bookmarkd.db
```

One container, one SQLite file, no external database required.

## Proxmox LXC strategy

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

```bash
ORIGIN=https://bookmarks.example.com
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BOOKMARKD_PORT=3000
```

Build and start:

```bash
docker compose up -d --build
```

Verify:

```bash
docker compose ps
docker compose logs -f bookmarkd
curl -I http://127.0.0.1:3000/login
```

### 4. HTTPS with Caddy (recommended)

Install Caddy on the same LXC:

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

Ensure `ORIGIN` in `.env` matches your public HTTPS URL, then restart the app:

```bash
docker compose up -d
```

### 5. Backups

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
docker compose up -d --build
```

Schema changes are applied automatically on container start via `drizzle-kit push`.

## Alternative: Docker on the Proxmox host

If you prefer not to run Docker inside LXC:

1. Run Bookmarkd on the **Proxmox host** (or a dedicated VM) with Docker.
2. Use an LXC only as a lightweight jump box, or skip LXC entirely.

LXC + Docker is still a good fit when you want isolated, resource-limited workloads on Proxmox without a full VM.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ORIGIN` | Yes | Public base URL, e.g. `https://bookmarks.example.com` |
| `BETTER_AUTH_SECRET` | Yes | 32+ character secret for auth tokens |
| `DATABASE_URL` | Auto in Docker | Path to SQLite file (`/data/bookmarkd.db` in Compose) |
| `HOST` | Auto | Bind address (`0.0.0.0` in Docker) |
| `PORT` | Auto | Listen port (`3000`) |
| `BOOKMARKD_PORT` | No | Host port mapped by Compose (default `3000`) |

## Troubleshooting

**Auth cookies not working** — `ORIGIN` must exactly match the URL in your browser (scheme + host + port if non-standard).

**Permission errors on `/data`** — ensure the Docker volume is writable; avoid bind-mounting a root-owned path without correct permissions.

**Container restart loop** — check logs: `docker compose logs bookmarkd`. Usually a missing `BETTER_AUTH_SECRET` or invalid `ORIGIN`.

**Docker won't start inside LXC** — confirm `nesting=1` is enabled on the container.
