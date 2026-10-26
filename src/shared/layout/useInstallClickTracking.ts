'use client'

import { useEffect } from 'react'
import {
  captureLandingAttribution,
  isShopifyInstallUrl,
  trackMetaCustomEvent,
  withUtmParams,
} from '@/shared/lib/metaPixel'

export const INSTALL_CLICK_EVENT = 'InstallClick'

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
 * Reports `InstallClick` for every link to the Akeed App Store listing on the
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
      trackMetaCustomEvent(INSTALL_CLICK_EVENT)

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
