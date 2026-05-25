#!/bin/sh
# Runs after the .deb is unpacked. Creates the service user, fixes
# permissions, then enables + starts the systemd units.
set -e

USER_NAME=unreact-platform
GROUP_NAME=unreact-platform
HOME_DIR=/opt/unreact-platform

# 1. Create system user/group if missing
if ! getent group "$GROUP_NAME" >/dev/null 2>&1; then
    addgroup --system "$GROUP_NAME"
fi
if ! id -u "$USER_NAME" >/dev/null 2>&1; then
    adduser --system \
        --ingroup "$GROUP_NAME" \
        --home "$HOME_DIR" \
        --no-create-home \
        --shell /usr/sbin/nologin \
        --gecos "unreact-platform service user" \
        "$USER_NAME"
fi

# 2. Ownership + permissions
chown -R "$USER_NAME":"$GROUP_NAME" "$HOME_DIR"
chmod 0750 "$HOME_DIR"

if [ -d /etc/unreact-platform ]; then
    chown -R root:"$GROUP_NAME" /etc/unreact-platform
    chmod 0750 /etc/unreact-platform
    chmod 0640 /etc/unreact-platform/unreact-platform.env || true
fi

# 3. Seed /var/lib/unreact-platform/installed-tag so the updater's first run
# on a fresh install knows what version is on disk and doesn't re-download.
mkdir -p /var/lib/unreact-platform
INSTALLED_VERSION=$(dpkg-query -W -f='${Version}' unreact-platform 2>/dev/null || echo "")
if [ -n "$INSTALLED_VERSION" ]; then
    echo "v${INSTALLED_VERSION}" > /var/lib/unreact-platform/installed-tag
fi

# 4. systemd: reload, enable + (re)start service, enable auto-upgrade timer
if [ -d /run/systemd/system ]; then
    systemctl daemon-reload
    systemctl enable unreact-platform.service
    systemctl enable unreact-platform-update.timer
    systemctl restart unreact-platform.service
    systemctl start unreact-platform-update.timer
fi

cat <<EOF

unreact-platform installed successfully.

  Service:        systemctl status unreact-platform
  Logs:           journalctl -u unreact-platform -f
  Auto-upgrade:   systemctl list-timers unreact-platform-update.timer
  Configure:      /etc/unreact-platform/unreact-platform.env (then: systemctl restart unreact-platform)

Default URL:      http://localhost:28291

EOF

exit 0
