/**
 * App Bridge v4 — CDN-loaded global types
 *
 * In App Bridge v4, the Shopify App Bridge script is loaded via CDN
 * and exposes a `shopify` global on `window`. There is no npm package
 * or `createApp()` call.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library
 */

interface ShopifyGlobal {
  /**
   * Returns the current Shopify session token (JWT).
   * Replaces App Bridge v3's `getSessionToken(app)`.
   */
  idToken(): Promise<string>

  /**
   * Current shop config.
   */
  config: {
    shop: string
    locale: string
    host: string
    apiKey: string
  }

  /**
   * Navigate to a path within the embedded app.
   */
  navigate(path: string): void

  /**
   * Show/hide a loading bar at the top of the page.
   */
  loading(isLoading: boolean): void

  /**
   * Show a toast notification.
   */
  toast: {
    show(
      message: string,
      options?: { duration?: number; isError?: boolean }
    ): void
  }

  /**
   * Contextual save bar (`<ui-save-bar>`). While shown, Shopify Admin blocks
   * navigation away from the app and asks the merchant to save or discard.
   */
  saveBar: {
    show(id: string): Promise<void>
    hide(id: string): Promise<void>
    toggle(id: string): Promise<void>
    /** Resolves when navigation may continue; shakes the bar otherwise. */
    leaveConfirmation(): Promise<void>
  }
}

declare global {
  interface Window {
    shopify?: ShopifyGlobal
  }
}

export type { ShopifyGlobal }
