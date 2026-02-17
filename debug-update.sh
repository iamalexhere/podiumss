#!/bin/bash

# Debug script for update issues
# Run with: sudo bash debug-update.sh

echo "========================================="
echo "Score System Update Troubleshooting"
echo "========================================="
echo ""

echo "1. Checking bun installation..."
echo "   Root user bun location:"
command -v bun || echo "   Not found in PATH"
ls -la /usr/local/bin/bun 2>/dev/null && echo "   Found: /usr/local/bin/bun" || echo "   Not found: /usr/local/bin/bun"
ls -la /home/alex/.bun/bin/bun 2>/dev/null && echo "   Found: /home/alex/.bun/bin/bun" || echo "   Not found: /home/alex/.bun/bin/bun"

echo ""
echo "2. Testing bun as score-system user..."
echo "   Direct execution test:"
sudo su score-system -c "/usr/local/bin/bun --version" 2>&1 || echo "   Failed to run bun"

echo ""
echo "3. Testing git pull as score-system user..."
sudo su score-system -c "cd /opt/score-system && git pull" 2>&1

echo ""
echo "4. Checking /opt/score-system permissions..."
ls -ld /opt/score-system
ls -la /opt/score-system/.env

echo ""
echo "5. Testing bun install (this may take a moment)..."
sudo su score-system -c "cd /opt/score-system && /usr/local/bin/bun install" 2>&1

echo ""
echo "6. Full update.sh execution with debug..."
bash -x /opt/score-system/deploy/update.sh 2>&1 | head -100

echo ""
echo "========================================="
echo "Debug complete!"
echo "========================================="
