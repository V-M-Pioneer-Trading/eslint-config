# Team rules

How heinzelwerk agents work in this repo. Mode rules (single repo vs workspace) live in the `heinzelwerk:team-modes` skill. This file holds only what is specific to this repo.

- **Autonomy**: full. Agents merge and apply on their own; breakages are learnings. Secrets are never published (name the variable, never the value); the gate never merges its own policy.
- **Role**: shared library, no Backend/Frontend paths. Shared ESLint 10 flat config; distributed as GitHub Release tarballs (`package.json:2`).
- **Shared paths** (only the owner named in the task edits them): whole repo; consumers listed under Contracts.
- **Worktree setup** (run once in every new task worktree): `npm ci --ignore-scripts`
- **Checks** (validator runs every one, in order; copied from CI, quiet flags only):
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `for version in 5.7 6.0; do npm install --no-save --ignore-scripts "typescript@$version" > /dev/null && npm test || exit 1; done; npm ci --ignore-scripts > /dev/null`
  - `.github/workflows/ci.yml` step "Pack and check the tarball's contents" (:56-68), run as written
  - `bash scripts/check-consumer.sh ./*.tgz`
  - `npm audit --audit-level=high (red on main: V-M-Pioneer-Trading/meta#136; not in CI)`
- **Verified against**: 4006cff 2026-10-29 (checks and every ref in this file; retro bumps it)
- **Coding standards**: the package lints itself with its own `base` config (`eslint.config.js:5`); `npm run lint` is `eslint . --max-warnings 0` (`package.json:39`).
- **Risk areas** (validator reviews diffs touching these on Opus). Each entry is a path/glob or a described kind of change, plus why it is risky:
  - `index.js`, `react.js`: every consumer's lint changes on the next bump. A new reportable rule is a minor bump (`CHANGELOG.md:12-14`); a rule that starts reporting forces consumers to remove disables, because `reportUnusedDisableDirectives` is `"error"` (`index.js:102`).
  - `package.json` `version`, `exports`, `files`, `peerDependencies`: the tag must equal `version` (`.github/workflows/release.yml:38-40`); `files` and `exports` decide what consumers can import (`package.json:22-32`); peers pin eslint, typescript, typescript-eslint ranges (`package.json:47-49`).
  - `.github/workflows/release.yml`: a `v*` tag push releases (:13-14); `contents: write` lives on the one publish job (:79); a half-succeeded `gh release create` blocks re-runs until the release is deleted (`README.md:273-276`).
  - `README.md` snippets: `scripts/check-consumer.sh` extracts and runs the `// eslint.config.mjs` blocks (:23-31, :58, :90); an edit can break CI. `lcars-reference-files/` must stay in the React snippet's `ignores` (`README.md:62`).
  - `scripts/check-consumer.sh`: the pre-release proof against a real consumer; installs unlocked eslint/typescript-eslint (:35-36) and needs network.
  - Hardcoded `v1.1.0` strings in `README.md:20`, `README.md:215`, `README.md:261-262`: move with each release.
  - `.github/workflows/ci.yml`: the 5-file tarball check (:56-68) and the typescript 5.7/6.0 matrix (:47-54).
- **Contracts** (see team-modes **Contract changes**; validator checks every diff touching these):
  - Provided: the public API `.` -> `index.js` (`base`, `TYPESCRIPT_FILES`, `JAVASCRIPT_FILES`, `DEFAULT_IGNORES`) and "./react" -> `react.js` (`react`) (`package.json:22-26`, `index.js:88`, `react.js:20`) · consumers and pins (release URL v1.1.0 in devDependencies):
    - `../agent-service/package.json:34`
    - `../auth-service/package.json:32`
    - `../automation-service/package.json:31`
    - `../fleet-service/package.json:32`
    - `../st-gateway/package.json:26`
    - `../ts-introspection-client/package.json:35` (base)
    - `../command-interface/package.json:25` (react, `../command-interface/eslint.config.mjs:1`)
  - A release needs a bump PR in every consumer: `npm install --save-dev <new release URL>`, commit `package.json` and `package-lock.json` together (`README.md:210-218`).
  - Consumed: none.
  - Not consumers: navigation-service, ai-service, spacetraders-mcp-server, meta, infrastructure (no reference found).
