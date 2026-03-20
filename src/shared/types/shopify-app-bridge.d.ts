/**
 * JSX type declarations for Shopify App Bridge v4 web components.
 *
 * App Bridge v4 uses custom HTML elements (web components) like
 * `<ui-nav-menu>` instead of JavaScript APIs for navigation.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library/web-components
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type UiNavMenuProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
type UiTitleBarProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-nav-menu': UiNavMenuProps
      'ui-title-bar': UiTitleBarProps
    }
  }
}
