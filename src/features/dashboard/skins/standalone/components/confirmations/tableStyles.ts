/*
 * The confirmations table's look, shared with the dashboard's "Needs your
 * action" card so the two read as one table. Every class is a token.
 */

/** Fixed layout: column widths come from the headings, never the content. */
export const TABLE = 'bg-card w-full table-fixed text-start'

export const TABLE_HEAD_ROW =
  'border-line bg-surface-sunken text-ak-label text-ink-muted border-b'

export const TABLE_HEAD_CELL =
  'h-11 px-4 text-start font-bold whitespace-nowrap first:ps-6 last:pe-6'

export const TABLE_BODY = 'divide-line divide-y'

export const TABLE_ROW = 'h-15 transition-colors'

/** Data cell; the first and last cells line up with the card's 24px gutter. */
export const TABLE_CELL = 'px-4 py-2.5 align-middle first:ps-6 last:pe-6'

/** The amount column: numbers end-aligned, clear of the actions after it. */
export const TABLE_AMOUNT_CELL = 'py-2.5 ps-4 pe-6 text-end align-middle'

/**
 * A row or card waiting on the merchant: the amber tint embedded's warning
 * rows wear, deepening a touch on hover.
 */
export const NEEDS_ACTION_ROW = 'bg-ak-warning-soft hover:bg-ak-warning-line/40'

/** A phone-width card per order, with room for the needs-action edge. */
export const CARD_ROW = 'space-y-3 border-s-[3px] px-4 py-4'
