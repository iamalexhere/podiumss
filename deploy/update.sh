#!/bin/bash

set -e

APP_NAME="score-system"
APP_DIR="/opt/$APP_NAME"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
fi

cd "$APP_DIR"

log_info "Updating Score System..."

log_info "[1/6] Pulling latest changes..."
su "$APP_NAME" -c "cd '$APP_DIR' && git pull"

log_info "[2/6] Installing dependencies..."
if command -v bun &> /dev/null; then
    su "$APP_NAME" -c "cd '$APP_DIR' && bun install"
else
    su "$APP_NAME" -c "cd '$APP_DIR' && npm install"
fi

log_info "[3/6] Building frontend..."
if command -v bun &> /dev/null; then
    su "$APP_NAME" -c "cd '$APP_DIR' && bun run build"
else
    su "$APP_NAME" -c "cd '$APP_DIR' && npm run build"
fi

log_info "[4/6] Building backend..."
su "$APP_NAME" -c "cd '$APP_DIR/backend' && go build -ldflags='-s -w' -o '../dist/server' main.go && go build -ldflags='-s -w' -o '../dist/seed' cmd/seed/main.go"

log_info "[5/6] Setting permissions..."
chown -R "$APP_NAME:$APP_NAME" "$APP_DIR"

log_info "[6/6] Restarting service..."
systemctl restart "$APP_NAME"

sleep 2

if systemctl is-active --quiet "$APP_NAME"; then
    log_info "Update complete! Service is running."
else
    log_error "Service failed to start"
    journalctl -u "$APP_NAME" --no-pager -n 20
    exit 1
fi
