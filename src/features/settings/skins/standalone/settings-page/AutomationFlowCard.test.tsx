import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import ar from '../../../../../../public/messages/ar.json'
import en from '../../../../../../public/messages/en.json'
import {
  buildAutomationTimeline,
  type TimelineInput,
} from '../../../domain/automationTimeline'
import { AutomationFlowCard } from './AutomationFlowCard'

const allOn: TimelineInput = {
  isAutoVerifyEnabled: true,
  sendDelayMinutes: 15,
  followUpEnabled: true,
  followUpDelayMinutes: 120,
  escalationEnabled: true,
  escalationGapMinutes: 360,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '09:00',
}

function renderFlow(
  input: Partial<TimelineInput> = {},
  locale: 'ar' | 'en' = 'ar'
) {
  const view = render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'ar' ? ar : en}
      timeZone="UTC"
    >
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
        <AutomationFlowCard
          timeline={buildAutomationTimeline({ ...allOn, ...input })}
        />
      </div>
    </NextIntlClientProvider>
  )
  const steps = screen.getAllByRole('listitem')
  /** The wait written on the line into each step. */
  const connectorLabels = () =>
    [...view.container.querySelectorAll('li > [aria-hidden="true"]')].map(
      (connector) => connector.textContent
    )
  return { ...view, steps, connectorLabels }
}

describe('AutomationFlowCard', () => {
  it('lists the four steps in order with the wait on each connector (ar)', () => {
    const { steps, connectorLabels } = renderFlow()

    expect(
      screen.getByRole('heading', {
        name: 'ماذا يحدث مع كل طلب دفع عند الاستلام',
      })
    ).toBeTruthy()
    expect(
      screen.getByText('يتحدث هذا المسار مع كل تعديل قبل الحفظ.')
    ).toBeTruthy()
    expect(screen.getByRole('list').tagName).toBe('OL')
    expect(steps).toHaveLength(4)
    expect(connectorLabels()).toEqual([
      'بعد 15 دقيقة',
      'بعد ساعتين',
      'بعد 6 ساعات أخرى',
    ])
    // The same wait is readable in the step itself; nothing reads "Off".
    expect(steps[0].textContent).toBe('طلب جديد')
    expect(within(steps[1]).getByText('رسالة التأكيد')).toBeTruthy()
    expect(
      within(steps[2]).getByText('بعد ساعتين', { selector: '.sr-only' })
    ).toBeTruthy()
    expect(
      within(steps[3]).getByText('بعد 6 ساعات أخرى', { selector: '.sr-only' })
    ).toBeTruthy()
    expect(screen.queryByText('متوقف')).toBeNull()
  })

  it('reads "Immediately" when there is no send delay', () => {
    const { connectorLabels } = renderFlow({ sendDelayMinutes: 0 })

    expect(connectorLabels()[0]).toBe(
      ar.settings.embedded.timing.delayImmediate
    )
  })

  it('writes the waits in English', () => {
    const { steps, connectorLabels } = renderFlow({}, 'en')

    expect(connectorLabels()).toEqual([
      'After 15 minutes',
      'After 2 hours',
      '6 hours later',
    ])
    expect(within(steps[3]).getByText('“Needs your action”')).toBeTruthy()
    expect(renderFlow({ sendDelayMinutes: 0 }, 'en').connectorLabels()[0]).toBe(
      'Immediately'
    )
  })

  it('keeps a reminder that is off in place and measures the alert from the first message', () => {
    const { steps, connectorLabels } = renderFlow({ followUpEnabled: false })

    expect(steps).toHaveLength(4)
    expect(connectorLabels()).toEqual(['بعد 15 دقيقة', 'متوقف', 'بعد 6 ساعات'])
    expect(within(steps[2]).getByText('تذكير إن لم يرد')).toBeTruthy()
    // Visible pill, outside the hidden connector.
    expect(
      within(steps[2])
        .getAllByText('متوقف')
        .some((node) => !node.closest('[aria-hidden="true"]'))
    ).toBe(true)
    expect(within(steps[3]).queryByText('متوقف')).toBeNull()
  })

  it('marks every later step off when auto-confirmation is off', () => {
    const { steps, connectorLabels } = renderFlow({
      isAutoVerifyEnabled: false,
    })

    expect(steps).toHaveLength(4)
    expect(connectorLabels()).toEqual(['متوقف', 'متوقف', 'متوقف'])
    expect(within(steps[0]).queryByText('متوقف')).toBeNull()
    for (const step of steps.slice(1)) {
      expect(within(step).getAllByText('متوقف').length).toBeGreaterThan(0)
    }
    // No message goes out, so quiet hours have nothing to hold back.
    expect(screen.queryByText(/الرسائل التي يحين موعدها/)).toBeNull()
  })

  it('shows the quiet-hours line only while quiet hours are on', () => {
    renderFlow()
    expect(
      screen.getByText(
        'الرسائل التي يحين موعدها بين 10:00 مساءً و9:00 صباحاً تُرسل الساعة 9:00 صباحاً.'
      )
    ).toBeTruthy()
  })

  it('hides the quiet-hours line when quiet hours are off', () => {
    renderFlow({ quietHoursEnabled: false })
    expect(screen.queryByText(/الرسائل التي يحين موعدها/)).toBeNull()
  })
})
