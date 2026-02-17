#!/bin/bash

set -e

echo "Building Score System..."

echo "[1/4] Installing dependencies..."
if command -v bun &> /dev/null; then
    bun install
else
    npm install
fi

echo "[2/4] Building frontend..."
if command -v bun &> /dev/null; then
    bun run build
else
    npm run build
fi

echo "[3/4] Building backend..."
cd backend
go build -ldflags="-s -w" -o "../dist/server" main.go
go build -ldflags="-s -w" -o "../dist/seed" cmd/seed/main.go
cd ..

echo "[4/4] Build complete!"

ls -la dist/
