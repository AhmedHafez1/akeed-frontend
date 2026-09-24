'use client'

import { useEffect } from 'react'

interface AppBridgeSaveBarProps {
  id: string
  /** Shows the bar; Shopify Admin then blocks leaving with unsaved changes. */
  open: boolean
  isSaving: boolean
  saveLabel: string
  discardLabel: string
  onSave: () => void
  onDiscard: () => void
}

/*
 * App Bridge reads these attributes from the light-DOM buttons it mirrors
 * into the Admin chrome; they are not React button props, so they are spread
 * as plain attributes.
 */
function saveBarButtonAttributes(attributes: {
  variant?: 'primary'
  loading?: boolean
  disabled?: boolean
}): Record<string, string | undefined> {
  return {
    variant: attributes.variant,
    loading: attributes.loading ? '' : undefined,
    disabled: attributes.disabled ? '' : undefined,
  }
}

/**
 * The Shopify Admin contextual save bar (App Bridge v4 `<ui-save-bar>`).
 * Rendered once per page; visibility follows `open`.
 */
export function AppBridgeSaveBar({
  id,
  open,
  isSaving,
  saveLabel,
  discardLabel,
  onSave,
  onDiscard,
}: AppBridgeSaveBarProps) {
  useEffect(() => {
    const saveBar = window.shopify?.saveBar
    if (!saveBar) return
    void (open ? saveBar.show(id) : saveBar.hide(id))
  }, [id, open])

  useEffect(() => {
    return () => {
      void window.shopify?.saveBar?.hide(id)
    }
  }, [id])

  return (
    <ui-save-bar id={id}>
      <button
        {...saveBarButtonAttributes({ variant: 'primary', loading: isSaving })}
        onClick={onSave}
      >
        {saveLabel}
      </button>
      <button
        {...saveBarButtonAttributes({ disabled: isSaving })}
        onClick={onDiscard}
      >
        {discardLabel}
      </button>
    </ui-save-bar>
  )
}
