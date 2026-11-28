'use client'

import { useEffect } from 'react'
import { COMPLETE_REGISTRATION_EVENT } from '@/shared/auth/signup/reportCompleteRegistration'
import {
  captureLandingAttribution,
  isShopifyInstallUrl,
  newMetaEventId,
  trackMetaCustomEvent,
  trackMetaEvent,
  withUtmParams,
} from '@/shared/lib/metaPixel'

export const INSTALL_CLICK_EVENT = 'InstallClick'

/**
 * Marks the CompleteRegistration that a Shopify install click sends, so it
 * can be told apart from a site signup in Events Manager.
 */
export const SHOPIFY_INSTALL_CLICK_CONTENT_NAME = 'shopify_install_click'

const INSTALL_EVENT_ID_STORAGE_KEY = 'akeed.installClickEventId'

/**
 * One event ID per visit, so Meta counts a visitor who clicks install twice
 * as one registration.
 */
function installClickEventId(): string {
  try {
    const stored = window.sessionStorage.getItem(INSTALL_EVENT_ID_STORAGE_KEY)
    if (stored) return stored
    const created = newMetaEventId()
    window.sessionStorage.setItem(INSTALL_EVENT_ID_STORAGE_KEY, created)
    return created
  } catch {
    return newMetaEventId()
  }
}

/**
 * The install itself happens on Shopify, out of the Pixel's reach, so the
 * click stands in for it: a Shopify merchant counts as a registration the
 * same way a site signup does, and one campaign can optimize for both.
 */
function reportInstallClick(): void {
  trackMetaCustomEvent(INSTALL_CLICK_EVENT)
  trackMetaEvent(COMPLETE_REGISTRATION_EVENT, installClickEventId(), {
    content_name: SHOPIFY_INSTALL_CLICK_CONTENT_NAME,
  })
}

/**
 * Long enough for the Pixel request to leave before the page unloads, short
 * enough that nobody notices. Only plain same-tab clicks wait.
 */
export const INSTALL_CLICK_NAVIGATION_DELAY_MS = 300

function isSameTabClick(event: MouseEvent, anchor: HTMLAnchorElement) {
  return (
    event.type === 'click' &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    (!anchor.target || anchor.target === '_self')
  )
}

/**
 * Reports `InstallClick` and `CompleteRegistration` for every link to the Akeed App Store listing on the
 * page and carries the landing UTMs onto it. One delegated listener covers
 * every call site (header, hero, sticky bar, sources, login, signup) without
 * each of them knowing about the Pixel.
 *
 * It listens in the capture phase so it runs before React's handlers: a
 * plain click is held for a moment so the event is not lost to the unload,
 * while new-tab and middle clicks keep their own navigation untouched.
 */
export function useInstallClickTracking(): void {
  useEffect(() => {
    captureLandingAttribution(window.location.search)

    const onClick = (event: MouseEvent) => {
      if (event.type === 'auxclick' && event.button !== 1) return
      const target = event.target
      const anchor =
        target instanceof Element ? target.closest('a[href]') : null
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        !isShopifyInstallUrl(anchor.href)
      ) {
        return
      }

      const href = withUtmParams(anchor.href)
      anchor.href = href
      reportInstallClick()

      if (!event.defaultPrevented && isSameTabClick(event, anchor)) {
        event.preventDefault()
        window.setTimeout(() => {
          window.location.assign(href)
        }, INSTALL_CLICK_NAVIGATION_DELAY_MS)
      }
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('auxclick', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('auxclick', onClick, true)
    }
  }, [])
}
