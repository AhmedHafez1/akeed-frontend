import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'

/*
 * The one place that names Akeed's typefaces. The families are exposed only as
 * the neutral variables `--font-latin` and `--font-arabic`, which
 * `--font-sans` in globals.css stacks Latin-first: the Latin face draws Latin
 * text and every Western digit, and Arabic falls through to the Arabic face
 * glyph by glyph, so mixed copy ("Order #10482 — تم التأكيد") needs no
 * per-component font. To swap a family, change the import and loader call
 * here; nothing else references a font name.
 *
 * Both families top out at weight 700, so the type scale does too. The Arabic
 * family is static, so only the weights the UI uses load — keep this list in
 * step with the weights the type scale and `font-*` classes ask for.
 *
 * The Latin face must not get next/font's generated fallback: that face is
 * `local(Arial)` over every code point, and since it sits before the Arabic
 * face in the stack it would draw all Arabic text in Arial. The Arabic face's
 * metric-matched fallback comes last and covers both scripts while swapping.
 * Webpack honours `adjustFontFallback: false`; Turbopack only skips the
 * generated face when `fallback` is given, so both are set.
 */
const latin = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
  variable: '--font-latin',
})

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
})

/** Class names that define the font variables; put them on `<body>`. */
export const fontVariables = `${latin.variable} ${arabic.variable}`
