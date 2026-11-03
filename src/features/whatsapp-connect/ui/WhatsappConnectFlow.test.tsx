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
} from '../api/whatsappConnectApi'
import {
  resetFacebookSdkForTests,
  type FacebookLoginResponse,
  type FacebookSdk,
} from '../hooks/facebookSdk'
import { SESSION_WAIT_MS } from '../hooks/useEmbeddedSignup'
import { WhatsappConnectFlow } from './WhatsappConnectFlow'

vi.mock('../api/whatsappConnectApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/whatsappConnectApi')>()),
  claimConnectTicket: vi.fn(),
  completeWhatsappSignup: vi.fn(),
}))

const TICKET = 'T'.repeat(43)
const TRUSTED = 'https://www.facebook.com'
const SESSION = {
  type: 'WA_EMBEDDED_SIGNUP',
  event: 'FINISH',
  data: {
    phone_number_id: '106540352242922',
    is_on_biz_app: false,
    messaging_account_ids: ['102290129340398'],
    primary_waac_ids: [],
  },
}

const claim = vi.mocked(claimConnectTicket)
const complete = vi.mocked(completeWhatsappSignup)

let loginCallback: ((response: FacebookLoginResponse) => void) | null
let fb: { init: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> }

function installFacebook() {
  loginCallback = null
  fb = {
    init: vi.fn(),
    login: vi.fn((callback: (response: FacebookLoginResponse) => void) => {
      loginCallback = callback
    }),
  }
  window.FB = fb as unknown as FacebookSdk
}

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

const post = (data: unknown, origin = TRUSTED) =>
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, data }))
  })

const answerLogin = (code: string | null) =>
  act(() => {
    loginCallback?.(code ? { authResponse: { code } } : { status: 'unknown' })
  })

async function launch() {
  const button = await screen.findByRole('button', {
    name: en.whatsappConnect.launch,
  })
  await waitFor(
    () => expect((button as HTMLButtonElement).disabled).toBe(false),
    {
      onTimeout: (e) => {
        console.log(
          'INIT CALLS',
          fb.init.mock.calls.length,
          'FB',
          typeof window.FB
        )
        return e
      },
    }
  )
  fireEvent.click(button)
}

beforeEach(() => {
  resetFacebookSdkForTests()
  installFacebook()
  window.history.replaceState(null, '', `/en/whatsapp/connect?ticket=${TICKET}`)
  claim.mockReset().mockResolvedValue({
    signupTicket: 'S'.repeat(43),
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    appId: '999653349077771',
    configId: '2344392272632365',
    graphApiVersion: 'v26.0',
  })
  complete.mockReset().mockResolvedValue({
    state: 'connecting',
    displayPhoneNumber: '+20 100 555 0101',
    signupPath: 'new_number',
  })
})

afterEach(() => {
  vi.useRealTimers()
  resetFacebookSdkForTests()
})

describe('WhatsappConnectFlow', () => {
  it('takes the ticket out of the address, claims it once and stores it nowhere', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    renderPage()
    await screen.findByRole('button', { name: en.whatsappConnect.launch })
    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/en/whatsapp/connect')
    expect(claim).toHaveBeenCalledTimes(1)
    expect(claim).toHaveBeenCalledWith(TICKET)
    expect(setItem.mock.calls.flat().join()).not.toContain(TICKET)
    setItem.mockRestore()
  })

  it('explains what connecting changes before launching', async () => {
    renderPage()
    await screen.findByRole('heading', {
      name: en.whatsappConnect.before.heading,
    })
    for (const key of ['sending', 'billing', 'app', 'activity'] as const)
      expect(screen.getByText(en.whatsappConnect.before[key])).toBeTruthy()
  })

  it('says where to start when there is no ticket, without claiming', async () => {
    window.history.replaceState(null, '', '/en/whatsapp/connect')
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

  it('launches v5 with the documented options, and nothing more', async () => {
    renderPage()
    await launch()
    expect(fb.init).toHaveBeenCalledTimes(1)
    expect(fb.init).toHaveBeenCalledWith(
      expect.objectContaining({ appId: '999653349077771', version: 'v26.0' })
    )
    expect(fb.login).toHaveBeenCalledTimes(1)
    expect(fb.login.mock.calls[0][1]).toEqual({
      config_id: '2344392272632365',
      response_type: 'code',
      override_default_response_type: true,
      extras: { setup: {}, version: 'v5' },
    })
    expect(screen.getByText(en.whatsappConnect.inMeta)).toBeTruthy()
    expect(screen.getByText(en.whatsappConnect.waiting)).toBeTruthy()
    // Facebook's window being open never shows the connection as made.
    expect(screen.queryByText(en.whatsappConnect.setupPending)).toBeNull()
  })

  it('submits once with the session first, and shows setup pending only after the server saved it', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof complete>>) => void
    complete.mockReturnValue(new Promise((r) => (resolve = r)))
    renderPage()
    await launch()
    await post(JSON.stringify(SESSION))
    expect(complete).not.toHaveBeenCalled()
    await answerLogin('code-1')
    await post(JSON.stringify(SESSION))
    await answerLogin('code-2')
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1))
    expect(complete).toHaveBeenCalledWith({
      signupTicket: 'S'.repeat(43),
      code: 'code-1',
      session: {
        wabaIds: ['102290129340398'],
        phoneNumberId: '106540352242922',
        isOnBusinessApp: false,
      },
    })
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
    expect(screen.getByText(en.whatsappConnect.connected.pending)).toBeTruthy()
    expect(screen.getByText('+20 100 555 0101')).toBeTruthy()
    expect(screen.getByText(en.whatsappConnect.setupPending)).toBeTruthy()
    const timeline = screen.getByRole('list', {
      name: en.whatsappConnect.timeline.label,
    })
    expect(timeline.textContent).toContain(en.whatsappConnect.timeline.verified)
    expect(timeline.textContent).toContain(en.whatsappConnect.timeline.next)
    expect(
      screen
        .getByRole('list', { name: en.whatsappConnect.steps.label })
        .querySelector('[aria-current="step"]')?.textContent
    ).toContain(en.whatsappConnect.steps.setup)
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('submits once with the code first, then the session', async () => {
    renderPage()
    await launch()
    await answerLogin('code-1')
    await post(SESSION)
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1))
    expect(complete.mock.calls[0][0].session?.wabaIds).toEqual([
      '102290129340398',
    ])
  })

  it('ignores a session from an untrusted origin and goes ahead without hints after the wait', async () => {
    renderPage()
    await launch()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await post(JSON.stringify(SESSION), 'https://evilfacebook.com')
    await answerLogin('code-1')
    expect(complete).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(SESSION_WAIT_MS)
    })
    vi.useRealTimers()
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1))
    expect(complete.mock.calls[0][0].session).toBeNull()
  })

  it('treats a closed window as cancelled and allows another try', async () => {
    renderPage()
    await launch()
    await post({ type: 'WA_EMBEDDED_SIGNUP', event: 'CANCEL', data: {} })
    await answerLogin(null)
    expect(await screen.findByText(en.whatsappConnect.cancelled)).toBeTruthy()
    const again = screen.getByRole('button', {
      name: en.whatsappConnect.tryAgain,
    })
    fireEvent.click(again)
    expect(fb.login).toHaveBeenCalledTimes(2)
    expect(complete).not.toHaveBeenCalled()
  })

  it('explains a finish without the last click', async () => {
    renderPage()
    await launch()
    await post(SESSION)
    await answerLogin(null)
    expect(await screen.findByText(en.whatsappConnect.noCode)).toBeTruthy()
    expect(complete).not.toHaveBeenCalled()
  })

  it.each([
    ['2655093', en.whatsappConnect.metaErrors.sharedWithPartner],
    ['3441045', en.whatsappConnect.metaErrors.notEligible],
    ['4563015', en.whatsappConnect.metaErrors.updateApp],
    ['9999999', en.whatsappConnect.metaErrors.default],
  ])('gives guidance for Meta error %s', async (code, text) => {
    renderPage()
    await launch()
    await post({
      type: 'WA_EMBEDDED_SIGNUP',
      event: 'ERROR',
      data: { error_code: code, error_message: 'raw provider text' },
    })
    await answerLogin(null)
    expect(await screen.findByText(text)).toBeTruthy()
    expect(screen.queryByText('raw provider text')).toBeNull()
  })

  it('translates a refused completion and points back to settings', async () => {
    complete.mockRejectedValue(
      new ApiError('x', 409, 'WHATSAPP_NUMBER_ALREADY_CONNECTED')
    )
    renderPage()
    await launch()
    await post(SESSION)
    await answerLogin('code-1')
    expect(
      await screen.findByText(en.whatsappConnect.errors.numberAlreadyConnected)
    ).toBeTruthy()
    expect(screen.getByText(en.whatsappConnect.startAgain)).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: en.whatsappConnect.tryAgain })
    ).toBeNull()
  })

  it('reports an SDK that fails to load, and loads it again on request', async () => {
    delete window.FB
    renderPage()
    await waitFor(() =>
      expect(document.getElementById('akeed-facebook-sdk')).not.toBeNull()
    )
    const script = document.getElementById(
      'akeed-facebook-sdk'
    ) as HTMLScriptElement
    expect(script.src).toBe('https://connect.facebook.net/en_US/sdk.js')
    await act(async () => script.onerror?.(new Event('error')))
    expect(await screen.findByText(en.whatsappConnect.sdkFailed)).toBeTruthy()

    installFacebook()
    fireEvent.click(
      screen.getByRole('button', { name: en.whatsappConnect.retrySdk })
    )
    await launch()
    expect(fb.login).toHaveBeenCalledTimes(1)
  })

  it('stops listening when the page goes away', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const view = renderPage()
    await launch()
    view.unmount()
    expect(remove).toHaveBeenCalledWith('message', expect.any(Function))
    await answerLogin('late-code')
    expect(complete).not.toHaveBeenCalled()
    remove.mockRestore()
  })

  it('renders in Arabic', async () => {
    renderPage('ar')
    expect(
      await screen.findByRole('heading', { name: ar.whatsappConnect.title })
    ).toBeTruthy()
    expect(
      await screen.findByRole('button', { name: ar.whatsappConnect.launch })
    ).toBeTruthy()
  })
})
