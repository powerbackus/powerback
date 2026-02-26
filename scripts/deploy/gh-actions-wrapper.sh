#!/usr/bin/env bash
# GitHub Actions forced-command SSH wrapper
# Purpose:
# - Allow rsync (required for deployments)
# - Allow tightly scoped service control commands
# - Allow tightly scoped install command for server deps
# - Block everything else
# - NEVER emit output unless explicitly denying a command

set -euo pipefail

ORIG_CMD="${SSH_ORIGINAL_COMMAND:-}"

# ----------------------------------------
# 1. Allow rsync (critical)
# rsync uses: rsync --server ...
# Must exec with NO output beforehand
# ----------------------------------------
if [[ "$ORIG_CMD" == rsync\ --server* ]]; then
  exec $ORIG_CMD
fi

# ----------------------------------------
# 2. Allow controlled aliases / commands
# ----------------------------------------
case "$ORIG_CMD" in
  # Install backend deps on the server (no sudo required)
  pbnpminstall)
    cd /opt/powerback/app && /usr/bin/npm ci --omit=dev || exit 1
    ;;

  # Service controls (sudo, NOPASSWD required)
  # Note: Removed 'exec' to prevent broken pipe errors - shell stays alive for error handling
  pbrestart)
    /usr/bin/sudo -n /usr/bin/systemctl restart powerback.service || exit 1
    ;;
  nginxreload)
    /usr/bin/sudo -n /usr/bin/systemctl reload nginx || exit 1
    ;;

  *)
    # ------------------------------------
    # 3. Deny everything else
    # (minimal output, rsync-safe)
    # ------------------------------------
    echo "Command not allowed."
    exit 1
    ;;
esac

