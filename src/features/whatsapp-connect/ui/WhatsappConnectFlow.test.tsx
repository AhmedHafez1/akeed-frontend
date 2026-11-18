import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextIntlClientProvider } from 'next-intl'
import en from '../../../../public/messages/en.json'
import ar from '../../../../public/messages/ar.json'
import { ApiError } from '@/shared/lib/http'
import {
  claimConnectTicket,
  completeWhatsappSignup,
  relaunchWhatsappSignup,
} from '../api/whatsappConnectApi'
import { leavePage } from '../hooks/leavePage'
import { WhatsappConnectFlow } from './WhatsappConnectFlow'

vi.mock('../api/whatsappConnectApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/whatsappConnectApi')>()),
  claimConnectTicket: vi.fn(),
  completeWhatsappSignup: vi.fn(),
  relaunchWhatsappSignup: vi.fn(),
}))
vi.mock('../hooks/leavePage', () => ({ leavePage: vi.fn() }))

const TICKET = 'T'.repeat(43)
const SIGNUP_TICKET = 'S'.repeat(43)
const CODE = 'AQD-fake-code'
const META_URL = 'https://www.facebook.com/v26.0/dialog/oauth?state=S'

const claim = vi.mocked(claimConnectTicket)
const complete = vi.mocked(completeWhatsappSignup)
const relaunch = vi.mocked(relaunchWhatsappSignup)
const leave = vi.mocked(leavePage)

function renderPage(locale: 'en' | 'ar' = 'en') {
  return render(
    <StrictMode>
      <NextIntlClientProvider
        locale={locale}
        messages={locale === 'en' ? en : ar}
        timeZone="UTC"
      >
        <WhatsappConnectFlow />
      </NextIntlClientProvider>
    </StrictMode>
  )
}

function arriveAt(search: string, hash = '') {
  window.history.replaceState(null, '', `/en/whatsapp/connect${search}${hash}`)
}

const signedClaim = (expiresInMs = 30 * 60_000) => ({
  signupTicket: SIGNUP_TICKET,
  expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  signupUrl: META_URL,
})

beforeEach(() => {
  arriveAt(`?ticket=${TICKET}`)
  claim.mockReset().mockResolvedValue(signedClaim())
  complete.mockReset().mockResolvedValue({
    state: 'connecting',
    displayPhoneNumber: '+20 100 555 0101',
    signupPath: 'new_number',
  })
  relaunch.mockReset().mockResolvedValue({
    ...signedClaim(),
    signupUrl: `${META_URL}2`,
  })
  leave.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WhatsappConnectFlow: from the link', () => {
  it('takes the ticket out of the address, claims it once for this language and stores it nowhere', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    renderPage()
    await screen.findByRole('button', { name: en.whatsappConnect.launch })
    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/en/whatsapp/connect')
    expect(claim).toHaveBeenCalledTimes(1)
    expect(claim).toHaveBeenCalledWith(TICKET, 'en')
    expect(setItem.mock.calls.flat().join()).not.toContain(TICKET)
    setItem.mockRestore()
  })

  it('explains what connecting changes before going to Facebook', async () => {
    renderPage()
    await screen.findByRole('heading', {
      name: en.whatsappConnect.before.heading,
    })
    for (const key of ['sending', 'billing', 'app', 'activity'] as const)
      expect(screen.getByText(en.whatsappConnect.before[key])).toBeTruthy()
    expect(screen.getByText(en.whatsappConnect.before.meta)).toBeTruthy()
  })

  it('sends this tab to Meta once, without opening another', async () => {
    const open = vi.spyOn(window, 'open')
    renderPage()
    const button = await screen.findByRole('button', {
      name: en.whatsappConnect.launch,
    })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(leave).toHaveBeenCalledTimes(1)
    expect(leave).toHaveBeenCalledWith(META_URL)
    expect(open).not.toHaveBeenCalled()
    expect((button as HTMLButtonElement).disabled).toBe(true)
    // Going to Facebook never shows the connection as made.
    expect(screen.queryByText(en.whatsappConnect.setupPending)).toBeNull()
    open.mockRestore()
  })

  it('says where to start when there is no ticket, without claiming', async () => {
    arriveAt('')
    renderPage()
    expect(await screen.findByText(en.whatsappConnect.missing)).toBeTruthy()
    expect(claim).not.toHaveBeenCalled()
  })

  it('translates a refused ticket', async () => {
    claim.mockRejectedValue(
      new ApiError('x', 401, 'WHATSAPP_CONNECT_TICKET_INVALID')
    )
    renderPage()
    expect(
      await screen.findByText(en.whatsappConnect.errors.ticketInvalid)
    ).toBeTruthy()
  })

  it('expires with the signup ticket while waiting for the click', async () => {
    claim.mockResolvedValue(signedClaim(1_000))
    renderPage()
    expect(
      await screen.findByText(en.whatsappConnect.expired, undefined, {
        timeout: 3_000,
      })
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: en.whatsappConnect.launch })
    ).toBeNull()
  })

  it('renders in Arabic', async () => {
    window.history.replaceState(
      null,
      '',
      `/ar/whatsapp/connect?ticket=${TICKET}`
    )
    renderPage('ar')
    expect(
      await screen.findByRole('heading', { name: ar.whatsappConnect.title })
    ).toBeTruthy()
    expect(
      await screen.findByRole('button', { name: ar.whatsappConnect.launch })
    ).toBeTruthy()
    expect(claim).toHaveBeenCalledWith(TICKET, 'ar')
  })
})

describe('WhatsappConnectFlow: back from Meta', () => {
  it('cleans the address, submits the code once and shows setup pending only after the server saved it', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof complete>>) => void
    complete.mockReturnValue(new Promise((r) => (resolve = r)))
    arriveAt(`?code=${CODE}&state=${SIGNUP_TICKET}`, '#_=_')
    renderPage()
    expect(await screen.findByText(en.whatsappConnect.submitting)).toBeTruthy()
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete).toHaveBeenCalledWith({
      signupTicket: SIGNUP_TICKET,
      code: CODE,
      redirectLocale: 'en',
    })
    expect(claim).not.toHaveBeenCalled()
    expect(screen.queryByText(en.whatsappConnect.connected.heading)).toBeNull()

    await act(async () =>
      resolve({
        state: 'connecting',
        displayPhoneNumber: '+20 100 555 0101',
        signupPath: 'new_number',
      })
    )
    expect(
      await screen.findByText(en.whatsappConnect.connected.heading)
    ).toBeTruthy()
    expect(screen.getByText('+20 100 555 0101')).toBeTruthy()
    expect(screen.getByText(en.whatsappConnect.setupPending)).toBeTruthy()
    expect(
      screen
        .getByRole('list', { name: en.whatsappConnect.steps.label })
        .querySelector('[aria-current="step"]')?.textContent
    ).toContain(en.whatsappConnect.steps.setup)
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('translates a refused completion and points back to settings', async () => {
    complete.mockRejectedValue(
      new ApiError('x', 409, 'WHATSAPP_NUMBER_ALREADY_CONNECTED')
    )
    arriveAt(`?code=${CODE}&state=${SIGNUP_TICKET}`)
    renderPage()
    expect(
      await screen.findByText(en.whatsappConnect.errors.numberAlreadyConnected)
    ).toBeTruthy()
    expect(screen.getByText(en.whatsappConnect.startAgain)).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: en.whatsappConnect.tryAgain })
    ).toBeNull()
  })

  it('treats a cancel as cancelled and goes again with a fresh link', async () => {
    arriveAt(
      `?error=access_denied&error_code=200&error_reason=user_denied&state=${SIGNUP_TICKET}`
    )
    renderPage()
    expect(await screen.findByText(en.whatsappConnect.cancelled)).toBeTruthy()
    expect(window.location.search).toBe('')
    expect(complete).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('button', { name: en.whatsappConnect.tryAgain })
    )
    await waitFor(() => expect(leave).toHaveBeenCalledWith(`${META_URL}2`))
    expect(relaunch).toHaveBeenCalledTimes(1)
    expect(relaunch).toHaveBeenCalledWith(SIGNUP_TICKET, 'en')
  })

  it('points back to settings when the fresh link is refused', async () => {
    relaunch.mockRejectedValue(
      new ApiError('x', 401, 'WHATSAPP_CONNECT_TICKET_INVALID')
    )
    arriveAt(`?error=access_denied&state=${SIGNUP_TICKET}`)
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: en.whatsappConnect.tryAgain })
    )
    expect(
      await screen.findByText(en.whatsappConnect.errors.ticketInvalid)
    ).toBeTruthy()
    expect(leave).not.toHaveBeenCalled()
  })

  it.each([
    ['2655093', en.whatsappConnect.metaErrors.sharedWithPartner],
    ['3441045', en.whatsappConnect.metaErrors.notEligible],
    ['9999999', en.whatsappConnect.metaErrors.default],
  ])('gives guidance for Meta error %s', async (code, text) => {
    arriveAt(
      `?error=server_error&error_code=${code}&error_description=raw+provider+text&state=${SIGNUP_TICKET}`
    )
    renderPage()
    expect(await screen.findByText(text)).toBeTruthy()
    expect(screen.queryByText(/raw provider text/)).toBeNull()
    expect(
      screen.getByRole('button', { name: en.whatsappConnect.tryAgain })
    ).toBeTruthy()
  })

  it.each([
    [`?code=${CODE}`],
    [`?code=${CODE}&state=short`],
    [`?code=has%20space&state=${SIGNUP_TICKET}`],
    [`?state=${SIGNUP_TICKET}`],
  ])('refuses a return that does not add up: %s', async (search) => {
    arriveAt(search)
    renderPage()
    expect(
      await screen.findByText(en.whatsappConnect.errors.ticketInvalid)
    ).toBeTruthy()
    expect(window.location.search).toBe('')
    expect(complete).not.toHaveBeenCalled()
  })
})
