/**
 * Previous/next paging over the server's keyset cursor.
 *
 * The API only hands out a cursor to the next page, so the client keeps the
 * cursor each page was opened with; "previous" pops one. Page one's cursor is
 * null. Changing the tab, period or search resets to page one.
 */
export type CursorStack = ReadonlyArray<string | null>

export const FIRST_PAGE: CursorStack = [null]

export function currentCursor(stack: CursorStack): string | null {
  return stack[stack.length - 1] ?? null
}

export function nextPage(stack: CursorStack, nextCursor: string | null) {
  return nextCursor ? [...stack, nextCursor] : stack
}

export function previousPage(stack: CursorStack): CursorStack {
  return stack.length > 1 ? stack.slice(0, -1) : stack
}

/** The first and last row numbers shown, for "1–8 من 28". */
export function pageRange(
  stack: CursorStack,
  pageSize: number,
  rowsOnPage: number,
  total: number
): { from: number; to: number; total: number } {
  if (rowsOnPage === 0) return { from: 0, to: 0, total }
  const from = (stack.length - 1) * pageSize + 1
  return { from, to: Math.min(from + rowsOnPage - 1, total), total }
}
