'use client'

import { useCallback } from 'react'
import {
  activateApprovedImageTwins,
  createMissingImageTwins,
  getImageTwins,
} from './adminImageTwinsApi'
import type {
  ImageTwinActivation,
  ImageTwinResult,
} from './admin-image-twins.model'
import { useResource, useTemplateAction } from './useAdminTemplateDrafts'

/** The image twins list, and the create and activate actions with results. */
export function useAdminImageTwins() {
  const overview = useResource(
    'Image twins request failed',
    'image-twins',
    getImageTwins
  )
  const create = useTemplateAction<{ results: ImageTwinResult[] }>(
    'Image twin creation failed'
  )
  const activate = useTemplateAction<ImageTwinActivation>(
    'Image twin activation failed'
  )
  const { refresh } = overview
  const runCreate = create.run
  const runActivate = activate.run

  const createMissing = useCallback(async () => {
    await runCreate(createMissingImageTwins)
    refresh()
  }, [runCreate, refresh])

  const activateApproved = useCallback(async () => {
    await runActivate(activateApprovedImageTwins)
    refresh()
  }, [runActivate, refresh])

  return { overview, create, activate, createMissing, activateApproved }
}
