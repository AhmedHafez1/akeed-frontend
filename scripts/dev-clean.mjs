// Deletes the Next.js dev caches (Turbopack's persistent cache grows to
// hundreds of MB and can make dev start slowly or stall) and old validation
// build output. Stop the dev servers first; production builds are untouched
// unless --all is passed.
//
//   node scripts/dev-clean.mjs         dev caches only
//   node scripts/dev-clean.mjs --all   the whole .next folder
import { rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const all = process.argv.includes('--all')

const targets = all
  ? ['.next']
  : [
      '.next/dev',
      '.next/cache',
      '.next/shopify/dev',
      '.next/shopify/cache',
      '.next/standalone/dev',
      '.next/standalone/cache',
      '.next/e01-validation-build',
    ]

for (const target of targets) {
  const full = path.join(root, target)
  if (!existsSync(full)) continue
  try {
    rmSync(full, { recursive: true, force: true, maxRetries: 3 })
    console.log(`removed ${target}`)
  } catch (error) {
    console.error(
      `could not remove ${target} (${error?.code ?? 'error'}); stop the dev server and retry`
    )
    process.exitCode = 1
  }
}
