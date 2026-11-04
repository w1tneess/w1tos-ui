# w1tOS UI

A dark, keyboard-first web interface for a home server running [CasaOS](https://github.com/IceWhaleTech/CasaOS).
It replaces only the web UI. The CasaOS backend, its APIs, Docker and your apps stay exactly as they are.

![Dashboard](docs/screenshots/dashboard.jpg)

> **Status: early, single-maintainer project.** Everything below marked *tested* was checked in a browser against
> the bundled mock backend. It has **not yet been run against a real CasaOS server**, so expect rough edges there.
> See [What is and isn't tested](#what-is-and-isnt-tested).

w1tOS UI is an independent fork of [IceWhaleTech/CasaOS-UI](https://github.com/IceWhaleTech/CasaOS-UI) (Apache-2.0).
It is not affiliated with or endorsed by IceWhale. "CasaOS" is their name for their product.

---

## What's different from the stock CasaOS UI

| Area | w1tOS UI |
|---|---|
| **Look** | Dusk plum and canyon-peach dark theme everywhere: no wallpaper, no blur. Every colour comes from one token set. A second theme, espresso-gold, is included. |
| **Login / first run** | Terminal-style prompt (`w1tos login:`), Enter to submit, inline errors |
| **Dashboard** | Bento grid (12 / 6 / 1 columns) with a status line: `w1t@w1tos · ↓ ↑ rates · clock`. CPU and memory shown as text meters, plus a containers card. |
| **Command palette** | `Ctrl+K` / `⌘K` to open apps, go to Files / App Store / Settings, or restart / shut down (you type the word to confirm). |
| **Privacy** | No telemetry posted to the message bus, and no request to IceWhale's blog RSS feed. App icons are the only third-party requests left. |
| **Build safety** | Only `NODE_ENV` and `VUE_APP_*` reach the bundle. The stock build embedded the whole build-machine environment (paths, user names, any tokens). |
| **Removed** | Wallpapers, the news feed, the Discord/feedback promos, the app-store "Featured" slider, recommended-app cards, and every language except English |

<table>
<tr>
<td><img src="docs/screenshots/login.jpg" alt="Login prompt"></td>
<td><img src="docs/screenshots/palette.jpg" alt="Command palette"></td>
</tr>
<tr>
<td align="center">Login</td>
<td align="center">Command palette</td>
</tr>
</table>

![Files](docs/screenshots/files.jpg)

## What is and isn't tested

| Area | State |
|---|---|
| Production build, unit tests (`pnpm test`), env-leak check | ✅ passes, also in CI |
| Login, dashboard layout (1400 px, 900 px, 360 px with no horizontal scroll), Files, App Store, Settings menu, command palette | ✅ tested against the mock backend |
| Live stats and network rates (Socket.IO), terminal and logs, installing apps | ⚠️ not tested: needs a real server, because the mock has no socket |
| Signing in through Cloudflare Access, the deploy script, the server swap script | ⚠️ written, not yet run |

Known gaps:
- Restarting from the palette while Files is open shows the "Restarting" box behind Files.
- The palette has no "logs / terminal for an app" action yet.
- Favicons and home-screen icons are still the stock images.
- `color-mix()` needs a 2023-or-newer browser.

## Requirements

- A server running CasaOS. This UI is built from CasaOS-UI **v0.4.5** and expects that version's API; other versions may differ.
- To build: Node 22 LTS and pnpm 9.0.6 (`corepack enable` provides it)

## Try it locally, without a server

```bash
pnpm install
pnpm mock        # terminal 1: mock CasaOS API on 127.0.0.1:8090 with sample data
pnpm dev         # terminal 2: opens the UI; any username and password log in
```

Create `.env.dev.local` (git-ignored) so the dev server uses the mock:

```
VUE_APP_DEV_IP=127.0.0.1
VUE_APP_DEV_PORT=8090
```

## Develop against your own server

Point `.env.dev.local` at the machine that runs CasaOS: the IP and port you open its web UI at, **not** this computer.

```
VUE_APP_DEV_IP=192.168.1.50
VUE_APP_DEV_PORT=80
```

`pnpm dev` proxies `/v1` and `/v2`, WebSockets included, so everything is same-origin and there are no CORS issues.

## Build

```bash
pnpm build       # output: build/sysroot/var/lib/casaos/www/
pnpm test
```

## Install on the server

The UI is plain static files that replace `/var/lib/casaos/www/`. The included scripts swap it atomically and keep the
stock UI for rollback.

**One-time server setup.** Copy `scripts/w1tos-swap` to `/usr/local/bin/w1tos-swap`. Make it root-owned with mode 755, and allow only that script through sudo:

```
youruser ALL=(root) NOPASSWD: /usr/local/bin/w1tos-swap
```

**Deploy** (Windows PowerShell; needs SSH key access to the server):

```powershell
pnpm build
./scripts/deploy.ps1 -Server youruser@your-server
```

`deploy.ps1` refuses to upload if the bundle contains build-machine environment values. On the server:

```bash
sudo w1tos-swap rollback   # back to the previous deploy
sudo w1tos-swap stock      # back to the original CasaOS UI (kept from the first deploy)
```

Running a CasaOS update from its UI will probably reinstall the stock UI. If that happens, deploy again.

### Behind Cloudflare Tunnel + Access

- Add a cache rule that **bypasses cache** for the hostname. `/js/custom.js`, `/css/custom.css` and `favicon.ico` are not content-hashed, so Cloudflare would serve stale copies.
- The manifest link already uses `crossorigin="use-credentials"` so it loads behind Access.

## Customise

`src/config/brand.config.js` is the only file a fork needs to edit:

```js
module.exports = {
  osName: 'w1tOS',
  wordmark: 'w1tOS',
  user: 'w1t',
  host: 'w1tos',         // status line shows w1t@w1tos
  greeting: 'Welcome back',
  theme: 'plum-peach',   // or 'espresso-gold'
};
```

Two presets ship: **plum-peach** (default) and **espresso-gold**. Colours live in `scripts/brand.build.js`. It generates the Sass variables (which Bulma needs at compile time), the runtime CSS variables and the
terminal theme from one preset, and runs automatically before `dev` and `build`. Components use `var(--token)` only.
There are no hard-coded colours outside the generated files, and CI keeps it that way.

plum-peach tokens:

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--bg` / `--surface` / `--raised` | `#1A1117` / `#24161F` / `#341F2C` | page, cards, modals | |
| `--text` / `--text-soft` / `--muted` | `#FAEFE9` / `#E2D5C2` / `#B49BA7` | headings, body, labels | 16.4 / 12.0 / 6.8 : 1 |
| `--accent` / `--accent-hover` | `#F4A384` / `#F8C1A6` | buttons, focus ring, cursor, meters (gold-to-peach gradient) | 9.2 : 1 |
| `--cool` | `#8FB3C9` | secondary data (network upload, terminal blue) | 7.8 : 1 |
| `--burgundy` / `--maroon` | `#7A5063` / `#4A2C3F` | brand mark only (user@host pill, pinned badge) | text on pill 10.8 : 1 |
| `--ok` / `--warn` / `--err` | `#8CC49A` / `#EECB88` / `#EE6E78` | always paired with `●` / `▲` / `✕` | 8.7 / 11.2 / 5.9 : 1 |
| `--line-strong` | `#9C7A8B` | input underlines, control edges | 4.9 : 1 |

Contrast is measured on `--surface`, except text and accent, which are measured on `--bg`. Every text pair passes WCAG AA, and
controls pass the 3:1 non-text rule. The accent is far enough from the text (ΔE 40) and from the error colour (ΔE 28) that
peach never reads as danger. The surfaces come from Obsidian Plum `#4A2C3F` and the text from Baby Blossom `#FAEFE9` and
Onion White `#E2D5C2`. The accent is Creamy Peach `#F4A384`, and the gold and terracotta come from the canyon palette.

## Project layout

```
src/config/brand.config.js     name, user@host, theme
scripts/brand.build.js         palette → Sass + CSS vars + xterm theme
src/assets/scss/common/        _theme (global overrides), _bento (dashboard), _prompt (login)
src/components/palette/        command palette
src/components/bento/          containers card, text meter
mock/server.js                 local mock of the CasaOS API
scripts/deploy.ps1, w1tos-swap deploy and rollback
design/                        static palette proof and dashboard mockup
tests/                         node:test unit tests
```

## License

Apache-2.0, the same as upstream. See [LICENSE](LICENSE) and [NOTICE](NOTICE). This is a modified version of
CasaOS-UI © IceWhale Technology, and the per-file upstream copyright headers are kept. Fonts are Inter and JetBrains Mono
(SIL OFL), installed from npm.
