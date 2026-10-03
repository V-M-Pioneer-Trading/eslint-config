#!/usr/bin/env bash
# Installs the packed tarball into a scratch CommonJS project the way a
# service would (`--ignore-scripts`, no "type": "module") and lints it with
# the eslint.config.mjs snippets extracted from README.md, so the README is
# what is proven. A floating promise must fail `eslint . --max-warnings 0`;
# the fixed file must pass.
#
#   scripts/check-consumer.sh path/to/package.tgz
set -euo pipefail

tarball=$(readlink -f "$1")
readme=$(readlink -f "$(dirname "$0")/../README.md")
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Every ```js block whose first line is `// eslint.config.mjs...`, in order:
# the first is the base snippet, the second the React one.
extract() {
  awk -v want="$1" '
    /^```js$/ { inblock = 1; n = 0; next }
    /^```$/   { if (inblock && keep) exit; inblock = 0; keep = 0; next }
    inblock { if (n++ == 0) keep = (index($0, "// eslint.config.mjs") == 1) && (++seen == want); if (keep) print }
  ' "$readme"
}

cd "$work"
npm init -y > /dev/null
npm install --save-dev --ignore-scripts --no-audit --no-fund \
  "$tarball" "eslint@^10.12.0" "typescript-eslint@^8.71.0" "typescript@~5.9.0" > /dev/null
node -e '
  const l = require("./package-lock.json");
  const p = l.packages["node_modules/@v-m-pioneer-trading/eslint-config"];
  if (!p || !p.integrity) throw new Error("the lockfile does not pin the tarball by integrity");
  console.log("lockfile pins", p.version, p.integrity.slice(0, 20) + "...");
'

lint_expect() { # <expected exit> <what>
  set +e
  npx eslint . --max-warnings 0 > lint.out 2>&1
  local got=$?
  set -e
  cat lint.out
  if [ "$got" != "$1" ]; then
    echo "::error::$2: expected eslint to exit $1, got $got"
    exit 1
  fi
  echo "ok: $2"
}

# --- base, TypeScript service shape -----------------------------------------
extract 1 > eslint.config.mjs
grep -q 'base({ tsconfigRootDir: import.meta.dirname })' eslint.config.mjs || {
  echo "::error::could not extract the base snippet from README.md"; cat eslint.config.mjs; exit 1; }
cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022", "module": "commonjs", "strict": true,
    "noEmit": true, "skipLibCheck": true, "types": []
  },
  "include": ["src"]
}
JSON
mkdir -p src dist src/generated
cat > src/index.ts <<'TS'
async function work(): Promise<void> {
  await Promise.resolve();
}
export function start(): void {
  work();
}
TS
echo 'async function x(): Promise<void> {} x();' > dist/index.ts
cp dist/index.ts src/generated/routes.ts
lint_expect 1 "a floating promise fails the base config"
grep -q '@typescript-eslint/no-floating-promises' lint.out || {
  echo "::error::the failure was not no-floating-promises"; exit 1; }
if grep -qE 'dist/|generated/' lint.out; then echo "::error::an ignored path was linted"; exit 1; fi

sed -i 's/^  work();/  void work();/' src/index.ts
lint_expect 0 "the fixed file and eslint.config.mjs itself pass"

# --- React variant ------------------------------------------------------------
extract 2 > eslint.config.mjs
grep -q '@v-m-pioneer-trading/eslint-config/react' eslint.config.mjs || {
  echo "::error::could not extract the React snippet from README.md"; cat eslint.config.mjs; exit 1; }
sed -i 's/"types": \[\]/"types": [], "jsx": "preserve"/' tsconfig.json
cat > src/useThing.ts <<'TS'
declare function useState<T>(initial: T): [T, (next: T) => void];
export function useThing(on: boolean): number {
  if (on) {
    const [n] = useState(0);
    return n;
  }
  return 0;
}
TS
lint_expect 1 "a conditional hook fails the React variant"
grep -q 'react-hooks/rules-of-hooks' lint.out || {
  echo "::error::the failure was not rules-of-hooks"; exit 1; }
