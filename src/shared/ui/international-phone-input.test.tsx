import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  ALLOWED_COUNTRIES,
  InternationalPhoneInput,
} from './international-phone-input'

describe('InternationalPhoneInput country list', () => {
  it('never offers Israel', () => {
    expect(ALLOWED_COUNTRIES).not.toContain('IL')
    expect(ALLOWED_COUNTRIES).toContain('EG')
  })

  it('renders no Israel option, even when asked to default to it', () => {
    const { container } = render(
      <InternationalPhoneInput
        value={undefined}
        onChange={() => {}}
        defaultCountry="IL"
      />
    )
    const options = Array.from(container.querySelectorAll('option'))
    expect(options.length).toBeGreaterThan(100)
    expect(options.some((option) => option.value === 'IL')).toBe(false)
    expect(
      options.some((option) => /israel/i.test(option.textContent ?? ''))
    ).toBe(false)
  })
})
