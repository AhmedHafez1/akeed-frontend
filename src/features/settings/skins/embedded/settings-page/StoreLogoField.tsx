'use client'

/* eslint-disable @next/next/no-img-element -- the merchant's own upload, served from storage */

import { useEffect, useRef, type ChangeEvent } from 'react'
import {
  BlockStack,
  Button,
  Card,
  DropZone,
  Icon,
  InlineError,
  InlineStack,
  Spinner,
  Text,
} from '@shopify/polaris'
import { UploadIcon } from '@shopify/polaris-icons'
import { useLocale, useTranslations } from 'next-intl'
import {
  LOGO_ACCEPT_ATTRIBUTE,
  formatLogoUpdatedAt,
} from '@/features/settings/domain/merchantLogo'
import type { MerchantLogoModel } from '@/features/settings/domain/useMerchantLogo'
import { SettingsHelp } from './SettingsHelp'

interface StoreLogoFieldProps {
  logo: MerchantLogoModel
  readOnly: boolean
}

const ERROR_ID = 'store-logo-error'

/**
 * The store's logo in Shopify admin: one row to change or remove it, or one
 * drop area to upload it. The phone preview beside it shows the result.
 */
export function StoreLogoField({ logo, readOnly }: StoreLogoFieldProps) {
  const t = useTranslations('settings.logo')
  const { branding, isUploading, isRemoving, error } = logo
  const busy = isUploading || isRemoving
  const hasLogo = Boolean(branding.logoUrl)
  const emptyRef = useRef<HTMLDivElement>(null)
  const hadLogo = useRef(hasLogo)

  // After a removal, keep the keyboard where the next upload starts.
  useEffect(() => {
    if (hadLogo.current && !hasLogo) {
      emptyRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    }
    hadLogo.current = hasLogo
  }, [hasLogo])

  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="100">
          <InlineStack gap="200" blockAlign="center">
            <Text as="h2" variant="headingMd">
              {t('heading')}
            </Text>
            <SettingsHelp label={t('heading')} content={t('description')} />
          </InlineStack>
        </BlockStack>

        {branding.logoUrl ? (
          <LogoRow
            logoUrl={branding.logoUrl}
            updatedAt={branding.updatedAt}
            logo={logo}
            readOnly={readOnly}
            hasError={Boolean(error)}
          />
        ) : (
          <div ref={emptyRef} aria-busy={busy}>
            <DropZone
              label={t('emptyTitle')}
              labelHidden
              accept={LOGO_ACCEPT_ATTRIBUTE}
              type="image"
              allowMultiple={false}
              variableHeight
              disabled={readOnly || busy}
              error={Boolean(error)}
              onDropAccepted={(files) => logo.choose(files[0])}
              onDropRejected={(files) => logo.choose(files[0])}
            >
              <div className="flex min-h-18 items-center justify-center gap-3 p-(--p-space-300)">
                {busy ? (
                  <Spinner size="small" accessibilityLabel={t('uploading')} />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-(--p-border-radius-200) border border-(--p-color-border)">
                    <Icon source={UploadIcon} tone="subdued" />
                  </span>
                )}
                <span className="flex min-w-0 flex-col text-start">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {busy ? t('uploading') : t('emptyTitle')}
                  </Text>
                  {!busy && (
                    <Text as="span" variant="bodySm" tone="subdued">
                      {t('emptyHint')}
                    </Text>
                  )}
                </span>
              </div>
            </DropZone>
          </div>
        )}

        {error && (
          <InlineError message={t(`errors.${error}`)} fieldID={ERROR_ID} />
        )}
        <Text as="p" variant="bodySm" tone="subdued">
          {t('requirements')}
        </Text>
      </BlockStack>
    </Card>
  )
}

interface LogoRowProps {
  logoUrl: string
  updatedAt: string | null
  logo: MerchantLogoModel
  readOnly: boolean
  hasError: boolean
}

function LogoRow({
  logoUrl,
  updatedAt,
  logo,
  readOnly,
  hasError,
}: LogoRowProps) {
  const t = useTranslations('settings.logo')
  const locale = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const { isUploading, isRemoving } = logo
  const busy = isUploading || isRemoving
  const updated = updatedAt ? formatLogoUpdatedAt(updatedAt, locale) : null

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    logo.choose(event.target.files?.[0])
    // The same file can be picked again after an error.
    event.target.value = ''
  }

  return (
    <div className="@container">
      <div
        aria-busy={busy}
        aria-describedby={hasError ? `${ERROR_ID}Error` : undefined}
        className={`flex flex-wrap items-center gap-3 rounded-(--p-border-radius-300) border p-(--p-space-300) ${
          hasError
            ? 'border-(--p-color-border-critical)'
            : 'border-(--p-color-border)'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* White in every theme: the logo sits on a white band in the message. */}
          <span className="relative flex size-14 shrink-0 items-center justify-center rounded-(--p-border-radius-200) border border-(--p-color-border-secondary) bg-(--p-color-bg-surface) p-1">
            <img
              src={logoUrl}
              alt={t('logoAlt')}
              className={`size-full object-contain ${isUploading ? 'opacity-40' : ''}`}
            />
            {isUploading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner size="small" accessibilityLabel={t('uploading')} />
              </span>
            )}
          </span>
          <span className="flex min-w-0 flex-col">
            <Text as="span" variant="bodyMd" fontWeight="semibold" truncate>
              {t('currentLabel')}
            </Text>
            {(isUploading || updated) && (
              <Text as="span" variant="bodySm" tone="subdued" truncate>
                {isUploading ? (
                  t('uploading')
                ) : (
                  <bdi>{t('updatedOn', { date: updated ?? '' })}</bdi>
                )}
              </Text>
            )}
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 @max-[520px]:w-full [&_button]:min-h-9 @max-[520px]:[&_button]:min-h-11 @max-[520px]:[&_button]:flex-1">
            <input
              ref={inputRef}
              type="file"
              accept={LOGO_ACCEPT_ATTRIBUTE}
              className="hidden"
              tabIndex={-1}
              aria-hidden
              onChange={handleFile}
            />
            <Button
              icon={UploadIcon}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {t('replace')}
            </Button>
            {/* Quiet until the pointer or keyboard reaches it. */}
            <span className="contents [&_button:is(:hover,:focus-visible)]:text-(--p-color-text-critical)">
              <Button
                variant="tertiary"
                accessibilityLabel={t('removeAria')}
                disabled={busy}
                loading={isRemoving}
                onClick={logo.remove}
              >
                {t('remove')}
              </Button>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
