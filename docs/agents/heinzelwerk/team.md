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
  5. TypeScript peer-range ends: `for v in 5.7 6.0; do npm install --no-save --ignore-scripts typescript@$v >/dev/null && npm test --silent; done; npm ci --ignore-scripts >/dev/null`
  6. `npm pack --silent >/dev/null && tar -tzf ./*.tgz | sort` lists exactly `package/LICENSE`, `README.md`, `index.js`, `package.json`, `react.js`
  7. `bash scripts/check-consumer.sh ./*.tgz` (lints a scratch consumer against the packed tarball; needs check 6's tarball)
- **Security**: no secret scan runs yet: gitleaks is not installed and no pre-commit hook exists (planned: `gitleaks git --pre-commit --staged` in `.git/hooks/pre-commit`), so check every diff for secrets by eye · dependency audit in checks
- **Coding standards**: `README.md` (consumer rules, release rules)
- **Risk areas** (validator reviews diffs touching these on Opus):
  - any rule change: every consumer's lint changes on its next bump; a stricter rule is a minor or major release, never a patch
  - `.github/workflows/release.yml`: the tarball must hold exactly the five files, byte-identical to the tag
- **Contracts**:
  - the exported config and `DEFAULT_IGNORES`: provider this repo; consumers agent, auth, automation, fleet, st-gateway, command-interface, clerk-client (all on 1.1.0). A change is a release (`v*` tag on main) plus one bump PR per consumer
  - peer ranges `eslint ^10.12.0`, `typescript >=5.7 <6.1`, `typescript-eslint ^8.71.0`
