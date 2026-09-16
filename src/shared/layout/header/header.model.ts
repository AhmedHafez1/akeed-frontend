export interface HeaderNavItem {
  href: string
  id: string
  label: string
  /** When present, the item renders as a dropdown group of these links. */
  children?: HeaderNavItem[]
}
