// Copies the US-04.6-10 release-gate recording and its fixture manifest from
// akeed-backend into the e01-smoke fixture app, where the Playwright flow
// replays them. Record first in akeed-backend with RECORD_E2E=1 (see
// test/order-import-release-gate.contract-spec.ts). Run with
// `npm run fixtures:import-recording`.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const backendFixtures = resolve(
  root,
  '../akeed-backend/test/fixtures/order-imports'
)
const target = join(root, 'test/e01-smoke/app/[locale]/imports/replay')

const files = [
  ['e2e/arabic-excel.recording.json', 'arabic-excel.recording.json'],
  ['arabic-excel.xlsx.manifest.json', 'arabic-excel.manifest.json'],
  ['arabic-excel.xlsx', 'arabic-excel.xlsx'],
]

mkdirSync(target, { recursive: true })
for (const [from, to] of files) {
  const source = join(backendFixtures, from)
  if (!existsSync(source)) {
    console.error(`Missing ${source}; record it in akeed-backend first.`)
    process.exit(1)
  }
  copyFileSync(source, join(target, to))
  console.log(`copied ${from} → imports/replay/${to}`)
}
