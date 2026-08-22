import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...nx.configs['flat/react-typescript'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        // `projectService` conflicts with a `parserOptions.project` set by any config
        // merged into this one. Remove this once you know none of them set it.
        project: null,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@next/next/no-html-link-for-pages': ['error', 'apps/frontend/pages'],
    },
  },
  {
    ignores: ['.next/**/*', '**/out-tsc'],
  },
];
