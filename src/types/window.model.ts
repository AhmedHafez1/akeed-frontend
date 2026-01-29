import { ClientApplication } from '@shopify/app-bridge'

export interface IWindow extends Window {
  __SHOPIFY_APP_BRIDGE__?: ClientApplication
}
