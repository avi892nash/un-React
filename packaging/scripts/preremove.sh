#!/bin/sh
# Runs before the .deb is removed. Stops the service + timer.
set -e

if [ -d /run/systemd/system ]; then
    systemctl stop unreact-platform-update.timer || true
    systemctl stop unreact-platform.service || true
    systemctl disable unreact-platform-update.timer || true
    systemctl disable unreact-platform.service || true
fi

exit 0
