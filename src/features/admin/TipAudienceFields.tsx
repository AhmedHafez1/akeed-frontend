'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { Button, Input } from '@/shared/ui'
import { getTipRecipients, searchTipOrganizations } from './adminTipsApi'
import {
  organizationLabel,
  type AdminTipOptions,
  type AdminTipOrganization,
  type TipAudienceFilters,
  type TipForm,
  type TipFormIssues,
} from './admin-tips.model'
import { templateFieldClass } from './TemplateWriteUi'
import { TipFieldError, TipsErrorNotice } from './TipsAdminUi'
import { useOrganizationPages } from './useAdminTips'

interface TipAudienceFieldsProps {
  form: TipForm
  onChange: (next: TipForm) => void
  issues: TipFormIssues
  options: AdminTipOptions | null
  /** The saved draft, whose live audience the matching list shows. */
  campaignId: string | null
  revision: number
  /** After publication the audience is frozen and only shown. */
  locked: boolean
}

function toggle(values: string[] | undefined, value: string): string[] {
  const set = new Set(values ?? [])
  if (set.has(value)) set.delete(value)
  else set.add(value)
  return [...set]
}

function CheckboxGroup({
  legend,
  values,
  selected,
  label,
  onToggle,
  hint,
}: {
  legend: string
  values: string[]
  selected: string[] | undefined
  label: (value: string) => string
  onToggle: (value: string) => void
  hint?: string
}) {
  return (
    <fieldset>
      <legend className="text-foreground/80 mb-2 text-xs font-medium">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const checked = selected?.includes(value) ?? false
          return (
            <label
              key={value}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs',
                checked
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'border-border text-foreground/80'
              )}
            >
              <input
                type="checkbox"
                className="accent-primary"
                checked={checked}
                onChange={() => onToggle(value)}
              />
              {label(value)}
            </label>
          )
        })}
      </div>
      {hint && <p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>}
    </fieldset>
  )
}

function OrganizationRow({
  row,
  action,
}: {
  row: AdminTipOrganization
  action: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">
          {organizationLabel(row)}
        </p>
        <p className="text-muted-foreground truncate text-xs" dir="ltr">
          {[row.platform, row.country_code, row.shop_domain]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {action}
    </li>
  )
}

/** Who receives the campaign: picked merchants, or filters with exclusions. */
export function TipAudienceFields({
  form,
  onChange,
  issues,
  options,
  campaignId,
  revision,
  locked,
}: TipAudienceFieldsProps) {
  const t = useTranslations('adminTips.audience')
  const tp = useTranslations('adminTips')
  const [labels, setLabels] = useState<Record<string, string>>({})
  const filters = form.filters

  const setFilters = (patch: Partial<TipAudienceFilters>) => {
    const next: TipAudienceFilters = { ...filters, ...patch }
    for (const key of Object.keys(next) as (keyof TipAudienceFilters)[]) {
      const value = next[key]
      if (
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' &&
          !Array.isArray(value) &&
          Object.keys(value).length === 0)
      )
        delete next[key]
    }
    onChange({ ...form, filters: next })
  }

  const remember = (row: AdminTipOrganization) =>
    setLabels((previous) =>
      previous[row.org_id]
        ? previous
        : { ...previous, [row.org_id]: organizationLabel(row) }
    )

  const picker = useOrganizationPages(searchTipOrganizations, {
    enabled: !locked && form.mode === 'direct',
  })
  const loadMatching = useCallback(
    (params: { search?: string; cursor?: string }) =>
      getTipRecipients(campaignId ?? '', params),
    [campaignId]
  )
  // Also names the picked merchants of a saved campaign, published or not.
  const matching = useOrganizationPages(loadMatching, {
    enabled: campaignId !== null,
    reloadKey: revision,
  })

  const labelFor = (id: string): string => {
    if (labels[id]) return labels[id]
    const row =
      matching.items.find((item) => item.org_id === id) ??
      picker.items.find((item) => item.org_id === id)
    return row ? organizationLabel(row) : id
  }

  return (
    <div className="space-y-5">
      <fieldset disabled={locked} className="space-y-5">
        <div
          role="radiogroup"
          aria-label={t('mode')}
          className="grid gap-3 sm:grid-cols-2"
        >
          {(['direct', 'filters'] as const).map((mode) => (
            <label
              key={mode}
              className={cn(
                'cursor-pointer rounded-xl border p-4',
                form.mode === mode
                  ? 'border-primary bg-primary-subtle'
                  : 'border-border'
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="tip-audience-mode"
                  className="accent-primary"
                  checked={form.mode === mode}
                  onChange={() => onChange({ ...form, mode })}
                />
                {t(`modes.${mode}`)}
              </span>
              <span className="text-muted-foreground mt-1 block text-xs">
                {t(`modes.${mode}Hint`)}
              </span>
            </label>
          ))}
        </div>

        {form.mode === 'direct' ? (
          <div className="space-y-3">
            <p className="text-foreground/80 text-xs font-medium">
              {t('selected', { count: form.selectedOrgIds.length })}
            </p>
            {form.selectedOrgIds.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {form.selectedOrgIds.map((id) => (
                  <li
                    key={id}
                    className="border-border bg-muted inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs"
                  >
                    <span className="max-w-56 truncate">{labelFor(id)}</span>
                    {!locked && (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={t('remove', { name: labelFor(id) })}
                        onClick={() =>
                          onChange({
                            ...form,
                            selectedOrgIds: form.selectedOrgIds.filter(
                              (value) => value !== id
                            ),
                          })
                        }
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <TipFieldError id="selected-error" code={issues.selected_org_ids} />
            {!locked && (
              <>
                <label className="block">
                  <span className="text-foreground/70 mb-1.5 block text-xs font-medium">
                    {t('search')}
                  </span>
                  <Input
                    type="search"
                    value={picker.search}
                    placeholder={t('searchPlaceholder')}
                    onChange={(event) => picker.setSearch(event.target.value)}
                  />
                </label>
                {picker.error && <TipsErrorNotice error={picker.error} />}
                <ul className="border-border divide-border max-h-80 divide-y overflow-y-auto rounded-xl border">
                  {picker.items.map((row) => {
                    const chosen = form.selectedOrgIds.includes(row.org_id)
                    return (
                      <OrganizationRow
                        key={row.org_id}
                        row={row}
                        action={
                          <Button
                            type="button"
                            size="sm"
                            variant={chosen ? 'outline' : 'default'}
                            onClick={() => {
                              remember(row)
                              onChange({
                                ...form,
                                selectedOrgIds: toggle(
                                  form.selectedOrgIds,
                                  row.org_id
                                ),
                              })
                            }}
                          >
                            {chosen ? t('removeShort') : t('add')}
                          </Button>
                        }
                      />
                    )
                  })}
                  {!picker.loading && picker.items.length === 0 && (
                    <li className="text-muted-foreground px-3 py-4 text-sm">
                      {t('noResults')}
                    </li>
                  )}
                </ul>
                {picker.hasMore && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={picker.loadMore}
                    disabled={picker.loading}
                  >
                    {t('loadMore')}
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-muted-foreground text-xs">{t('logic')}</p>
            <CheckboxGroup
              legend={t('countries')}
              values={(options?.countries ?? []).map((row) => row.country_code)}
              selected={filters.countries}
              label={(code) => {
                const row = options?.countries.find(
                  (item) => item.country_code === code
                )
                return row ? `${code} (${row.count})` : code
              }}
              onToggle={(code) =>
                setFilters({ countries: toggle(filters.countries, code) })
              }
              hint={t('countriesHint')}
            />
            <CheckboxGroup
              legend={t('platforms')}
              values={options?.platforms ?? []}
              selected={filters.platforms}
              label={(value) => tp(`platformNames.${value}`)}
              onToggle={(value) =>
                setFilters({ platforms: toggle(filters.platforms, value) })
              }
            />
            <CheckboxGroup
              legend={t('plans')}
              values={options?.plans ?? []}
              selected={filters.plans}
              label={(value) => tp(`planNames.${value}`)}
              onToggle={(value) =>
                setFilters({ plans: toggle(filters.plans, value) })
              }
              hint={t('plansHint')}
            />
            <CheckboxGroup
              legend={t('messageLanguages')}
              values={options?.message_languages ?? []}
              selected={filters.message_languages}
              label={(value) => tp(`messageLanguageNames.${value}`)}
              onToggle={(value) =>
                setFilters({
                  message_languages: toggle(filters.message_languages, value),
                })
              }
              hint={t('messageLanguagesHint')}
            />
            <fieldset>
              <legend className="text-foreground/80 mb-2 text-xs font-medium">
                {t('signup')}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['signup_from', 'signup_to'] as const).map((key) => (
                  <label key={key} className="block">
                    <span className="text-muted-foreground mb-1 block text-xs">
                      {t(key)}
                    </span>
                    <input
                      type="date"
                      dir="ltr"
                      className={templateFieldClass}
                      value={filters[key] ?? ''}
                      aria-invalid={!!issues[`filters.${key}`]}
                      onChange={(event) =>
                        setFilters({ [key]: event.target.value || undefined })
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                {t('signupHint')}
              </p>
              <TipFieldError
                id="signup-error"
                code={issues['filters.signup_to']}
              />
            </fieldset>
            <fieldset>
              <legend className="text-foreground/80 mb-2 text-xs font-medium">
                {t('features')}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(options?.features ?? []).map((feature) => {
                  const value = filters.features?.[feature]
                  return (
                    <label
                      key={feature}
                      className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{tp(`featureNames.${feature}`)}</span>
                      <select
                        className="border-border bg-card rounded-md border px-2 py-1 text-xs"
                        value={
                          value === undefined ? 'any' : value ? 'on' : 'off'
                        }
                        onChange={(event) => {
                          const features = { ...(filters.features ?? {}) }
                          if (event.target.value === 'any')
                            delete features[feature]
                          else features[feature] = event.target.value === 'on'
                          setFilters({ features })
                        }}
                      >
                        <option value="any">{t('featureAny')}</option>
                        <option value="on">{t('featureOn')}</option>
                        <option value="off">{t('featureOff')}</option>
                      </select>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </div>
        )}
      </fieldset>

      {!locked && form.mode === 'filters' && (
        <section className="space-y-3">
          <h3 className="text-foreground text-sm font-semibold">
            {t('matching')}
          </h3>
          {campaignId === null ? (
            <p className="text-muted-foreground text-xs">
              {t('matchingSaveFirst')}
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                {t('matchingHint')}
              </p>
              <Input
                type="search"
                aria-label={t('search')}
                value={matching.search}
                placeholder={t('searchPlaceholder')}
                onChange={(event) => matching.setSearch(event.target.value)}
              />
              {matching.error && <TipsErrorNotice error={matching.error} />}
              <ul className="border-border divide-border max-h-80 divide-y overflow-y-auto rounded-xl border">
                {matching.items.map((row) => {
                  const excluded = form.excludedOrgIds.includes(row.org_id)
                  return (
                    <OrganizationRow
                      key={row.org_id}
                      row={row}
                      action={
                        <Button
                          type="button"
                          size="sm"
                          variant={excluded ? 'default' : 'outline'}
                          aria-pressed={excluded}
                          onClick={() =>
                            onChange({
                              ...form,
                              excludedOrgIds: toggle(
                                form.excludedOrgIds,
                                row.org_id
                              ),
                            })
                          }
                        >
                          {excluded ? t('include') : t('exclude')}
                        </Button>
                      }
                    />
                  )
                })}
                {!matching.loading && matching.items.length === 0 && (
                  <li className="text-muted-foreground px-3 py-4 text-sm">
                    {t('noMatches')}
                  </li>
                )}
              </ul>
              {matching.hasMore && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={matching.loadMore}
                  disabled={matching.loading}
                >
                  {t('loadMore')}
                </Button>
              )}
              <p className="text-muted-foreground text-xs">
                {t('excludedCount', { count: form.excludedOrgIds.length })}
              </p>
              <TipFieldError
                id="excluded-error"
                code={issues.excluded_org_ids}
              />
            </>
          )}
        </section>
      )}
    </div>
  )
}
