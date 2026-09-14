/** Clearance for the fixed site header when scrolling to an in-page anchor. */
export const HEADER_SCROLL_OFFSET = 80

/**
 * Smooth-scrolls to the element with `id`, leaving room for the fixed header.
 * Returns `false` when the element is not on the current page.
 */
export function scrollToElement(
  id: string,
  offset: number = HEADER_SCROLL_OFFSET
): boolean {
  const element = document.getElementById(id)

  if (!element) return false

  const elementPosition = element.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.scrollY - offset
  window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
  return true
}
