#!/usr/bin/env bash
# Starts Xvfb on :99 so headed Chromium can launch inside the devcontainer.
# Needed by the VS Code Playwright Test extension when "Show browser" is on,
# and by any `playwright test --headed` invocation. Idempotent — safe to run
# on every postStart.

set -euo pipefail

DISPLAY_NUM=99
SOCKET="/tmp/.X11-unix/X${DISPLAY_NUM}"
LOCK="/tmp/.X${DISPLAY_NUM}-lock"

if pgrep -f "Xvfb :${DISPLAY_NUM}" >/dev/null 2>&1; then
  echo "Xvfb already running on :${DISPLAY_NUM}"
  exit 0
fi

# Stale lock from a previous container start (Xvfb refuses to start otherwise).
[ -e "$LOCK" ] && rm -f "$LOCK"

echo "Starting Xvfb on :${DISPLAY_NUM}"
nohup Xvfb ":${DISPLAY_NUM}" -screen 0 1280x1024x24 -nolisten tcp \
  >/tmp/xvfb.log 2>&1 &
disown

for _ in $(seq 1 30); do
  if [ -S "$SOCKET" ]; then
    echo "Xvfb is up on :${DISPLAY_NUM}"
    exit 0
  fi
  sleep 0.1
done

echo "WARNING: Xvfb did not become ready; see /tmp/xvfb.log" >&2
# Don't fail postStart over this — headless tests still work without Xvfb.
exit 0
