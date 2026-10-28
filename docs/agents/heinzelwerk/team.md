# Team rules

How heinzelwerk agents work in this repo. Mode rules (single repo vs workspace) live in the `heinzelwerk:team-modes` skill. This file holds only what is specific to this repo.

- **Autonomy**: full. Agents merge and apply on their own; breakages are learnings. Secrets are never published (name the variable, never the value), and the gate never merges its own policy.
- **Shared paths** (a shared package: one task owns a change, consumers bump after the release): whole repo (`index.js`, `react.js`, `test/`, `scripts/`)
- **Worktree setup**: `npm ci --ignore-scripts`
- **Consumer bump**: in the consumer, one `npm install --save-dev <release tarball URL>` (command in `README.md:208-216`), then `npm run lint` and fix what the new release reports in the same PR; commit `package.json` and `package-lock.json` together
- **Checks** (copied from `.github/workflows/ci.yml`, job `test`, in order; `release.yml` runs the same build steps):
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - ci.yml step "Test against the ends of the typescript peer range": run its script as written
  - ci.yml step "Pack and check the tarball's contents": run its script as written
  - `bash scripts/check-consumer.sh ./*.tgz` (needs network)
- **Checks verified on main**: 4006cff 2026-10-28
- **Coding standards**: lints itself with its own `base` (`eslint.config.js`); conventions in `README.md`
- **Risk areas** (validator reviews diffs touching these on Opus):
  - `index.js`, `react.js`: every rule change reaches 7 consumers; `reportUnusedDisableDirectives: "error"` makes loosening a rule break consumers' now-needless disables
  - `package.json` `files`: must match the tarball lists in `ci.yml` and `release.yml`
  - `.github/workflows/release.yml`: a `v*` tag must equal `package.json` version; it publishes the GitHub release consumers install from
- **Contracts** (see team-modes **Contract changes**):
  - Provided: `@v-m-pioneer-trading/eslint-config` exports `base` and `react` · provider eslint-config; consumers pin the release tarball URL: agent-service, auth-service, automation-service, fleet-service, st-gateway, clerk-client (`base`), command-interface (`react`)
