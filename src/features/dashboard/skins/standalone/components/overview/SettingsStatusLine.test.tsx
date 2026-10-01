import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import type { DashboardOverview } from '@/features/dashboard/model/dashboard.model'
import { renderStandalone } from '../shared/standaloneTestUtils'
import { SettingsStatusLine } from './SettingsStatusLine'

const settings = {
  auto_verify_enabled: true,
  follow_up_enabled: true,
  follow_up_delay_minutes: 15,
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
} as DashboardOverview['settings']

describe('SettingsStatusLine', () => {
  it('summarizes the timing settings and links to the Timing tab', () => {
    renderStandalone(<SettingsStatusLine settings={settings} />)

    expect(screen.getByRole('list', { name: 'إعدادات التأكيد' })).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(
      screen
        .getByRole('link', { name: 'تعديل إعدادات التأكيد' })
        .getAttribute('href')
    ).toBe('/ar/settings?tab=timing')
  })
})
