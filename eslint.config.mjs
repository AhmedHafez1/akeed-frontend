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

/*
 * ── Design-token guardrails ──────────────────────────────────────────────
 * Tailwind v4 reads no `tailwind.config.*`; the single theme surface is the
 * `@theme` block in src/app/globals.css. Before that was wired, every
 * semantic utility (`bg-primary`, `text-muted-foreground`, …) emitted no CSS,
 * so the codebase drifted to ~1,700 raw palette classes across three neutral
 * families and 19 one-off shadows. These rules stop it happening again.
 *
 * `src/shared/ui/**` and LandingPrimitives.tsx are exempt: they are where
 * tokens get *defined* in terms of concrete values.
 */
const tokenGuardRules = {
  'no-restricted-syntax': [
    'error',
    {
      selector: String.raw`Literal[value=/(^|\s)shadow-\[/]`,
      message:
        'Use an elevation token (shadow-raised / shadow-card / shadow-overlay / shadow-brand) instead of a one-off shadow-[...] value. Defined in src/app/globals.css.',
    },
    {
      selector: String.raw`Literal[value=/(^|\s)(hover:|focus:|active:|group-hover:)?(text|bg|border|ring|divide)-(stone|gray|zinc)-[0-9]/]`,
      message:
        'slate is the single neutral family. Prefer a semantic token (text-muted-foreground, bg-muted, border-border, bg-canvas) over stone/gray/zinc.',
    },
  ],
}

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
    files: ['src/features/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    ignores: [
      'src/shared/ui/**/*.{ts,tsx}',
      'src/features/marketing/ui/components/LandingPrimitives.tsx',
    ],
    rules: tokenGuardRules,
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
    'test/e01-smoke/.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
