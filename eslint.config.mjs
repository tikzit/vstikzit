import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    // Explicitly include the file types you want to lint
    files: ["**/*.{ts,tsx,js,mjs}"],
    // Exclude build artifacts and dependencies
    ignores: [
      "node_modules/**",
      "dist/**",
      "out/**",
      "*.d.ts",
      "**/*.min.js"
    ],
  },
  {
    files: ["**/*.{ts,tsx}"], // TypeScript-specific rules
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: true, // Enable type-aware linting
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
      ],

      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn",
      semi: "warn",
    },
  },
  {
    files: ["**/*.{js,mjs}"], // JavaScript-specific rules (no TS parser)
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn",
      semi: "warn",
    },
  },
];
