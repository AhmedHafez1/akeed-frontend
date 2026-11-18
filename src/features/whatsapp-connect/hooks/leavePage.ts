/** Sends this tab to another site. Its own module so tests can stand in. */
export function leavePage(url: string): void {
  window.location.assign(url)
}
