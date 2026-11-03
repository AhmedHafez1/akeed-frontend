/**
 * Meta's JavaScript SDK, loaded once per page, on the connect page only.
 *
 * The script tag and `FB.init` run at most once whatever React does with
 * effects; a failed or timed-out load can be tried again.
 */

export interface FacebookLoginResponse {
  authResponse?: { code?: unknown } | null
  status?: string
}

export interface FacebookLoginOptions {
  config_id: string
  response_type: 'code'
  override_default_response_type: true
  extras: Record<string, unknown>
}

export interface FacebookSdk {
  init(options: {
    appId: string
    version: string
    xfbml: boolean
    autoLogAppEvents: boolean
    cookie: boolean
  }): void
  login(
    callback: (response: FacebookLoginResponse) => void,
    options: FacebookLoginOptions
  ): void
}

declare global {
  interface Window {
    FB?: FacebookSdk
    fbAsyncInit?: () => void
  }
}

/** Meta's locale for each interface language, so its window speaks it too. */
const SDK_LOCALES: Record<string, string> = {
  ar: 'ar_AR',
  en: 'en_US',
  ur: 'ur_PK',
  es: 'es_LA',
  fr: 'fr_FR',
  tr: 'tr_TR',
}

export function facebookSdkSrc(locale: string): string {
  return `https://connect.facebook.net/${SDK_LOCALES[locale] ?? 'en_US'}/sdk.js`
}
export const FACEBOOK_SDK_TIMEOUT_MS = 15_000
const SCRIPT_ID = 'akeed-facebook-sdk'

let loading: Promise<FacebookSdk> | null = null
let initializedAppId: string | null = null

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error('Facebook SDK timed out')),
      FACEBOOK_SDK_TIMEOUT_MS
    )
    window.fbAsyncInit = () => {
      window.clearTimeout(timer)
      resolve()
    }
    document.getElementById(SCRIPT_ID)?.remove()
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = src
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error('Facebook SDK failed to load'))
    }
    document.body.appendChild(script)
  })
}

/** The initialized SDK for `appId`. Rejects on a load failure or timeout. */
export function loadFacebookSdk(
  appId: string,
  graphApiVersion: string,
  locale: string
): Promise<FacebookSdk> {
  if (!loading) {
    loading = (
      window.FB ? Promise.resolve() : injectScript(facebookSdkSrc(locale))
    ).then(() => {
      const sdk = window.FB
      if (!sdk) throw new Error('Facebook SDK missing after load')
      if (initializedAppId === null) {
        sdk.init({
          appId,
          version: graphApiVersion,
          xfbml: false,
          autoLogAppEvents: false,
          cookie: false,
        })
        initializedAppId = appId
      }
      return sdk
    })
    loading.catch(() => {
      loading = null
    })
  }
  return loading
}

/** For tests: forget the loaded SDK. */
export function resetFacebookSdkForTests(): void {
  loading = null
  initializedAppId = null
  delete window.FB
  delete window.fbAsyncInit
  document.getElementById(SCRIPT_ID)?.remove()
}
