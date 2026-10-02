import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SaveTestPhoneOutcome, TestSendOutcome } from './useSettingsModel'
import { useTestPhonePrompt } from './useTestPhonePrompt'

const sendTest = vi.fn<() => Promise<TestSendOutcome>>()
const saveTestPhone = vi.fn<(phone: string) => Promise<SaveTestPhoneOutcome>>()

function setup(phones: { savedPhone?: string; shopPhone?: string } = {}) {
  return renderHook(() =>
    useTestPhonePrompt({
      savedPhone: phones.savedPhone ?? null,
      shopPhone: phones.shopPhone ?? null,
      sendTest,
      saveTestPhone,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  sendTest.mockResolvedValue('sent')
  saveTestPhone.mockResolvedValue({ ok: true })
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ar-SA', 'en'])
})

describe('useTestPhonePrompt', () => {
  describe('requesting a send', () => {
    it('sends straight away to a saved number', async () => {
      const { result } = setup({ savedPhone: '+201001234567' })

      await act(() => result.current.requestSend())

      expect(sendTest).toHaveBeenCalledTimes(1)
      expect(result.current.isOpen).toBe(false)
    })

    it('opens with the store phone when no number is saved', async () => {
      const { result } = setup({ shopPhone: '+971501234567' })

      await act(() => result.current.requestSend())

      expect(sendTest).not.toHaveBeenCalled()
      expect(result.current.isOpen).toBe(true)
      expect(result.current.phone).toBe('+971501234567')
      expect(result.current.defaultCountry).toBe('AE')
      expect(result.current.isSuggested).toBe(true)
    })

    it('opens empty, on the browser country, when nothing is known', async () => {
      const { result } = setup()

      await act(() => result.current.requestSend())

      expect(result.current.isOpen).toBe(true)
      expect(result.current.phone).toBe('')
      expect(result.current.defaultCountry).toBe('SA')
      expect(result.current.isSuggested).toBe(false)
    })

    it('opens when the server no longer has the saved number', async () => {
      sendTest.mockResolvedValue('phoneMissing')
      const { result } = setup({ savedPhone: '+201001234567' })

      await act(() => result.current.requestSend())

      expect(result.current.isOpen).toBe(true)
      expect(result.current.phone).toBe('+201001234567')
    })
  })

  describe('changing the number', () => {
    it('opens with the saved number ahead of the store phone', () => {
      const { result } = setup({
        savedPhone: '+201001234567',
        shopPhone: '+971501234567',
      })

      act(() => result.current.openToChange())

      expect(result.current.phone).toBe('+201001234567')
      expect(result.current.defaultCountry).toBe('EG')
      expect(result.current.isSuggested).toBe(false)
    })

    it('stops calling the number suggested once it is edited', () => {
      const { result } = setup({ shopPhone: '+971501234567' })
      act(() => result.current.openToChange())

      act(() => result.current.setPhone('+971501234568'))

      expect(result.current.isSuggested).toBe(false)
    })
  })

  describe('submitting', () => {
    it('rejects an invalid number without a request', async () => {
      const { result } = setup()
      act(() => result.current.openToChange())
      act(() => result.current.setPhone('+2010'))

      await act(() => result.current.submit())

      expect(result.current.error).toBe('invalid')
      expect(saveTestPhone).not.toHaveBeenCalled()
      expect(sendTest).not.toHaveBeenCalled()

      // Typing again clears the error.
      act(() => result.current.setPhone('+20100'))
      expect(result.current.error).toBeNull()
    })

    it('saves the number, sends the test and closes', async () => {
      const { result } = setup()
      act(() => result.current.openToChange())
      act(() => result.current.setPhone('+201001234567'))

      await act(() => result.current.submit())

      expect(saveTestPhone).toHaveBeenCalledWith('+201001234567')
      expect(sendTest).toHaveBeenCalledTimes(1)
      expect(saveTestPhone.mock.invocationCallOrder[0]).toBeLessThan(
        sendTest.mock.invocationCallOrder[0]
      )
      expect(result.current.isOpen).toBe(false)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('sends without saving when the number is unchanged', async () => {
      const { result } = setup({ savedPhone: '+201001234567' })
      act(() => result.current.openToChange())

      await act(() => result.current.submit())

      expect(saveTestPhone).not.toHaveBeenCalled()
      expect(sendTest).toHaveBeenCalledTimes(1)
      expect(result.current.isOpen).toBe(false)
    })

    it.each(['invalid', 'readOnly', 'saveFailed'] as const)(
      'stays open with the %s error and does not send',
      async (reason) => {
        saveTestPhone.mockResolvedValue({ ok: false, reason })
        const { result } = setup()
        act(() => result.current.openToChange())
        act(() => result.current.setPhone('+201001234567'))

        await act(() => result.current.submit())

        expect(result.current.error).toBe(reason)
        expect(result.current.isOpen).toBe(true)
        expect(sendTest).not.toHaveBeenCalled()
      }
    )

    it('closes after a failed send, which is reported by the model', async () => {
      sendTest.mockResolvedValue('failed')
      const { result } = setup()
      act(() => result.current.openToChange())
      act(() => result.current.setPhone('+201001234567'))

      await act(() => result.current.submit())

      expect(result.current.isOpen).toBe(false)
    })
  })

  it('closes and forgets the error', async () => {
    const { result } = setup()
    act(() => result.current.openToChange())
    await act(() => result.current.submit())
    expect(result.current.error).toBe('invalid')

    act(() => result.current.close())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
