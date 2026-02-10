'use client'

/**
 * Dashboard Page — Thin Orchestrator
 *
 * This page owns NO business logic and NO UI markup.
 * It simply:
 *   1. Detects the current app mode (EMBEDDED vs STANDALONE)
 *   2. Runs the shared domain hook to get all data + handlers
 *   3. Resolves the correct skin for the detected mode
 *   4. Renders the skin with the domain props
 *
 * Result: zero conditional rendering, zero `if (isEmbedded)` in JSX.
 */

import { useAkeedMode } from '@/hooks/useAkeedMode'
import { useDashboard, resolveDashboardSkin } from '@/features/dashboard'

export default function DashboardPage() {
  const { mode } = useAkeedMode()
  const skinProps = useDashboard()
  const Skin = resolveDashboardSkin(mode)

  return <Skin {...skinProps} />
}
