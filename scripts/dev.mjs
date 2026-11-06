// Starts `next dev` with a larger heap, then requests the entry routes once so
// the first real page load (often the Shopify Admin iframe, which gives up on
// a slow first response) hits compiled code instead of a cold compile.
//
//   node scripts/dev.mjs [next dev args]      e.g. -p 3001
//
// Environment:
//   DEV_HEAP_MB=4096          heap limit for the Next.js server
//   DEV_WARMUP=0              skip the warm-up requests
//   DEV_WARMUP_ROUTES=/a,/b   routes to warm (default below)
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const args = process.argv.slice(2)
const heapMb = Number(process.env.DEV_HEAP_MB) || 4096

// The locale is a dynamic segment, so one locale compiles a route for all.
const DEFAULT_ROUTES = [
  '/',
  '/ar/dashboard',
  '/ar/onboarding',
  '/ar/verifications',
]

function resolvePort() {
  const flag = args.findIndex((a) => a === '-p' || a === '--port')
  if (flag !== -1 && args[flag + 1]) return Number(args[flag + 1])
  return Number(process.env.PORT) || 3000
}

const child = spawn(
  process.execPath,
  [`--max-old-space-size=${heapMb}`, nextBin, 'dev', ...args],
  { cwd: root, stdio: 'inherit', env: process.env }
)

let exiting = false
const stop = (signal) => {
  exiting = true
  if (!child.killed) child.kill(signal)
}
process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
child.on('exit', (code, signal) => {
  exiting = true
  process.exit(code ?? (signal ? 1 : 0))
})

async function request(url, timeoutMs) {
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
  })
  await response.arrayBuffer()
  return response.status
}

async function waitForServer(base) {
  const deadline = Date.now() + 5 * 60_000
  while (!exiting && Date.now() < deadline) {
    try {
      await request(`${base}/favicon.ico`, 5_000)
      return true
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1_000))
    }
  }
  return false
}

async function warmUp() {
  if (process.env.DEV_WARMUP === '0') return
  const base = `http://localhost:${resolvePort()}`
  if (!(await waitForServer(base))) return
  const routes = process.env.DEV_WARMUP_ROUTES
    ? process.env.DEV_WARMUP_ROUTES.split(',')
        .map((r) => r.trim())
        .filter(Boolean)
    : DEFAULT_ROUTES
  const started = Date.now()
  // One at a time: parallel cold compiles raise peak memory.
  for (const route of routes) {
    if (exiting) return
    const t = Date.now()
    try {
      const status = await request(`${base}${route}`, 180_000)
      console.log(`[warm-up] ${route} ${status} in ${Date.now() - t} ms`)
    } catch (error) {
      console.log(`[warm-up] ${route} failed: ${error?.name ?? 'Error'}`)
    }
  }
  console.log(
    `[warm-up] done in ${Math.round((Date.now() - started) / 1000)} s`
  )
}

void warmUp()
