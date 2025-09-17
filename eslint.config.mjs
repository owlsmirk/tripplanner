import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import next from "eslint-config-next";

export default [
  js.configs.recommended,
  ...next(),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      // 🔑 Adjustments for smoother DX
      "@typescript-eslint/no-explicit-any": "off", // disable blocking on "any"
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }, // allow unused vars prefixed with _
      ],
      "prefer-const": "warn",
      "no-console": "off",
    },
  },
];
