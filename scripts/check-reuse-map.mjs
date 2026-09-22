// US-04.6-10 AC3, frontend rows of the E04.6 Reuse map: the manual order form
// and the file import share one currency list, one COD constant and one
// download helper. Run with `npm run check:reuse-map`; exits 1 on a second copy.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const src = join(root, 'src')

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !/\.(spec|test)\.tsx?$/.test(name)
      ? [path]
      : []
  })
}

const files = sourceFiles(src).map((path) => ({
  path: relative(root, path).replace(/\\/g, '/'),
  source: readFileSync(path, 'utf8'),
}))

const matching = (pattern) =>
  files
    .filter(({ source }) => pattern.test(source))
    .map(({ path }) => path)
    .sort()

const failures = []
function expectOnly(rule, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${rule}`)
  if (!ok)
    failures.push(
      `${rule}\n    expected ${JSON.stringify(expected)}\n    found    ${JSON.stringify(actual)}`
    )
}

// A list is three or more ISO codes in a row.
expectOnly(
  'one currency list',
  matching(/\[\s*(?:'[A-Z]{3}'\s*,\s*){2,}'[A-Z]{3}'/),
  ['src/shared/commerce/orderCommerce.ts']
)

expectOnly(
  'one COD payment-method constant',
  matching(/=\s*'cash_on_delivery'/),
  ['src/shared/commerce/orderCommerce.ts']
)

expectOnly(
  'one object-URL download helper',
  matching(/URL\.createObjectURL\(/),
  ['src/shared/lib/download.ts']
)

// The list must equal the backend's canonical one when both apps are present.
const backendRules = resolve(
  root,
  '../akeed-backend/src/shared/commerce/canonical-order.rules.ts'
)
const codes = (text, marker) => {
  const start = text.indexOf(marker)
  const body = text.slice(start, text.indexOf(']', start))
  return [...body.matchAll(/'([A-Z]{3})'/g)].map(([, code]) => code)
}
if (existsSync(backendRules)) {
  const frontend = files.find(
    ({ path }) => path === 'src/shared/commerce/orderCommerce.ts'
  ).source
  expectOnly(
    'currency list matches the backend CANONICAL_ORDER_CURRENCIES',
    codes(frontend, 'orderCurrencies = ['),
    codes(readFileSync(backendRules, 'utf8'), 'CANONICAL_ORDER_CURRENCIES = [')
  )
} else {
  console.log('SKIP  backend parity (akeed-backend not next to this app)')
}

if (failures.length) {
  console.error(
    `\n${failures.length} Reuse map rule(s) broken:\n  ${failures.join('\n  ')}`
  )
  process.exit(1)
}
console.log('\nReuse map (frontend): every rule has one implementation.')
