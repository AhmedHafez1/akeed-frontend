'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Layout,
  Page,
  Text,
} from '@shopify/polaris'
import { ShieldCheckMarkIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'

export function MessagePreviewEmbeddedSkin() {
  const t = useTranslations('messagePreview')
  const [language, setLanguage] = useState<IntegrationOnboardingLanguage>('ar')
  const previewSrc =
    language === 'ar'
      ? '/images/Preview/ar-preview-light.png'
      : '/images/Preview/en-preview-light.png'

  return (
    <Page title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="200" align="end">
                <Button
                  size="slim"
                  pressed={language === 'ar'}
                  onClick={() => setLanguage('ar')}
                >
                  {t('languageArabic')}
                </Button>
                <Button
                  size="slim"
                  pressed={language === 'en'}
                  onClick={() => setLanguage('en')}
                >
                  {t('languageEnglish')}
                </Button>
              </InlineStack>

              <Box
                background="bg-surface-secondary"
                borderColor="border"
                borderRadius="300"
                borderWidth="025"
                padding={{ xs: '300', md: '500' }}
              >
                <div className="mx-auto max-w-[760px] overflow-hidden rounded-2xl border border-[#d9d9d9] bg-white shadow-sm">
                  <Image
                    src={previewSrc}
                    alt={t('imageAlt')}
                    width={1200}
                    height={750}
                    className="h-auto w-full"
                    priority={false}
                  />
                </div>
              </Box>

              <InlineStack gap="150" blockAlign="center" align="center">
                <Icon source={ShieldCheckMarkIcon} tone="success" />
                <Text as="p" tone="subdued" variant="bodySm">
                  {t('trustNote')}
                </Text>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
