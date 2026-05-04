'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Badge,
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
import { InfoIcon, ShieldCheckMarkIcon, ViewIcon } from '@shopify/polaris-icons'
import { useTranslations } from 'next-intl'
import type { IntegrationOnboardingLanguage } from '@/features/onboarding'

export function MessagePreviewEmbeddedSkin() {
  const t = useTranslations('messagePreview')
  const [language, setLanguage] = useState<IntegrationOnboardingLanguage>('ar')
  const previewSrc =
    language === 'ar'
      ? '/images/preview/ar-preview-light.png'
      : '/images/preview/en-preview-dark.png'

  return (
    <Page title={t('pageTitle')} subtitle={t('pageSubtitle')}>
      <BlockStack gap="500">
        <InlineStack align="end" gap="200">
          <Button pressed={language === 'ar'} onClick={() => setLanguage('ar')}>
            {t('languageArabic')}
          </Button>
          <Button pressed={language === 'en'} onClick={() => setLanguage('en')}>
            {t('languageEnglish')}
          </Button>
        </InlineStack>

        <Layout>
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <TemplateInfoCard
                title={t('aboutTitle')}
                description={t('aboutDescription')}
                purposeLabel={t('purposeLabel')}
                purposeValue={t('purposeValue')}
                channelLabel={t('channelLabel')}
                channelValue={t('whatsappLabel')}
              />
              <TrustCard title={t('trustTitle')} note={t('trustNote')} />
            </BlockStack>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={ViewIcon} tone="subdued" />
                  <Text as="h2" variant="headingMd">
                    {t('previewHeading')}
                  </Text>
                </InlineStack>
                <Box
                  background="bg-surface-secondary"
                  borderColor="border"
                  borderRadius="300"
                  borderWidth="025"
                  padding={{ xs: '400', md: '600' }}
                >
                  <InlineStack align="center">
                    <PhoneImagePreview src={previewSrc} alt={t('imageAlt')} />
                  </InlineStack>
                </Box>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  )
}

function TemplateInfoCard({
  title,
  description,
  purposeLabel,
  purposeValue,
  channelLabel,
  channelValue,
}: {
  title: string
  description: string
  purposeLabel: string
  purposeValue: string
  channelLabel: string
  channelValue: string
}) {
  return (
    <Card>
      <BlockStack gap="500">
        <InlineStack gap="200" blockAlign="center">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          <Icon source={InfoIcon} tone="subdued" />
        </InlineStack>

        <Text as="p" variant="bodyMd">
          {description}
        </Text>

        <BlockStack gap="300">
          <InlineStack align="space-between" gap="400">
            <Text as="span" tone="subdued">
              {purposeLabel}
            </Text>
            <Text as="span" fontWeight="medium">
              {purposeValue}
            </Text>
          </InlineStack>
          <InlineStack align="space-between" gap="400">
            <Text as="span" tone="subdued">
              {channelLabel}
            </Text>
            <Badge tone="success">{channelValue}</Badge>
          </InlineStack>
        </BlockStack>
      </BlockStack>
    </Card>
  )
}

function TrustCard({ title, note }: { title: string; note: string }) {
  return (
    <Card>
      <InlineStack gap="400" blockAlign="center" wrap={false}>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50">
          <Icon source={ShieldCheckMarkIcon} tone="success" />
        </span>
        <BlockStack gap="100">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          <Text as="p" tone="subdued" variant="bodySm">
            {note}
          </Text>
        </BlockStack>
      </InlineStack>
    </Card>
  )
}

function PhoneImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full max-w-[340px] rounded-[2.75rem] border-[10px] border-[#111213] bg-[#111213] shadow-xl">
      <div className="absolute top-4 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

      <div className="overflow-hidden rounded-[2.05rem] bg-white">
        <div className="flex h-11 items-center justify-between px-6 text-xs font-semibold text-[#111213]">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-4 rounded-[2px] border border-[#111213]" />
            <span className="h-2 w-2 rounded-full bg-[#111213]" />
          </span>
        </div>

        <div className="relative h-[560px] w-full overflow-hidden bg-white">
          <Image
            src={src}
            alt={alt}
            fill
            priority={false}
            className="object-contain object-top"
            sizes="340px"
          />
        </div>
      </div>
    </div>
  )
}
