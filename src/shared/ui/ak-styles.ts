import { cva, type VariantProps } from 'class-variance-authority'

/*
 * The Akeed app look for the standalone dashboard pages, in one place. Every
 * class reads a token from globals.css (bg-card, border-line,
 * text-brand-ink, …); nothing here carries a literal colour.
 */

/** Cards: 12px radius, hairline border, the two-layer resting shadow. */
export const akCard =
  'rounded-ak-card border border-line bg-card text-ink shadow-ak-card'

/**
 * Buttons and button-looking links. They never wrap (`whitespace-nowrap`),
 * so a narrow column pushes the layout rather than breaking a label in two.
 */
export const akButton = cva(
  'ak-focus inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** The view's one primary action. */
        primary:
          'border-transparent bg-brand text-inverse-foreground hover:bg-brand-hover',
        secondary:
          'border-line-strong bg-surface-raised text-ink hover:bg-surface-sunken',
        tinted:
          'border-brand-line bg-brand-soft text-brand-ink hover:border-brand hover:text-brand-hover',
        ghost:
          'border-transparent bg-transparent text-ink-muted hover:bg-neutral-soft hover:text-ink',
      },
      size: {
        /** 48px: the full-width action that closes a card (Pay). */
        lg: 'rounded-ak-card h-12 px-5.5 text-[0.9375rem] [&_svg]:size-[18px]',
        /** 40px: header controls. */
        md: 'text-ak-body rounded-ak-control h-10 px-4 [&_svg]:size-[18px]',
        /** 36px: list-row actions. */
        row: 'text-ak-body rounded-ak-control h-9 px-3.5 [&_svg]:size-4',
        /** 32px: table-row actions. */
        table: 'text-ak-caption rounded-ak-control h-8 px-3 [&_svg]:size-4',
        /** Square icon buttons; always paired with an aria-label. */
        iconMd: 'rounded-ak-control size-10 [&_svg]:size-[18px]',
        iconRow: 'rounded-ak-control size-9 [&_svg]:size-[18px]',
        iconTable: 'rounded-ak-control size-8 [&_svg]:size-[18px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  }
)

export type AkButtonProps = VariantProps<typeof akButton>

/** Inline text links (`All orders →`, `Edit settings`). */
export const akLink =
  'ak-focus inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm font-semibold text-brand-ink underline-offset-4 hover:underline'

/**
 * Small word pills beside a title: "Recommended", "Default". 22px high. The
 * warning and danger tones carry a state, so pair them with an icon.
 */
export const akPill = cva(
  'text-ak-label inline-flex h-5.5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2',
  {
    variants: {
      tone: {
        brand: 'bg-brand-soft text-brand-ink',
        neutral: 'bg-neutral-soft text-ink-muted',
        warning: 'bg-ak-warning-soft text-ak-warning',
        danger: 'bg-ak-danger-soft text-ak-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
)

/**
 * The ground of a radio card or tile. Checked is a brand border with an inset
 * ring on the soft brand fill, so the selection does not rest on colour alone.
 */
export const akChoiceSurface = (checked: boolean) =>
  checked
    ? 'border-brand bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]'
    : 'border-line-strong bg-surface-raised hover:border-control-border'

/** Numbers, IDs and phones line up column to column. */
export const akNumeric = 'tabular-nums'
