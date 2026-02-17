# Deployment Guide

This guide covers deploying Score System to a Debian VPS with Traefik as reverse proxy.

## Prerequisites

- Debian 11/12 VPS
- Go 1.21+ installed
- Bun or Node.js installed
- Git
- Traefik configured with Let's Encrypt

## Quick Install

```bash
# Clone repository
git clone https://github.com/iamalexhere/podiumss.git /opt/score-system
cd /opt/score-system

# Run installer
sudo ./deploy/install.sh
```

The installer will:
1. Create `score-system` system user
2. Generate JWT secret
3. Build frontend and backend
4. Install systemd service
5. Start the service

## Post-Install

### Create Admin User

```bash
sudo -u score-system /opt/score-system/dist/seed
```

### Configure Traefik

Create a router configuration for Traefik:

**File-based (static config):**

```yaml
# /etc/traefik/config/score-system.yml
http:
  routers:
    score-system:
      rule: "Host(`scores.yourdomain.com`)"
      entryPoints:
        - websecure
      service: score-system
      tls:
        certResolver: letsencrypt
  services:
    score-system:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:8080"
```

**Docker labels (if Traefik is in Docker):**

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.score-system.rule=Host(`scores.yourdomain.com`)"
  - "traefik.http.routers.score-system.tls.certresolver=letsencrypt"
  - "traefik.http.services.score-system.loadbalancer.server.port=8080"
```

## Configuration

Environment variables are set in `/opt/score-system/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | SQLite database path | `data/score.db` |
| `JWT_SECRET` | Secret for JWT tokens | *(generated)* |
| `FRONTEND_DIST` | Path to static files | `dist` |
| `FRONTEND_URL` | CORS origin (empty = same-origin) | *(empty)* |

After editing `.env`:

```bash
sudo systemctl restart score-system
```

## Updating

```bash
sudo /opt/score-system/deploy/update.sh
```

This script:
1. Pulls latest changes from git
2. Installs dependencies
3. Rebuilds frontend and backend
4. Restarts the service

## Manual Operations

```bash
# Check status
sudo systemctl status score-system

# View logs
sudo journalctl -u score-system -f

# Restart service
sudo systemctl restart score-system

# Stop service
sudo systemctl stop score-system

# Start service
sudo systemctl start score-system
```

## File Locations

| Path | Description |
|------|-------------|
| `/opt/score-system/` | Application directory |
| `/opt/score-system/data/` | Database directory |
| `/opt/score-system/dist/` | Built binaries and frontend |
| `/opt/score-system/.env` | Environment configuration |
| `/etc/systemd/system/score-system.service` | Systemd unit file |

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u score-system -n 50

# Check if port is in use
sudo ss -tlnp | grep 8080

# Check permissions
ls -la /opt/score-system/
```

### Permission denied errors

```bash
# Fix ownership
sudo chown -R score-system:score-system /opt/score-system
sudo chmod 700 /opt/score-system
sudo chmod 600 /opt/score-system/.env
```

### Database locked

```bash
# Stop service
sudo systemctl stop score-system

# Check for processes
lsof /opt/score-system/data/score.db

# Start service
sudo systemctl start score-system
```

### WebSocket not working

Ensure Traefik is configured to allow WebSocket upgrades. This is typically automatic, but check:

```yaml
# Traefik should not have any middleware blocking websockets
# The /api/events/:slug/ws endpoint handles websocket connections
```

## Security Notes

- JWT secret should be kept secure and rotated periodically
- The systemd service runs with limited privileges (`NoNewPrivileges`, `ProtectSystem`, `ProtectHome`)
- Database directory is only accessible by the `score-system` user
- Use HTTPS (via Traefik + Let's Encrypt) in production

## Backup

```bash
# Backup database
cp /opt/score-system/data/score.db /backup/score-$(date +%Y%m%d).db

# Backup config
cp /opt/score-system/.env /backup/score-env-$(date +%Y%m%d)
```

## Restore

```bash
# Stop service
sudo systemctl stop score-system

# Restore database
cp /backup/score-20240101.db /opt/score-system/data/score.db
chown score-system:score-system /opt/score-system/data/score.db

# Start service
sudo systemctl start score-system
```
