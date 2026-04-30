'use client'

import { useState } from 'react'
import {
  Badge,
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import {
  getTemplateContent,
  renderTemplateBody,
  sampleData,
} from '../lib/templatePreviewContent'
import type { TemplateLanguage } from '../lib/templatePreviewContent'

interface VerificationTemplatePreviewProps {
  variant?: 'full' | 'compact'
  defaultLanguage?: TemplateLanguage
}

export function VerificationTemplatePreview({
  variant = 'full',
  defaultLanguage = 'ar',
}: VerificationTemplatePreviewProps) {
  const t = useTranslations('messagePreview')
  const [language, setLanguage] = useState<TemplateLanguage>(defaultLanguage)

  const template = getTemplateContent(language)
  const messageText = renderTemplateBody(template, sampleData)
  const isRtl = language === 'ar'

  return (
    <BlockStack gap={variant === 'full' ? '400' : '300'}>
      {variant === 'full' && (
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">
            {t('title')}
          </Text>
          <Text as="p" tone="subdued" variant="bodySm">
            {t('subtitle')}
          </Text>
        </BlockStack>
      )}

      {variant === 'compact' && (
        <Text as="h3" variant="headingSm">
          {t('title')}
        </Text>
      )}

      <InlineStack gap="200">
        <Button
          size="micro"
          variant={language === 'ar' ? 'primary' : 'secondary'}
          onClick={() => setLanguage('ar')}
        >
          العربية
        </Button>
        <Button
          size="micro"
          variant={language === 'en' ? 'primary' : 'secondary'}
          onClick={() => setLanguage('en')}
        >
          English
        </Button>
      </InlineStack>

      <Box
        background="bg-surface-secondary"
        borderRadius="300"
        padding="400"
      >
        <BlockStack gap="300">
          <InlineStack gap="200" align="start" blockAlign="center">
            <Badge tone="info">{t('whatsappLabel')}</Badge>
            <Text as="span" tone="subdued" variant="bodySm">
              {t('sampleBadge')}
            </Text>
          </InlineStack>

          <Box
            background="bg-surface"
            borderRadius="200"
            padding="300"
            shadow="100"
          >
            <div
              dir={isRtl ? 'rtl' : 'ltr'}
              style={{ textAlign: isRtl ? 'right' : 'left' }}
            >
              <Text as="p" variant="bodyMd">
                {messageText.split('\n').map((line, index) => (
                  <span key={index}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))}
              </Text>
            </div>
          </Box>

          <InlineStack gap="200">
            <Box
              background="bg-fill-success-secondary"
              borderRadius="200"
              padding="200"
              minWidth="0"
            >
              <Text
                as="span"
                variant="bodySm"
                fontWeight="medium"
                alignment="center"
              >
                {template.confirmButton}
              </Text>
            </Box>
            <Box
              background="bg-fill-critical-secondary"
              borderRadius="200"
              padding="200"
              minWidth="0"
            >
              <Text
                as="span"
                variant="bodySm"
                fontWeight="medium"
                alignment="center"
              >
                {template.cancelButton}
              </Text>
            </Box>
          </InlineStack>
        </BlockStack>
      </Box>

      <Text as="p" tone="subdued" variant="bodySm">
        {t('trustNote')}
      </Text>
    </BlockStack>
  )
}
