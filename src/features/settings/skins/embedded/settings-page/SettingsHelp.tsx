'use client'

import { Icon, Popover, Text } from '@shopify/polaris'
import { InfoIcon } from '@shopify/polaris-icons'
import { useSettingsHelp } from '@/features/settings/domain/useSettingsHelp'

export function SettingsHelp({
  label,
  content,
}: {
  label: string
  content: string
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
          <span
            ref={activatorRef}
            {...handlers}
            role="img"
            tabIndex={0}
            aria-label={label}
            aria-describedby={open ? id : undefined}
            className="inline-flex size-5 items-center rounded-sm align-middle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--p-color-border-focus)"
          >
            <Icon source={InfoIcon} tone="subdued" />
          </span>
        }
      >
        <Popover.Pane>
          <Popover.Section>
            <span ref={contentRef} id={id} role="tooltip" {...hoverHandlers}>
              <Text as="span">{content}</Text>
            </span>
          </Popover.Section>
        </Popover.Pane>
      </Popover>
    </span>
  )
}
