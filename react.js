// @ts-check
// The React variant (command-interface): the base config plus the Rules of
// Hooks and Vite's Fast Refresh boundary rule.
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { base } from "./index.js";

/** @typedef {import("eslint").Linter.Config} Config */
/** @typedef {import("./index.js").Options} Options */

/**
 * Base plus `eslint-plugin-react-hooks` `recommended` and
 * `eslint-plugin-react-refresh` `vite`. `.jsx` and `.tsx` are linted because
 * the rules below name them; whether they get type information is still
 * decided by `files`.
 *
 * @param {Options} options
 * @returns {Config[]}
 */
export function react(options) {
  return [
    ...base(options),
    {
      ...reactHooks.configs.flat.recommended,
      name: "@v-m-pioneer-trading/react-hooks",
      files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    },
    {
      ...reactRefresh.configs.vite,
      name: "@v-m-pioneer-trading/react-refresh",
      files: ["**/*.{jsx,tsx}"],
    },
  ];
}

export default react;
