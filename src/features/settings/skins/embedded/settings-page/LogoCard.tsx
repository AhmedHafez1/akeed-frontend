'use client'

/* eslint-disable @next/next/no-img-element -- the merchant's own upload, served from storage */

import {
  Banner,
  BlockStack,
  Button,
  Card,
  DropZone,
  InlineStack,
  Text,
  Thumbnail,
} from '@shopify/polaris'
import { ImageIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import { LOGO_ACCEPT_ATTRIBUTE } from '@/features/settings/domain/merchantLogo'
import type { MerchantLogoModel } from '@/features/settings/domain/useMerchantLogo'

interface LogoCardProps {
  logo: MerchantLogoModel
  readOnly: boolean
}

/**
 * The store's logo in Shopify admin: upload, replace or remove it, and see
 * the banner that goes on top of the confirmation and the reminder.
 */
export function LogoCard({ logo, readOnly }: LogoCardProps) {
  const t = useTranslations('settings.logo')
  const { branding, isUploading, isRemoving, error } = logo
  const busy = isUploading || isRemoving
  const hasLogo = Boolean(branding.logoUrl)

  return (
    <Card>
      <BlockStack gap="300">
        <BlockStack gap="100">
          <Text as="h2" variant="headingMd">
            {t('heading')}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            {t('description')}
          </Text>
        </BlockStack>

        <InlineStack gap="400" blockAlign="center" wrap>
          <Thumbnail
            size="large"
            source={branding.logoUrl ?? ImageIcon}
            alt={t('logoAlt')}
          />
          <BlockStack gap="200">
            <Text as="p" variant="bodySm" tone="subdued">
              {t('requirements')}
            </Text>
            {!readOnly && (
              <InlineStack gap="200">
                <div className="w-40">
                  <DropZone
                    accept={LOGO_ACCEPT_ATTRIBUTE}
                    type="image"
                    allowMultiple={false}
                    disabled={busy}
                    variableHeight
                    onDropAccepted={(files) => logo.choose(files[0])}
                    onDropRejected={(files) => logo.choose(files[0])}
                  >
                    <DropZone.FileUpload
                      actionTitle={hasLogo ? t('replace') : t('upload')}
                    />
                  </DropZone>
                </div>
                {hasLogo && (
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={logo.remove}
                    disabled={busy}
                    loading={isRemoving}
                  >
                    {t('remove')}
                  </Button>
                )}
              </InlineStack>
            )}
          </BlockStack>
        </InlineStack>

        {isUploading && (
          <Text as="p" variant="bodySm" tone="subdued">
            {t('uploading')}
          </Text>
        )}
        {error && (
          <Banner tone="critical">
            <p>{t(`errors.${error}`)}</p>
          </Banner>
        )}

        {branding.bannerUrl && (
          <BlockStack gap="100">
            <img
              src={branding.bannerUrl}
              alt={t('bannerAlt')}
              className="block aspect-[1200/628] w-full rounded-lg object-cover shadow-sm"
            />
            <Text as="p" variant="bodySm" tone="subdued">
              {t('bannerCaption')}
            </Text>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  )
}
