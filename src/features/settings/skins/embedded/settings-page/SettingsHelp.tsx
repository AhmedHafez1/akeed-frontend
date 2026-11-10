'use client'

import {
  useLayoutEffect,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { Icon, Popover, Text } from '@shopify/polaris'
import { InfoIcon } from '@shopify/polaris-icons'
import { useSettingsHelp } from '@/features/settings/domain/useSettingsHelp'

export function SettingsHelp({
  label,
  content,
  rich = false,
}: {
  label: string
  content: ReactNode
  rich?: boolean
}) {
  const {
    id,
    ref: activatorRef,
    contentRef,
    open,
    close,
    hoverHandlers,
    handlers,
  } = useSettingsHelp()
  const maxHeight = useAvailableHeight(open, activatorRef)
  return (
    <span className="inline-flex items-center align-middle [&>span]:inline-flex">
      <Popover
        activatorWrapper="span"
        active={open}
        autofocusTarget="none"
        preventFocusOnClose
        preferredPosition="above"
        onClose={close}
        activator={
          <button
            type="button"
            ref={activatorRef}
            {...handlers}
            aria-label={label}
            aria-describedby={open ? id : undefined}
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0.5 align-middle hover:bg-(--p-color-bg-surface-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--p-color-border-focus)"
          >
            <Icon source={InfoIcon} tone="subdued" />
          </button>
        }
      >
        <Popover.Pane>
          <Popover.Section>
            <div
              ref={contentRef}
              id={id}
              role="tooltip"
              {...hoverHandlers}
              style={{
                width: rich ? 352 : 256,
                maxWidth: 'calc(100vw - 64px)',
                maxHeight,
                overflowY: 'auto',
                overflowWrap: 'anywhere',
              }}
            >
              {typeof content === 'string' ? (
                <Text as="p">{content}</Text>
              ) : (
                content
              )}
            </div>
          </Popover.Section>
        </Popover.Pane>
      </Popover>
    </span>
  )
}

/** Room for the panel on the roomier side of the icon, so Polaris never clips it. */
function useAvailableHeight(
  open: boolean,
  activatorRef: RefObject<HTMLButtonElement | null>
) {
  const [height, setHeight] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const rect = activatorRef.current?.getBoundingClientRect()
      if (!rect) return
      const space = Math.max(rect.top, window.innerHeight - rect.bottom)
      setHeight(Math.max(96, space - PANEL_CHROME))
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, activatorRef])
  return height
}

/** Popover margins, section padding and border around the content. */
const PANEL_CHROME = 48
