# Repo map: V-M-Pioneer-Trading/eslint-config
Verified against 4006cff 2026-10-29.

## Purpose
- Shared ESLint 10 flat config for TypeScript repos, with a React variant; consumers never add or change rules. `package.json:2`, `index.js:2-5`
- Version 1.1.0, no registry; GitHub Release tarball `v-m-pioneer-trading-eslint-config-<ver>.tgz`. `package.json:3`, `.github/workflows/release.yml:3-6`

## Layout
- `index.js`: `base({tsconfigRootDir, files?, ignores?})` and default export. `index.js:88`, `index.js:185`
- `index.js` also exports `TYPESCRIPT_FILES`, `JAVASCRIPT_FILES`, `DEFAULT_IGNORES` (dist/, build/, coverage/, src/generated/). `index.js:12`, `index.js:20`, `index.js:27-32`
- `react.js`: `react(options)` = base + react-hooks recommended on all JS/TS + react-refresh vite on jsx/tsx. `react.js:20`, `react.js:23-32`
- `exports`: `.` -> index.js, "./react" -> react.js, `./package.json`. `package.json:22-26`
- Shipped files: index.js, react.js, README.md, LICENSE (+ package.json). `package.json:27-32`
- `scripts/check-consumer.sh`: pre-release proof against a scratch consumer. `scripts/check-consumer.sh:1`
- `test/config.test.js` with `test/fixtures/{base,react}`; run by `node --test`. `package.json:38`
- Docs: `README.md`, `CHANGELOG.md`, `LICENSE`. No `docs/` besides `docs/agents/heinzelwerk/`; CLAUDE.md is added by this branch (heinzelwerk block only).

## Rules in base
- tseslint strictTypeChecked + stylisticTypeChecked. `index.js:110-111`
- `consistent-type-imports` error. `index.js:118`
- `no-unused-vars` ignores `^_` args and caught errors; no `varsIgnorePattern`. `index.js:131-134`
- `reportUnusedDisableDirectives` and `reportUnusedInlineConfigs` error, so a now-needless `eslint-disable` fails lint. `index.js:97-107`
- eslint-comments recommended + `require-description` + `no-use`. `index.js:159-181`
- `.cjs` `no-require-imports` off; JS outside `files` gets `disableTypeChecked`; projectService on. `index.js:141-158`

## Option checks (throw)
- Missing `tsconfigRootDir`, negated `ignores` glob, empty `files`. `index.js:53-57`, `index.js:68-73`, `index.js:74-76`

## Calls / called-by
- Called by (release URL pin in devDependencies): agent-service, auth-service, automation-service, fleet-service, st-gateway, ts-introspection-client (base); command-interface (react). `../agent-service/package.json:34`, `../auth-service/package.json:32`, `../automation-service/package.json:31`, `../fleet-service/package.json:32`, `../st-gateway/package.json:26`, `../ts-introspection-client/package.json:35`, `../command-interface/package.json:25`, `../command-interface/eslint.config.mjs:1`
- Consumer CI runs `npm run lint`: `../agent-service/.github/workflows/container.yml:86`, `../auth-service/.github/workflows/container.yml:88`, `../automation-service/.github/workflows/container.yml:75`, `../fleet-service/.github/workflows/container.yml:73`, `../st-gateway/.github/workflows/container.yml:69`, `../ts-introspection-client/.github/workflows/ci.yml:37`, `../command-interface/.github/workflows/deploy.yml:78`
- Not used (no reference found): navigation-service, ai-service, spacetraders-mcp-server, meta, infrastructure. (unverified)
- Calls nothing at runtime: dependencies are lint plugins only (`package.json:41-45`)

## Build / run
- `npm ci --ignore-scripts`, `npm run typecheck` (tsc, JSDoc-checked JS), `npm run lint` (`--max-warnings 0`), `npm test` (`node --test test/config.test.js`). `package.json:36-40`
- Engines `^20.19.0 || ^22.13.0 || >=24`. `package.json:34`
- Self-lint: own `base`, ignores `test/fixtures/` and the .claude/worktrees/ task-worktree folder. `eslint.config.js:5-10`
- Peers: eslint ^10.12.0, typescript >=5.7.0 <6.1.0, typescript-eslint ^8.71.0. `package.json:47-49`
- Name the consumer config `eslint.config.mjs` so it is ESM whatever the repo's `"type"`. `README.md:29-30`
- Lockfile `package-lock.json`; line endings forced LF. `.github/workflows/ci.yml:33` runs `npm ci`; `.gitattributes:1`

## CI (`.github/workflows/ci.yml`, job `test`)
- Runs on any pull_request and push to main; Node 22. `.github/workflows/ci.yml:3-8`, `.github/workflows/ci.yml:28`
- Steps: typecheck, lint, test, TypeScript 5.7 and 6.0 loop then `npm ci`, `npm pack` with exactly 5 files, `bash scripts/check-consumer.sh ./*.tgz`. `.github/workflows/ci.yml:35-73`
- `scripts/check-consumer.sh` extracts the README `// eslint.config.mjs` js blocks in order (1 = base, 2 = React) and greps for `base({ tsconfigRootDir: import.meta.dirname })` and `/eslint-config/react`. `scripts/check-consumer.sh:23-31`, `scripts/check-consumer.sh:59`, `scripts/check-consumer.sh:91`
- It installs eslint, typescript-eslint, typescript@~5.9 unlocked: needs network. `scripts/check-consumer.sh:35-36`

## Release (`.github/workflows/release.yml`)
- Trigger: tag `v*`. `.github/workflows/release.yml:13-14`
- Job build (read-only token): tag == `package.json` version check, `npm ci --ignore-scripts`, typecheck, lint, test, `npm pack`, `check-consumer.sh`, artifact retention 1 day. `.github/workflows/release.yml:38-71`
- Job publish (only `contents: write`, runs no npm): tag commit must be on main, tarball holds exactly 5 files each `cmp`-identical to the tag, then `gh release create --generate-notes`. `.github/workflows/release.yml:79`, `.github/workflows/release.yml:84-92`, `.github/workflows/release.yml:121`, `.github/workflows/release.yml:132`
- Manual procedure and recovery. `README.md:259-269`, `README.md:271-276`

## Traps
- `v1.1.0` is hardcoded in `README.md:20`, `README.md:215`, example tag `README.md:261-262`.
- Bump = `npm install --save-dev <new url>` in each of 7 consumers, commit `package.json` + lock together. `README.md:210-218`
- New reportable rule = minor bump; consumers must then remove now-unused disables. `CHANGELOG.md:12-14`
- `../agent-service/scripts/check-dependencies.cjs:36-48` admits eslint-config only by lock path + release-URL regex; renaming the repo or tarball breaks it.
- `README.md:197` cites a stale path "ts/scripts/check-dependencies.js".
- Half-succeeded `gh release create` blocks re-runs until the release is deleted. `README.md:273-276`
- Artifact lives 1 day: after that re-run all jobs. `.github/workflows/release.yml:71`
- A README edit can break CI (snippets are executed). `scripts/check-consumer.sh:23-31`
- `lcars-reference-files/` (vendored in command-interface) must stay in the React snippet's `ignores`. `scripts/check-consumer.sh:127-129`, `README.md:62`
- Lint needs tsoa output first in agent-service and fleet-service. `../agent-service/.github/workflows/container.yml:83-86`, `../fleet-service/README.md:116`
