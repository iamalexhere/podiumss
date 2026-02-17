# Score System

A real-time point scoring system with live leaderboard, built with SolidJS and Go.

## Features

- **Admin Dashboard** - Create events, manage groups and participants
- **Game Management** - Multiple scoring modes (incremental/absolute)
- **Live Leaderboard** - Real-time updates via WebSocket
- **Mobile-First Design** - Responsive UI optimized for mobile devices

## Tech Stack

- **Frontend**: SolidJS + Vite + TypeScript
- **Backend**: Gin (Go) + SQLite (GORM)
- **Realtime**: WebSocket (Gorilla)
- **Auth**: JWT tokens

## Development

### Prerequisites

- Go 1.21+
- Bun or Node.js 18+
- SQLite3

### Setup

```bash
# Install dependencies
bun install

# Create admin user (first run)
bun run seed

# Start development servers
bun run dev          # Frontend on http://localhost:3000
bun run dev:backend  # Backend on http://localhost:8080
```

### Build

```bash
# Build frontend and backend
./scripts/build.sh

# Or individually
bun run build           # Frontend -> dist/
bun run build:backend   # Backend -> dist/server
```

### Project Structure

```
src/
  features/           # Feature-based modules
    auth/             # Login, authentication
    events/           # Event management
    participants/     # Groups and participants
    games/            # Games and scoring
    leaderboard/      # Live leaderboard
  hooks/              # Custom hooks (useWebSocket)
  lib/                # API client
  styles/             # Global CSS
backend/
  handlers/           # HTTP handlers
  middleware/         # Auth, CORS
  models/             # GORM models
  websocket/          # WebSocket hub
deploy/               # Deployment scripts
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

### Quick Deploy (Debian)

```bash
# Clone and install
git clone <repo-url> /opt/score-system
cd /opt/score-system
sudo ./deploy/install.sh

# Create admin user
sudo -u score-system /opt/score-system/dist/seed

# Configure Traefik to proxy to http://127.0.0.1:8080
```

### Update

```bash
sudo /opt/score-system/deploy/update.sh
```

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/events | List active events |
| GET | /api/events/:slug/leaderboard | Get leaderboard |
| GET | /api/events/:slug/ws | WebSocket for realtime |

### Admin (requires JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/events | List own events |
| POST | /api/admin/events | Create event |
| PUT | /api/admin/events/:id | Update event |
| DELETE | /api/admin/events/:id | Delete event |