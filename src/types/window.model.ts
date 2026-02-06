import type { ClientApplication } from '@shopify/app-bridge'

declare global {
  interface Window {
    __SHOPIFY_APP_BRIDGE__?: ClientApplication
  }
}
