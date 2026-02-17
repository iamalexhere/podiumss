#!/bin/bash

# Fix bun path for score-system user
# Run with: sudo bash fix-bun-path.sh

echo "Fixing bun installation for score-system user..."

# Check if bun exists
if [ ! -f /home/alex/.bun/bin/bun ]; then
    echo "ERROR: bun not found at /home/alex/.bun/bin/bun"
    echo "Please install bun first with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Create symlink
echo "Creating system-wide bun symlink..."
ln -sf /home/alex/.bun/bin/bun /usr/local/bin/bun

# Verify
echo "Verifying installation..."
if [ -L /usr/local/bin/bun ]; then
    echo "✓ Symlink created: /usr/local/bin/bun -> $(readlink /usr/local/bin/bun)"
else
    echo "✗ Failed to create symlink"
    exit 1
fi

# Test as score-system user
echo "Testing bun as score-system user..."
su score-system -c "/usr/local/bin/bun --version" && echo "✓ Bun works!" || echo "✗ Bun test failed"

echo ""
echo "Fix complete! Try running: sudo /opt/score-system/deploy/update.sh"
