// @ts-check
// The one lint setup for every V-M-Pioneer-Trading TypeScript repository
// (meta#105). A consumer passes its tsconfig root and, at most, file globs:
// it never adds, removes or reconfigures a rule. Changing a rule is a release
// of this package and a version bump in each repository.
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import tseslint from "typescript-eslint";

/** @typedef {import("eslint").Linter.Config} Config */

/** Files linted with type information unless the consumer names its own. */
export const TYPESCRIPT_FILES = ["**/*.{ts,tsx,mts,cts}"];

/**
 * JavaScript ESLint lints anyway (`eslint.config.mjs`, `jest.config.js`,
 * `scripts/*.js`). Outside the consumer's `files` these get the same rules
 * minus the ones that need type information, because they are usually not in
 * any tsconfig and the project service would refuse them.
 */
export const JAVASCRIPT_FILES = ["**/*.{js,jsx,mjs,cjs}"];

/**
 * Never linted: build output and generated code. tsoa writes routes and the
 * spec into `src/generated/` in every repository that uses it. Anything else
 * a repository generates goes in its own `ignores` option, by exact path.
 */
export const DEFAULT_IGNORES = [
  "**/dist/",
  "**/build/",
  "**/coverage/",
  "**/src/generated/",
];

/**
 * @typedef {object} Options
 * @property {string} tsconfigRootDir Directory holding the tsconfig.json the
 *   project service starts from. Pass `import.meta.dirname`.
 * @property {string[]} [files] Globs linted WITH type information. Default
 *   {@link TYPESCRIPT_FILES}. Every file matched must be in a tsconfig.
 * @property {string[]} [ignores] Extra paths never linted, added to
 *   {@link DEFAULT_IGNORES}. A negated (`!`) pattern is refused: it would
 *   bring a shared ignore back.
 */

/**
 * @param {unknown} options What a JavaScript caller really passed, which
 *   may be nothing at all.
 * @returns {Required<Options>}
 */
function resolve(options) {
  const { tsconfigRootDir, files = TYPESCRIPT_FILES, ignores = [] } =
    /** @type {Partial<Options>} */ (typeof options === "object" && options !== null ? options : {});
  if (typeof tsconfigRootDir !== "string" || tsconfigRootDir === "") {
    throw new TypeError(
      "@v-m-pioneer-trading/eslint-config: pass { tsconfigRootDir: import.meta.dirname }",
    );
  }
  for (const [name, list] of /** @type {const} */ ([
    ["files", files],
    ["ignores", ignores],
  ])) {
    if (!Array.isArray(list) || !list.every((g) => typeof g === "string" && g !== "")) {
      throw new TypeError(
        `@v-m-pioneer-trading/eslint-config: \`${name}\` must be an array of glob strings`,
      );
    }
  }
  const negated = ignores.find((g) => g.startsWith("!"));
  if (negated !== undefined) {
    throw new TypeError(
      `@v-m-pioneer-trading/eslint-config: \`ignores\` only adds paths; "${negated}" would un-ignore a shared one`,
    );
  }
  if (files.length === 0) {
    throw new TypeError("@v-m-pioneer-trading/eslint-config: `files` must not be empty");
  }
  return { tsconfigRootDir, files, ignores };
}

/**
 * The base config: typescript-eslint `strictTypeChecked` and
 * `stylisticTypeChecked` with the project service, eslint-comments with a
 * required reason on every directive, and the shared ignores.
 *
 * @param {Options} options
 * @returns {Config[]}
 */
export function base(options) {
  const { tsconfigRootDir, files, ignores } = resolve(options);
  return /** @type {Config[]} */ ([
    {
      // No `files`: an object with only `ignores` is a GLOBAL ignore, so
      // ESLint never opens these paths at all.
      name: "@v-m-pioneer-trading/ignores",
      ignores: [...DEFAULT_IGNORES, ...ignores],
    },
    {
      name: "@v-m-pioneer-trading/linter-options",
      linterOptions: {
        // ESLint defaults to "warn"; "error" says the same thing as
        // `--max-warnings 0` without relying on the script carrying it.
        reportUnusedDisableDirectives: "error",
        // Belt and braces with `no-use` below, which refuses inline config
        // outright: one that changes nothing is reported by ESLint itself.
        reportUnusedInlineConfigs: "error",
      },
    },
    // Rule presets apply to every file ESLint lints. `files` scopes only
    // which of them are given type information, below.
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      name: "@v-m-pioneer-trading/type-imports",
      rules: {
        // Not in either preset, though meta#105 counted on it: a type-only
        // import is written `import type`, so it is erased whatever the
        // consumer's `verbatimModuleSyntax` / `isolatedModules` say.
        "@typescript-eslint/consistent-type-imports": "error",
      },
    },
    {
      name: "@v-m-pioneer-trading/type-information",
      files,
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
    },
    {
      // typescript-eslint's own recipe for files outside every tsconfig:
      // turn the type-aware rules off and the project service with them.
      ...tseslint.configs.disableTypeChecked,
      name: "@v-m-pioneer-trading/javascript-without-types",
      files: JAVASCRIPT_FILES,
      ignores: files,
    },
    {
      // A `.cjs` file is CommonJS by name, so `require()` is its import.
      // A script written with `require()` is renamed to `.cjs`.
      name: "@v-m-pioneer-trading/commonjs",
      files: ["**/*.cjs"],
      rules: { "@typescript-eslint/no-require-imports": "off" },
    },
    comments.recommended,
    {
      name: "@v-m-pioneer-trading/eslint-comments",
      rules: {
        // An `eslint-disable` must say why after ` -- `. Applies to enable,
        // disable, disable-line and disable-next-line alike.
        "@eslint-community/eslint-comments/require-description": "error",
        // The only directives allowed are the four that suppress a report,
        // each with its reason. `/* eslint rule: off */`, `/* global */` and
        // the rest would reconfigure the shared rule set for a whole file.
        "@eslint-community/eslint-comments/no-use": [
          "error",
          {
            allow: [
              "eslint-disable",
              "eslint-disable-line",
              "eslint-disable-next-line",
              "eslint-enable",
            ],
          },
        ],
      },
    },
  ]);
}

export default base;
