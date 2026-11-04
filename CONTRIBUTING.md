# Contributing

Issues and pull requests are welcome.

1. Fork, then branch from `main`.
2. `pnpm install`, then `pnpm mock` and `pnpm dev` to work without a server (see the README).
3. Use the colour tokens (`var(--surface)`, `var(--accent)` …) instead of hard-coded colours.
4. Before opening a PR, run `pnpm test` and `pnpm build`. CI runs the same plus the leak checks.

Report security problems privately through a
[security advisory](https://github.com/w1tneess/w1tos-ui/security/advisories/new), not a public issue.
