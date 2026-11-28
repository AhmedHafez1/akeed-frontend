'use client'

import { useState, type KeyboardEvent } from 'react'
import {
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineStack,
  Layout,
  Tag,
  Text,
  TextField,
} from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type { SettingsResponse } from '@/features/settings/api/settingsApi'
import {
  PREVIEW_CUSTOMER_NAMES,
  PREVIEW_ORDER_NUMBER,
  previewTotal,
} from '@/features/settings/domain/messagePreview'
import { SETTINGS_FIELD_ID } from '@/features/settings/domain/settingsForm'
import {
  addShippingTag,
  type ShippingTagError,
} from '@/features/settings/domain/shippingTags'
import type { EmbeddedSettingsModel } from '@/features/settings/domain/useEmbeddedSettings'
import { initialPreviewLanguage } from '@/features/settings/domain/useMessageStyles'
import { SettingsPhonePreview } from '@/features/settings/skins/shared/SettingsPhonePreview'
import {
  getMessageLanguageDirection,
  isMessageLanguage,
  type MessageLanguage,
} from '@/shared/lib/messageLanguage'
import type { TemplateMessage } from '@/shared/lib/templateMessage'

interface ShippingTabProps {
  model: EmbeddedSettingsModel
  data: SettingsResponse
  readOnly: boolean
}

/** The Shipped message in the store's language, or the first one that exists. */
function previewMessage(
  data: SettingsResponse,
  language: MessageLanguage
): { language: MessageLanguage; message: TemplateMessage } {
  const messages = data.shipping?.messages
  for (const candidate of [language, 'ar', 'en'] as const) {
    const message = messages?.[candidate]
    if (message) return { language: candidate, message }
  }
  return {
    language,
    message: {
      lines: [],
      buttons: [],
      direction: getMessageLanguageDirection(language),
      source: 'registered',
    },
  }
}

/** Typed tags become chips; a refused tag is explained under the field. */
function ShippingTagsField({
  tags,
  readOnly,
  serverError,
  onChange,
}: {
  tags: string[]
  readOnly: boolean
  serverError: boolean
  onChange: (tags: string[]) => void
}) {
  const t = useTranslations('settings.embedded.shipping')
  const [input, setInput] = useState('')
  const [error, setError] = useState<ShippingTagError | null>(null)

  const add = () => {
    const result = addShippingTag(tags, input)
    if (!result) return
    if ('error' in result) {
      setError(result.error)
      return
    }
    setError(null)
    setInput('')
    onChange(result.tags)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    add()
  }
  const errorText = error ? (
    <span>
      {t.rich(`tagErrors.${error}`, {
        tag: (chunks) => <bdi dir="ltr">{chunks}</bdi>,
      })}
    </span>
  ) : serverError ? (
    t('tagErrors.invalid')
  ) : undefined

  return (
    <BlockStack gap="200">
      <div onKeyDown={onKeyDown}>
        <TextField
          id={SETTINGS_FIELD_ID.shippingTags}
          label={t('tagsLabel')}
          value={input}
          placeholder={t('tagsPlaceholder')}
          helpText={errorText ? undefined : t('tagsHelp')}
          error={errorText}
          disabled={readOnly}
          autoComplete="off"
          onChange={(value) => {
            setInput(value)
            if (error) setError(null)
          }}
          connectedRight={
            <Button disabled={readOnly || !input.trim()} onClick={add}>
              {t('add')}
            </Button>
          }
        />
      </div>
      {tags.length > 0 && (
        <InlineStack gap="200">
          {tags.map((tag) => (
            <Tag
              key={tag}
              disabled={readOnly}
              // Polaris words the remove button: "Remove {tag}".
              accessibilityLabel={tag}
              onRemove={
                readOnly
                  ? undefined
                  : () => onChange(tags.filter((saved) => saved !== tag))
              }
            >
              <bdi>{tag}</bdi>
            </Tag>
          ))}
        </InlineStack>
      )}
    </BlockStack>
  )
}

/**
 * Settings › Shipping (Shopify): the switch, what marks an order as shipped
 * (fulfillment, tags) and the Shipped message on a phone. Shown only where
 * the backend sends the shipping fields; viewers see it all disabled.
 */
export function ShippingTab({ model, data, readOnly }: ShippingTabProps) {
  const t = useTranslations('settings.embedded.shipping')
  const values = model.values
  if (!values || values.shippingNotificationsEnabled === undefined) return null

  const enabled = values.shippingNotificationsEnabled
  const fulfillment = values.shippingFulfillmentTriggerEnabled !== false
  const tags = values.shippingTags ?? []
  const storeLanguage = isMessageLanguage(values.defaultLanguage)
    ? values.defaultLanguage
    : initialPreviewLanguage(data)
  const preview = previewMessage(data, storeLanguage)
  const sample = {
    customer: PREVIEW_CUSTOMER_NAMES[preview.language],
    store: values.storeName.trim() || 'Akeed Store',
    order: PREVIEW_ORDER_NUMBER,
    total: previewTotal(
      data.state.messageCurrency ?? data.state.shippingCurrency,
      preview.language
    ),
    tracking: data.shipping?.trackingSamples[preview.language] ?? '',
  }

  return (
    <Layout>
      <Layout.AnnotatedSection
        id="settings-shipping"
        title={t('sectionTitle')}
        description={t('sectionDescription')}
      >
        <Card>
          <Checkbox
            label={t('masterLabel')}
            checked={enabled}
            disabled={readOnly}
            onChange={(checked) =>
              model.update({ shippingNotificationsEnabled: checked })
            }
          />
        </Card>
      </Layout.AnnotatedSection>

      {enabled && (
        <Layout.AnnotatedSection
          id="settings-shipping-when"
          title={t('whenTitle')}
          description={t('whenDescription')}
        >
          <Card>
            <BlockStack gap="400">
              <Checkbox
                label={t('fulfillLabel')}
                helpText={t('fulfillHelp')}
                checked={fulfillment}
                disabled={readOnly}
                onChange={(checked) =>
                  model.update({ shippingFulfillmentTriggerEnabled: checked })
                }
              />
              <Divider />
              <ShippingTagsField
                tags={tags}
                readOnly={readOnly}
                serverError={model.errors.shippingTags === 'invalidTags'}
                onChange={(next) => model.update({ shippingTags: next })}
              />
              {!fulfillment && tags.length === 0 && (
                <Text as="p" variant="bodySm" tone="caution">
                  {t('noTrigger')}
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>
      )}

      <Layout.AnnotatedSection
        id="settings-shipping-message"
        title={t('messageTitle')}
        description={t('messageDescription')}
      >
        <Card>
          <BlockStack gap="300">
            <div className="mx-auto w-full max-w-85">
              <SettingsPhonePreview
                language={preview.language}
                message={preview.message}
                sample={sample}
                label={t('previewLabel')}
                emptyLabel={t('previewEmpty')}
              />
            </div>
            <Text as="p" variant="bodySm" tone="subdued">
              {t('billingLine')}
            </Text>
          </BlockStack>
        </Card>
      </Layout.AnnotatedSection>
    </Layout>
  )
}
