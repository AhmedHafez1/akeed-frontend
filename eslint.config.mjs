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
const tokenGuardSelectors = [
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
]

/*
 * Dark mode is token-driven: a raw `bg-white` or `text-slate-600` stays the
 * same colour in both themes. Themed surfaces must use the semantic tokens
 * (bg-card, text-foreground, text-muted-foreground, border-border,
 * bg-primary-subtle, bg-warning-subtle, …) so the `.dark` values apply.
 */
const themedPaletteGuardSelector = {
  selector: String.raw`Literal[value=/(^|\s)([a-z-]+:)*(bg-white(\s|$)|text-slate-(400|500|600|700|800|900|950)|(bg|border|ring|divide)-slate-(50|100|200|300)|(bg|border|ring)-(red|amber)-|(bg|border)-emerald-(50|100|200|500|600|700)|text-emerald-(600|700|800|900|950))/]`,
  message:
    'Use a semantic token so the class follows the theme (see src/app/globals.css): text-foreground, text-muted-foreground, bg-card, bg-muted, border-border, bg-primary(-subtle), bg-warning-subtle, bg-destructive-subtle. Genuinely fixed surfaces belong in the ink-surface allowlist in eslint.config.mjs.',
}

/*
 * Always-dark ("ink") or brand-fixed surfaces that intentionally do not
 * follow the theme: public header/footer, auth hero, pricing panel, the
 * WhatsApp chat mockups and the balance hero.
 */
const inkSurfaceFiles = [
  'src/shared/layout/Header.tsx',
  'src/shared/layout/Footer.tsx',
  'src/shared/layout/AuthLayout.tsx',
  'src/shared/layout/header/**/*.{ts,tsx}',
  'src/features/marketing/ui/sections/pricing/CreditPriceCard.tsx',
  'src/features/marketing/ui/sections/pricing/CreditSlider.tsx',
  'src/features/marketing/ui/components/AcquisitionCta.tsx',
  'src/features/marketing/ui/components/ChatInterface.tsx',
  'src/features/marketing/ui/components/chat/**/*.{ts,tsx}',
  'src/features/billing/ui/components/BalanceHeroCard.tsx',
  'src/features/settings/skins/standalone/TemplatesStandaloneSkin.tsx',
  'src/features/docs/ui/MarkdownContent.tsx',
]

const tokenGuardRules = {
  'no-restricted-syntax': ['error', ...tokenGuardSelectors],
}

const themedTokenGuardRules = {
  'no-restricted-syntax': [
    'error',
    ...tokenGuardSelectors,
    themedPaletteGuardSelector,
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
    files: [
      'src/features/**/*.{ts,tsx}',
      'src/shared/**/*.{ts,tsx}',
      'src/app/**/*.{ts,tsx}',
    ],
    ignores: [
      'src/shared/ui/**/*.{ts,tsx}',
      'src/shared/theme/**/*.{ts,tsx}',
      'src/features/marketing/ui/components/LandingPrimitives.tsx',
      'src/features/**/embedded/**/*.{ts,tsx}',
      'src/features/**/*Embedded*.{ts,tsx}',
      'src/app/global-error.tsx',
      ...inkSurfaceFiles,
    ],
    rules: themedTokenGuardRules,
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
            {
              group: ['@/features/billing', '@/features/billing/**'],
              message:
                'Marketing reads credit constants from @/shared/config/pricing and formatting from @/shared/lib/money, not from the billing feature.',
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
