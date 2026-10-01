import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AkChoiceCard, AkChoiceGroup } from './ak-choice-card'
import { AkSegmented } from './ak-segmented'
import { AkSelect } from './ak-select'
import { AkSwitch } from './ak-switch'

describe('AkSwitch', () => {
  it('is a named switch that reports the opposite state when pressed', () => {
    const onCheckedChange = vi.fn()
    render(
      <div dir="rtl">
        <AkSwitch
          checked={false}
          onCheckedChange={onCheckedChange}
          aria-label="ساعات الهدوء"
        />
      </div>
    )

    const control = screen.getByRole('switch', { name: 'ساعات الهدوء' })
    expect(control.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(control)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('does nothing while disabled', () => {
    const onCheckedChange = vi.fn()
    render(
      <AkSwitch
        checked
        onCheckedChange={onCheckedChange}
        disabled
        aria-label="x"
      />
    )

    fireEvent.click(screen.getByRole('switch'))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})

describe('AkSegmented', () => {
  it('marks the current option as pressed and reports the chosen one', () => {
    const onValueChange = vi.fn()
    render(
      <div dir="rtl">
        <AkSegmented
          aria-label="لغة المعاينة"
          value="ar"
          onValueChange={onValueChange}
          options={[
            { value: 'ar', label: 'العربية' },
            { value: 'en', label: 'الإنجليزية' },
          ]}
        />
      </div>
    )

    expect(screen.getByRole('group', { name: 'لغة المعاينة' })).toBeTruthy()
    const arabic = screen.getByRole('button', { name: 'العربية' })
    const english = screen.getByRole('button', { name: 'الإنجليزية' })
    expect(arabic.getAttribute('aria-pressed')).toBe('true')
    expect(english.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(english)
    expect(onValueChange).toHaveBeenCalledWith('en')
  })
})

describe('AkSelect', () => {
  it('is a labelled native select that reports the picked value', () => {
    const onChange = vi.fn()
    render(
      <div dir="rtl">
        <label htmlFor="zone">المنطقة الزمنية</label>
        <AkSelect
          id="zone"
          value="Africa/Cairo"
          onChange={(event) => onChange(event.target.value)}
          aria-invalid
          options={[
            { value: 'Africa/Cairo', label: 'مصر' },
            { value: 'Asia/Riyadh', label: 'السعودية' },
          ]}
        />
      </div>
    )

    const select = screen.getByLabelText('المنطقة الزمنية') as HTMLSelectElement
    expect(select.tagName).toBe('SELECT')
    expect(select.value).toBe('Africa/Cairo')
    expect(select.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getAllByRole('option')).toHaveLength(2)

    fireEvent.change(select, { target: { value: 'Asia/Riyadh' } })
    expect(onChange).toHaveBeenCalledWith('Asia/Riyadh')
  })
})

function LanguageChoices() {
  const [value, setValue] = useState('auto')
  const choices = [
    ['auto', 'تلقائي'],
    ['ar', 'العربية دائمًا'],
    ['en', 'الإنجليزية دائمًا'],
  ]
  return (
    // jsdom does not inherit `direction`, so it is set on the group itself.
    <AkChoiceGroup
      dir="rtl"
      style={{ direction: 'rtl' }}
      aria-label="لغة الرسالة"
    >
      {choices.map(([id, title]) => (
        <AkChoiceCard
          key={id}
          checked={value === id}
          onSelect={() => setValue(id)}
          title={title}
          description={id === 'auto' ? 'حسب رقم العميل' : undefined}
        />
      ))}
    </AkChoiceGroup>
  )
}

describe('AkChoiceGroup', () => {
  it('is a radio group with one checked card as its only tab stop', () => {
    render(<LanguageChoices />)

    expect(screen.getByRole('radiogroup', { name: 'لغة الرسالة' })).toBeTruthy()
    const radios = screen.getAllByRole('radio')
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ])
    expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1])

    fireEvent.click(radios[2])
    expect(radios[2].getAttribute('aria-checked')).toBe('true')
    expect(radios[0].getAttribute('aria-checked')).toBe('false')
  })

  it('moves the selection with the arrow keys, following RTL', () => {
    render(<LanguageChoices />)
    const radios = screen.getAllByRole('radio')
    radios[0].focus()

    // In RTL the next card is to the left.
    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' })
    expect(radios[1].getAttribute('aria-checked')).toBe('true')
    expect(document.activeElement).toBe(radios[1])

    fireEvent.keyDown(radios[1], { key: 'ArrowRight' })
    expect(radios[0].getAttribute('aria-checked')).toBe('true')

    // Vertical arrows wrap around the group.
    fireEvent.keyDown(radios[0], { key: 'ArrowUp' })
    expect(radios[2].getAttribute('aria-checked')).toBe('true')
  })
})
