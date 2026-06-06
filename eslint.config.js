import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Prevent hardcoded hex color values — use CSS custom properties from src/styles/tokens.ts
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/**/network-tokens.ts',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/styles/tokens.css',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          message: "Use CSS custom properties from src/styles/tokens.ts instead of hardcoded hex colors.",
        },
      ],
    },
  },
])
