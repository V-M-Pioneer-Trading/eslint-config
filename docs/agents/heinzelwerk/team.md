# Team rules

How heinzelwerk agents work in this repo. Mode rules (single repo vs workspace) live in the `heinzelwerk:team-modes` skill. This file holds only what is specific to this repo.

- **Role**: shared package (`@v-m-pioneer-trading/eslint-config`, ESLint 10 flat config, base and React variants). Released as a GitHub release tarball, no npm registry
- **Backend paths**: `index.js`, `react.js`, `test/`, `scripts/`
- **Worktree setup**: `npm ci --ignore-scripts`
- **Checks** (validator runs every one, in order):
  1. `npm audit --audit-level=high`
  2. `npm run typecheck --silent`
  3. `npm run lint --silent`
  4. `npm test --silent`
  5. `scripts/check-consumer.sh` (lints a scratch consumer against the packed tarball)
- **Security**: gitleaks pre-commit hook (`gitleaks git --pre-commit --staged` in `.git/hooks/pre-commit`, so every worktree runs it) · dependency audit in checks
- **Coding standards**: `README.md` (consumer rules, release rules)
- **Risk areas** (validator reviews diffs touching these on Opus):
  - any rule change: every consumer's lint changes on its next bump; a stricter rule is a minor or major release, never a patch
  - `.github/workflows/release.yml`: the tarball must hold exactly the five files, byte-identical to the tag
- **Contracts**:
  - the exported config and `DEFAULT_IGNORES`: provider this repo; consumers agent, auth, automation, fleet, st-gateway, command-interface, clerk-client (all on 1.1.0). A change is a release (`v*` tag on main) plus one bump PR per consumer
  - peer ranges `eslint ^10.12.0`, `typescript >=5.7 <6.1`, `typescript-eslint ^8.71.0`
