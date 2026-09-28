'use client'

import { useEffect, useRef } from 'react'
import type { ModalStep } from '../../domain/importStep'

/** Every step heading carries this id so focus can move to it. */
export const IMPORT_STEP_HEADING_ID = 'order-import-step-heading'

/**
 * Moves focus to the new step's heading when the step changes inside the open
 * modal. The first step leaves focus where the dialog put it.
 */
export function useStepHeadingFocus(step: ModalStep | null) {
  const last = useRef<ModalStep | null>(null)
  useEffect(() => {
    if (step === null) return
    if (last.current !== null && last.current !== step)
      document.getElementById(IMPORT_STEP_HEADING_ID)?.focus()
    last.current = step
  }, [step])
}
