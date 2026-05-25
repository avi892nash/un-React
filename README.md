# un-React tutorial platform

An interactive, step-by-step curriculum that teaches developers how to build a React-like framework from scratch. Read a concept on the left → write the missing piece in the editor → click **Run** → your code is Babel-transpiled, executed in a sandboxed iframe, and the rendered DOM is structurally diffed against the expected output. Pass → next step unlocks.

## Install on Debian, Ubuntu, or Raspberry Pi OS

Runs as a long-lived static-server service on any Debian-based Linux, including Raspberry Pi (the `.deb` is `arch: all` — pure Node, no native binaries, so the same package works on amd64 / arm64 / armhf). Auto-upgrades are built in via a systemd timer that polls `/releases/latest` on GitHub — once installed, you don't have to touch it again to stay current.

> **Requires:** Debian 11+, Ubuntu 20.04+, or Raspberry Pi OS Bullseye/Bookworm, plus Node.js 14+. The package declares `Depends: nodejs (>= 14)`. If your distro's default Node is older, install a current version first via [NodeSource](https://github.com/nodesource/distributions):
>
> ```bash
> curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
> sudo apt install -y nodejs
> ```

### One-liner install

```bash
curl -fsSL https://github.com/avi892nash/un-React/releases/latest/download/unreact-platform.deb -o /tmp/unreact-platform.deb \
  && sudo apt install -y /tmp/unreact-platform.deb
```

That's it — the service is up at <http://localhost:28291>. From now on, the bundled `unreact-platform-update.timer` polls `/releases/latest` every 5 min (with up to 1 min of jitter) and applies new versions automatically.

#### Raspberry Pi specifics

The .deb works on Pi 3 / 4 / 5 out of the box. Two things worth knowing:

- **Port 80**: the default is `PORT=28291`. To bind 80 you either need to (a) edit `/etc/unreact-platform/unreact-platform.env` and add `CAP_NET_BIND_SERVICE` to the systemd unit, or (b) front the service with nginx / Caddy doing 80→28291 reverse-proxy (recommended for HTTPS).
- **Access from your LAN**: defaults to `HOSTNAME=0.0.0.0` so it's reachable at `http://<pi-hostname>.local:28291` or the Pi's IP without further config.

### How auto-upgrade works

The install enables two systemd units:

| Unit | What it does |
| --- | --- |
| `unreact-platform.service` | Runs `node /opt/unreact-platform/server.cjs` (hardened: dedicated `unreact-platform` user, `PrivateTmp`, `ProtectSystem=strict`, `LockPersonality`, …) |
| `unreact-platform-update.timer` | Every 5 min: `/usr/bin/unreact-platform-update` polls the GitHub Releases API, compares `tag_name` against `/var/lib/unreact-platform/installed-tag`, and `apt install`s the new `.deb` if they differ |

### Common operations

```bash
systemctl status unreact-platform                       # is it running?
journalctl -u unreact-platform -f                       # tail server logs
systemctl list-timers unreact-platform-update.timer     # when's the next upgrade check?
sudo systemctl disable --now unreact-platform-update.timer  # opt out of auto-upgrade
sudo /usr/bin/unreact-platform-update                   # force an upgrade check now
curl http://localhost:28291/healthz                      # liveness probe (returns 'ok')
```

### Configuration

Environment variables live in `/etc/unreact-platform/unreact-platform.env`. After editing, restart:

```bash
sudo nano /etc/unreact-platform/unreact-platform.env
sudo systemctl restart unreact-platform
```

Defaults:

```ini
PORT=28291
HOSTNAME=0.0.0.0
NODE_ENV=production
```

### Uninstall

```bash
sudo apt remove unreact-platform     # keeps /etc/unreact-platform and the service user
sudo apt purge unreact-platform      # also removes config dir + service user + /opt/unreact-platform
```

## Running locally (development)

```bash
npm install
npm run dev          # Vite dev server on http://localhost:5173
```

Other scripts:

```bash
npm run build        # produce dist/
npm run start        # run server.cjs against the built dist/ (port 28291)
npm test             # 22 tests: diff, transform, curriculum guardrail
npm run typecheck    # tsc --noEmit
npm run package:deb  # build a .deb locally (requires nfpm — see below)
```

## Cutting a release (maintainers)

Releases are automatic from `main` via [`semantic-release`](https://semantic-release.gitbook.io) — driven entirely by [Conventional Commits](https://www.conventionalcommits.org). The CI workflow at [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) handles versioning, changelog, GitHub Release creation, and attaching the `.deb` asset.

Commit-type → bump:

| Commit | Result |
| --- | --- |
| `feat: …` | minor bump, release |
| `fix: …` | patch bump, release |
| `perf: …` / `refactor: …` / `build: …` | patch bump, release |
| `docs: …` / `chore: …` / `ci: …` / `test: …` / `style: …` | no release |
| `feat!: …` or `BREAKING CHANGE:` footer | major bump, release |

PR validation: every PR runs `commitlint` (rules in [`.commitlintrc.json`](./.commitlintrc.json)) + typecheck + tests + .deb build + .deb smoke test on a clean runner (install, verify systemd units shipped, start the server, curl endpoints).

### Building a `.deb` locally

You need [nfpm](https://nfpm.goreleaser.com/install/) installed:

```bash
# Linux amd64
curl -sLO https://github.com/goreleaser/nfpm/releases/latest/download/nfpm_amd64.deb
sudo dpkg -i nfpm_amd64.deb

# macOS
brew install goreleaser/tap/nfpm
```

Then:

```bash
npm install
npm run build
npm run package:deb          # produces dist-deb/unreact-platform.deb
# To pin a version string:
npm run package:deb -- 1.2.3
```

The output is `dist-deb/unreact-platform.deb` plus a versioned twin `dist-deb/unreact-platform_<VERSION>_all.deb`.

### Manual release dry-run

```bash
npm run release:dry    # prints what semantic-release would do, without doing it
```

## What ships in the .deb

```
/opt/unreact-platform/
  ├─ dist/              # static Vite SPA bundle (HTML + assets)
  └─ server.cjs         # ~80-line Node static server with SPA fallback,
                        # MIME map, and /healthz

/lib/systemd/system/
  ├─ unreact-platform.service          # main service unit (hardened)
  ├─ unreact-platform-update.service   # oneshot updater
  └─ unreact-platform-update.timer     # 5-min poll, 1-min jitter

/usr/bin/unreact-platform-update       # the GitHub Releases poller
/etc/unreact-platform/unreact-platform.env   # user-editable conffile
/usr/share/doc/unreact-platform/CHANGELOG.md
```

## Architecture

See [`DESIGN_BRIEF.md`](./DESIGN_BRIEF.md) for the full design rationale.
