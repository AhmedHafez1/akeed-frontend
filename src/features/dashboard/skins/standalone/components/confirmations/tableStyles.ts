/*
 * The confirmations table's look, shared with the dashboard's "Needs your
 * action" card so the two read as one table. Every class is a token.
 */

/** Fixed layout: column widths come from the headings, never the content. */
export const TABLE = 'bg-card w-full table-fixed text-start'

export const TABLE_HEAD_ROW = 'bg-surface-sunken text-ak-label text-ink-muted'

/*
 * Sticky so the headings stay put when the list scrolls inside its card. The
 * rule under them is a pseudo-element: a collapsed-border row edge would
 * scroll away with the rows.
 */
export const TABLE_HEAD_CELL =
  'bg-surface-sunken after:bg-line sticky top-0 z-10 h-10 px-4 text-start font-bold whitespace-nowrap after:absolute after:inset-x-0 after:bottom-0 after:h-px first:ps-6 last:pe-6'

export const TABLE_BODY = 'divide-line divide-y'

export const TABLE_ROW = 'h-12 transition-colors'

/** Data cell; the first and last cells line up with the card's 24px gutter. */
export const TABLE_CELL = 'px-4 py-1.5 align-middle first:ps-6 last:pe-6'

/** The amount column: numbers end-aligned, clear of the actions after it. */
export const TABLE_AMOUNT_CELL = 'py-1.5 ps-4 pe-6 text-end align-middle'

/**
 * A row or card waiting on the merchant: the amber tint embedded's warning
 * rows wear, deepening a touch on hover.
 */
export const NEEDS_ACTION_ROW = 'bg-ak-warning-soft hover:bg-ak-warning-line/40'

/** A phone-width card per order, with room for the needs-action edge. */
export const CARD_ROW = 'space-y-3 px-4 py-4'
