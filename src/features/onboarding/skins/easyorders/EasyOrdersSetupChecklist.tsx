'use client'

import { SourceSetupChecklist } from '../connect/SourceSetupChecklist'
import type { EasyOrdersSetupFlow } from './useEasyOrdersSetupFlow'

interface EasyOrdersSetupChecklistProps {
  setup: EasyOrdersSetupFlow
}

/**
 * The last card of the connected screen: what is ready, what is still
 * needed, how messages will be sent, and the number for the free test. The
 * shared checklist card, with the EasyOrders rows and words.
 */
export function EasyOrdersSetupChecklist({
  setup,
}: EasyOrdersSetupChecklistProps) {
  return (
    <SourceSetupChecklist
      setup={setup}
      namespace="easyOrdersConnect.checklist"
      idPrefix="easyorders"
    />
  )
}
