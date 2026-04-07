import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const restrictedLegacyPaths = [
  {
    group: ['@/lib/*', '@/lib/**'],
    message:
      'Use @/shared/lib/* for shared utilities or feature-local modules.',
  },
  {
    group: ['@/components/*', '@/components/**'],
    message:
      'Legacy components path is deprecated. Use @/shared/* or @/features/* instead.',
  },
  {
    group: ['@/hooks/*', '@/hooks/**'],
    message:
      'Legacy hooks path is deprecated. Use @/shared/hooks/* or feature-local hooks.',
  },
  {
    group: ['@/types/*', '@/types/**'],
    message:
      'Legacy types path is deprecated. Use @/shared/types/* or feature-local types.',
  },
  {
    group: ['@/config/*', '@/config/**'],
    message:
      'Legacy config path is deprecated. Use @/shared/* or feature-local config.',
  },
  {
    group: ['@/app/*', '@/app/**'],
    message:
      'Do not import from the app route layer. Move shared logic to features/shared.',
  },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: restrictedLegacyPaths,
        },
      ],
    },
  },
  {
    files: ['src/shared/{lib,hooks,types,ui}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...restrictedLegacyPaths,
            {
              group: ['@/features/*', '@/features/**'],
              message:
                'Core shared primitives (lib/hooks/types/ui) must stay feature-agnostic.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...restrictedLegacyPaths,
            {
              group: ['@/shared/layout/*', '@/shared/layout/**'],
              message: 'Features must not depend on shared layout composition.',
            },
            {
              group: ['@/shared/auth/*', '@/shared/auth/**'],
              message: 'Features must not depend on shared auth composition.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/marketing/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...restrictedLegacyPaths,
            {
              group: ['@/features/dashboard', '@/features/dashboard/**'],
              message: 'Do not couple marketing to dashboard internals.',
            },
            {
              group: ['@/features/onboarding', '@/features/onboarding/**'],
              message: 'Do not couple marketing to onboarding internals.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/onboarding/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...restrictedLegacyPaths,
            {
              group: ['@/features/dashboard', '@/features/dashboard/**'],
              message: 'Do not couple onboarding to dashboard internals.',
            },
            {
              group: ['@/features/marketing', '@/features/marketing/**'],
              message: 'Do not couple onboarding to marketing internals.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/dashboard/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...restrictedLegacyPaths,
            {
              group: ['@/features/onboarding', '@/features/onboarding/**'],
              message: 'Do not couple dashboard to onboarding internals.',
            },
            {
              group: ['@/features/marketing', '@/features/marketing/**'],
              message: 'Do not couple dashboard to marketing internals.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
