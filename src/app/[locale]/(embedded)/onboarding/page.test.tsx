import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ar from '../../../../../public/messages/ar.json'
import { useEmbeddedOnboarding } from '@/features/onboarding'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import OnboardingPage from './page'

vi.mock('@/shared/hooks/useAkeedMode', () => ({ useAkeedMode: vi.fn() }))
vi.mock('@/shared/hooks/useAppBridgeLoading', () => ({
  useAppBridgeLoading: vi.fn(),
}))
vi.mock('@/shared/layout/skeletons', () => ({
  OnboardingPageSkeleton: () => <div data-testid="onboarding-skeleton" />,
}))
vi.mock('@/features/onboarding', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/features/onboarding')>()
  return {
    ...original,
    StandaloneOnboardingPage: () => <div data-testid="standalone-flow" />,
    useEmbeddedOnboarding: vi.fn(),
  }
})

const mockedMode = vi.mocked(useAkeedMode)
const mockedEmbedded = vi.mocked(useEmbeddedOnboarding)

function renderPage() {
  return render(
    <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">
      <OnboardingPage />
    </NextIntlClientProvider>
  )
}

function mode(isEmbedded: boolean, isLoading = false) {
  mockedMode.mockReturnValue({ isEmbedded, isLoading } as ReturnType<
    typeof useAkeedMode
  >)
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedEmbedded.mockReturnValue({
      isInitialLoading: true,
      test: { testState: null },
      settings: { storeName: '' },
    } as ReturnType<typeof useEmbeddedOnboarding>)
  })

  it('mounts only the standalone flow in standalone mode', () => {
    mode(false)
    renderPage()

    expect(screen.getByTestId('standalone-flow')).toBeTruthy()
    // The embedded hooks share the test query; mounting them here is what
    // sent a second test message once standalone confirmed.
    expect(mockedEmbedded).not.toHaveBeenCalled()
  })

  it('mounts only the embedded flow in embedded mode', () => {
    mode(true)
    renderPage()

    expect(mockedEmbedded).toHaveBeenCalled()
    expect(screen.queryByTestId('standalone-flow')).toBeNull()
  })

  it('waits for the mode before mounting either flow', () => {
    mode(false, true)
    renderPage()

    expect(screen.getByTestId('onboarding-skeleton')).toBeTruthy()
    expect(screen.queryByTestId('standalone-flow')).toBeNull()
    expect(mockedEmbedded).not.toHaveBeenCalled()
  })
})
