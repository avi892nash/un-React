#!/bin/sh
# Runs after the .deb is removed. On 'purge' also removes the service user
# and config dir; otherwise leaves data alone (Debian convention).
set -e

case "$1" in
    purge)
        if id -u unreact-platform >/dev/null 2>&1; then
            deluser --quiet unreact-platform || true
        fi
        if getent group unreact-platform >/dev/null 2>&1; then
            delgroup --quiet unreact-platform || true
        fi
        rm -rf /etc/unreact-platform
        rm -rf /opt/unreact-platform
        rm -rf /var/lib/unreact-platform
        ;;
    remove|upgrade|failed-upgrade|abort-install|abort-upgrade|disappear)
        # nothing to do
        ;;
    *)
        echo "postremove called with unknown argument '$1'" >&2
        exit 1
        ;;
esac

if [ -d /run/systemd/system ]; then
    systemctl daemon-reload || true
fi

exit 0
