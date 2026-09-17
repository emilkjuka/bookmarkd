# Self-hosting Bookmarkd

Bookmarkd runs as a single Docker container with a persistent SQLite volume. This guide covers deployment on a **Proxmox LXC** container.

## Architecture

### Private access via NetBird (recommended for personal use)

Same pattern as Home Assistant: run on your LAN, reach it from your devices through NetBird.

```text
Your devices (NetBird client)
   │
   ▼
NetBird mesh VPN
   │
   ▼
LXC: Docker bookmarkd (:3000)
   │
   └── volume: /data/bookmarkd.db
```

No public domain, no reverse proxy, no HTTPS required.

### Public internet (optional)

If you want to expose Bookmarkd on the public internet, add a reverse proxy with HTTPS (see [HTTPS with Caddy](#https-with-caddy-optional) below).

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

```bash
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BOOKMARKD_PORT=3000
```

Build and start:

```bash
docker compose up -d --build
```

Verify locally on the LXC:

```bash
docker compose ps
docker compose logs -f bookmarkd
curl -I http://127.0.0.1:3000/login
```

## NetBird access

Install the NetBird client on the LXC (or route to it from a peer that can reach the LXC on your LAN).

### Set `ORIGIN`

`ORIGIN` must **exactly** match the URL you type in your browser. Auth cookies depend on this.

Use your NetBird IP or hostname — and use it everywhere, including at home on the same network:

```env
# NetBird IP example
ORIGIN=http://100.64.0.5:3000

# Or NetBird hostname
ORIGIN=http://bookmarkd.netbird.cloud:3000
```

After setting `ORIGIN`, restart:

```bash
docker compose up -d
```

### Tips

- **Stick to one URL.** Switching between a LAN IP and a NetBird IP will break auth because `ORIGIN` only matches one.
- **HTTP is fine** on a private VPN. You don't need Caddy or TLS for NetBird-only access.
- **Firewall:** restrict port 3000 to NetBird peers if you expose it beyond localhost. NetBird ACLs can also limit access.

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
docker compose up -d --build
```

Schema changes are applied automatically on container start via `drizzle-kit push`.

## HTTPS with Caddy (optional)

Only needed if you want **public internet** access with a domain name. Skip this section for NetBird-only use.

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

Set `ORIGIN` to your public HTTPS URL and restart:

```env
ORIGIN=https://bookmarks.example.com
```

```bash
docker compose up -d
```

## Alternative: Docker on the Proxmox host

If you prefer not to run Docker inside LXC:

1. Run Bookmarkd on the **Proxmox host** (or a dedicated VM) with Docker.
2. Use an LXC only as a lightweight jump box, or skip LXC entirely.

LXC + Docker is still a good fit when you want isolated, resource-limited workloads on Proxmox without a full VM.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ORIGIN` | Yes | Base URL you use in the browser, e.g. `http://100.64.0.5:3000` (NetBird) or `https://bookmarks.example.com` (public) |
| `BETTER_AUTH_SECRET` | Yes | 32+ character secret for auth tokens |
| `DATABASE_URL` | Auto in Docker | Path to SQLite file (`/data/bookmarkd.db` in Compose) |
| `HOST` | Auto | Bind address (`0.0.0.0` in Docker) |
| `PORT` | Auto | Listen port (`3000`) |
| `BOOKMARKD_PORT` | No | Host port mapped by Compose (default `3000`) |

## Troubleshooting

**Auth cookies not working** — `ORIGIN` must exactly match the URL in your browser (scheme + host + port if non-standard).

**Permission errors on `/data`** — ensure the Docker volume is writable; avoid bind-mounting a root-owned path without correct permissions.

**Container restart loop** — check logs: `docker compose logs bookmarkd`. Usually a missing `BETTER_AUTH_SECRET`, invalid `ORIGIN`, or an outdated `@sveltejs/adapter-node` (must be `6.x` with SvelteKit 3).

**`Cannot find module '@sveltejs/kit/node/polyfills'`** — upgrade `@sveltejs/adapter-node` to `6.0.0-next.12` or later, then rebuild: `docker compose up -d --build`.

**Docker won't start inside LXC** — confirm `nesting=1` is enabled on the container.
