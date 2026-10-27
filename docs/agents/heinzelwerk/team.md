# Team rules

How heinzelwerk agents work in this repo. Mode rules (single repo vs workspace) live in the `heinzelwerk:team-modes` skill. This file holds only what is specific to this repo; the workspace is described in V-M-Pioneer-Trading/meta `docs/agents/heinzelwerk/workspace.md`.

- **Autonomy**: full. Agents merge and apply on their own; breakages are learnings. Secrets are never published (name the variable, never the value), and the gate never merges its own policy.
- **Role**: shared package
- **Shared paths**: whole repo (provider: this repo; consumers install a release tarball)
- **Worktree setup**: `npm ci --ignore-scripts`
- **Checks** (validator runs every one, in order; copied from CI, quiet flags only):
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - ci.yml step "Test against the ends of the typescript peer range" (ci.yml:47-54), verbatim
  - ci.yml step "Pack and check the tarball's contents" (ci.yml:56-68), verbatim
  - `bash scripts/check-consumer.sh ./*.tgz`
  - `npm audit --audit-level=high` (red on main: V-M-Pioneer-Trading/meta#119)
- **Checks verified on main**: 4006cff 2026-10-27
- **Coding standards**: `README.md` (development, release procedure)
- **Risk areas** (validator reviews diffs touching these on Opus):
  - `index.js`, `react.js`: any rule change breaks consumers; `reportUnusedDisableDirectives` makes a loosened rule fail lint too
  - `package.json` `files` and the three shipped-file lists (ci.yml, release.yml twice)
  - `.github/workflows/**`: a merge to `main` deploys or releases
- **Contracts** (see team-modes **Contract changes**; validator checks every diff touching these):
  - Package API (`base`, `react`, options) · provider eslint-config
