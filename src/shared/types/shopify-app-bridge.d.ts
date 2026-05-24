/**
 * JSX type declarations for Shopify App Bridge v4 web components.
 *
 * App Bridge v4 uses custom HTML elements (web components) like
 * `<s-app-nav>` and `<s-link>` for navigation registration.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library/web-components
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type SAppNavProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
type SLinkProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement> & {
    href: string
    rel?: string
    target?: '_blank' | '_self' | '_parent' | '_top'
  },
  HTMLElement
>

// Legacy components (kept for backwards compatibility during migration)
type UiNavMenuProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
type UiTitleBarProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      's-app-nav': SAppNavProps
      's-link': SLinkProps
      'ui-nav-menu': UiNavMenuProps
      'ui-title-bar': UiTitleBarProps
    }
  }
}
